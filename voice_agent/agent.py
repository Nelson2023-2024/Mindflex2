import asyncio
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import (
    AgentSession,
    Agent,
    RoomInputOptions,
    UserInputTranscribedEvent,
    ConversationItemAddedEvent,
)
from livekit.plugins import google, noise_cancellation, silero, cartesia
from prompts import (
    AGENT_INSTRUCTION,
    MENTAL_SESSION_INSTRUCTION,
    PHYSICAL_SESSION_INSTRUCTION,
    GLOBAL_BEHAVIOR_INSTRUCTION,
)
from livekit.agents.llm import ImageContent, AudioContent, ChatMessage
import logging
from livekit import rtc
import json
import os
from datetime import datetime

os.makedirs("./conversations", exist_ok=True)
os.makedirs("./recommendations", exist_ok=True)
os.makedirs("./logs", exist_ok=True)

load_dotenv(".env.local")


# ---------------------------
# Assistant class with persistent global behavior
# ---------------------------
class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=GLOBAL_BEHAVIOR_INSTRUCTION + AGENT_INSTRUCTION,

            stt=cartesia.STT(
                model="ink-whisper",
                language="en",
            ),

            tts=cartesia.TTS(
                model="sonic-3",
            ),

            llm=google.LLM(
                model="gemini-2.5-flash",
                temperature=0.8,
            ),

            vad=silero.VAD.load(),
        )


# ---------------------------
# Utility: simple sentiment/tone hint detector (lightweight)
# ---------------------------
def detect_sentiment_hint(text: str) -> str:
    lower = text.lower()
    # very small keyword-based detector for tone modulation
    low_words = [
        "tired",
        "tire",
        "stressed",
        "stressing",
        "sad",
        "anxious",
        "worried",
        "down",
        "depressed",
        "overwhelmed",
    ]
    high_words = ["good", "great", "energized", "happy", "awesome", "fine", "well"]
    if any(w in lower for w in low_words):
        return "low"
    if any(w in lower for w in high_words):
        return "high"
    return "neutral"


# ---------------------------
# Entrypoint
# ---------------------------
async def entrypoint(ctx: agents.JobContext):
    session = AgentSession()
    session_mode = "mental"  # default startup mode
    conversation = []
    message_data = {}  # safe default

    # Helper to build instructions with tone hint and optional soft transition
    def build_mode_instructions(mode: str, tone_hint: str = "neutral"):
        mode_instr = (
            MENTAL_SESSION_INSTRUCTION
            if mode == "mental"
            else PHYSICAL_SESSION_INSTRUCTION
        )
        soft_transition = f"\nYou’re now in {mode} wellness mode — let’s continue naturally from where we left off.\n"
        # Keep GLOBAL_BEHAVIOR_INSTRUCTION persistent + optional tone hint guideline
        tone_guideline = f"\n(When replying, adopt a '{tone_hint}' energy level in tone and pacing.)\n"
        return (
            GLOBAL_BEHAVIOR_INSTRUCTION + soft_transition + tone_guideline + mode_instr
        )

    # ---------------------------~
    # Session switching
    # ---------------------------
    async def switch_session_mode(mode: str, tone_hint: str = "neutral"):
        nonlocal session_mode
        if mode == session_mode:
            # no-op if already in mode; optionally remind softly
            await session.generate_reply(
                instructions=f"{GLOBAL_BEHAVIOR_INSTRUCTION}\nWe’re already in {mode} mode — continuing from here."
            )
            return

        session_mode = mode
        # Soft verbal acknowledgment + mode instructions
        await session.generate_reply(
            instructions=build_mode_instructions(mode, tone_hint)
        )

    # ---------------------------
    # Event handlers
    # ---------------------------
    # Track last processed transcript to prevent duplicate replies
    last_transcript = ""

    def on_user_input_transcribed(event: UserInputTranscribedEvent):
        asyncio.create_task(handle_user_input_transcribed(event))

    async def handle_user_input_transcribed(event: UserInputTranscribedEvent):
        nonlocal last_transcript, session_mode
        transcript = event.transcript.strip()

        # Only process final recognized speech (ignore partials)
        if not event.is_final or not transcript:
            return

        # Skip duplicate messages caused by re-emission or jitter
        if transcript == last_transcript:
            return
        last_transcript = transcript

        logging.info(
            f"USER({event.speaker_id}): {transcript} "
            f"(lang={event.language}, final={event.is_final})"
        )
        print(f"USER({event.speaker_id}): {transcript}")

        lower = transcript.lower()

        # Mode switching commands
        if "mental session" in lower or "mental wellness" in lower:
            await switch_session_mode("mental")
            return

        elif "physical session" in lower or "physical wellness" in lower:
            await switch_session_mode("physical")
            return

    session.on("user_input_transcribed", on_user_input_transcribed)

    # Conversation item logging
    @session.on("conversation_item_added")
    def on_conversation_item_added(event: ConversationItemAddedEvent):
        try:
            print(
                f"Conversation item added from {event.item.role}: {event.item.text_content}. "
                f"interrupted: {event.item.interrupted}"
            )
            for content in event.item.content:
                if isinstance(content, str):
                    print(f" - text: {content}")
                elif isinstance(content, ImageContent):
                    print(f" - image: {content.image}")
                elif isinstance(content, AudioContent):
                    print(f" - audio frame, transcript available")

            # store both assistant and user items in conversation list
            conversation.append(
                {
                    "id": getattr(event.item, "id", None),
                    "role": event.item.role,
                    "text": event.item.text_content,
                    "interrupted": event.item.interrupted,
                    "created_at": getattr(event.item, "created_at", None),
                }
            )

            if event.item.role == "assistant":
                logging.info(
                    f"ASSISTANT({getattr(event.item, 'id', '')}): {event.item.text_content} (interrupted={event.item.interrupted})"
                )
        except Exception as e:
            logging.error(f"Error in conversation_item_added handler: {e}")

    # ---------------------------
    # Data packet handler (typed chat)
    # ---------------------------
    def on_data_received_sync(data: rtc.DataPacket):
        asyncio.create_task(on_data_received_async(data))

    async def on_data_received_async(data: rtc.DataPacket):
        nonlocal message_data
        try:
            # try JSON first
            payload = data.data.decode("utf-8")
            parsed = json.loads(payload)
            message_data = parsed  # store last parsed data safely
            # safe logging: use .get to avoid KeyError
            logging.info(
                f"Received data message: {parsed.get('message', '<no message field>')}"
            )
            # Handle typed chat messages - DON'T echo them back
            if parsed.get("type") == "chat":
                user_message = parsed.get("text", "")
                logging.info(f"User typed: {user_message}")
                # generate reply that will also be spoken
                tone_hint = detect_sentiment_hint(user_message or "")
                meta = f"Maintain a '{tone_hint}' energy and flow naturally. {GLOBAL_BEHAVIOR_INSTRUCTION}"
                # await session.generate_reply(user_input=user_message, instructions=meta)
            else:
                # handle other structured data if needed
                pass

        except json.JSONDecodeError:
            # Handle plain text messages
            text_message = data.data.decode("utf-8").strip()
            if text_message:
                logging.info(f"Received plain text: {text_message}")
                tone_hint = detect_sentiment_hint(text_message)
                meta = f"Maintain a '{tone_hint}' energy and flow naturally. {GLOBAL_BEHAVIOR_INSTRUCTION}"
                # await session.generate_reply(user_input=text_message, instructions=meta)
        except Exception as e:
            logging.error(f"Error handling data packet: {e}")

    ctx.room.on("data_received", on_data_received_sync)

    # ---------------------------
    # Connect and start session
    # ---------------------------
    await ctx.connect()

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            video_enabled=True,
            noise_cancellation=noise_cancellation.BVC(),
            close_on_disconnect=False,
        ),
    )

    # Default startup: provide mental session instruction with global behavior applied
    try:
        await session.generate_reply(
            instructions=GLOBAL_BEHAVIOR_INSTRUCTION + MENTAL_SESSION_INSTRUCTION
        )
    except Exception as e:
        logging.error(f"Error sending initial session instruction: {e}")

    # ---------------------------
    # Graceful disconnect handling (save conversation)
    # ---------------------------
    @ctx.room.on("disconnected")
    def on_room_disconnected():
        asyncio.create_task(handle_room_disconnected())

    async def handle_room_disconnected():
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            # try to build a readable room name; fallback to timestamp
            try:
                room_name = (
                    message_data.get("from", {})
                    .get("engine", {})
                    .get("latestJoinResponse", {})
                    .get("room", {})
                    .get("name")
                )
                if not room_name:
                    raise ValueError("no room name")
            except Exception:
                room_name = f"session_{timestamp}"

            conv_file = f"./conversations/{room_name}_{timestamp}.json"
            with open(conv_file, "w", encoding="utf-8") as f:
                json.dump(conversation, f, indent=2, ensure_ascii=False)

            logging.info(f"Session ended, data saved to {conv_file}.")
        except Exception as e:
            logging.error(f"Error in handle_room_disconnected: {e}")


# ---------------------------
# Logging setup and runner
# ---------------------------
logging.basicConfig(
    filename="./logs/app.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
