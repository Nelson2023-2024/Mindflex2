import asyncio
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, UserInputTranscribedEvent, ConversationItemAddedEvent
from livekit.plugins import google, noise_cancellation, silero
from prompts import AGENT_INSTRUCTION, MENTAL_SESSION_INSTRUCTION, PHYSICAL_SESSION_INSTRUCTION
from livekit.agents.llm import ImageContent, AudioContent, ChatMessage
import logging
from livekit import rtc
import json
import os

load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=AGENT_INSTRUCTION,
            llm=google.beta.realtime.RealtimeModel(voice="Aoede", temperature=0.0),
            vad=silero.VAD.load(),
        )


async def entrypoint(ctx: agents.JobContext):
    session = AgentSession()
    session_mode = "mental"  # default startup mode

    async def switch_session_mode(mode: str):
        """Switch between mental and physical session modes with smooth acknowledgment."""
        nonlocal session_mode
        session_mode = mode

        if mode == "mental":
            await session.generate_reply(
                instructions="You’ve chosen to focus on your mental wellbeing. Let’s take a mindful pause and start from there."
            )
            await session.generate_reply(instructions=MENTAL_SESSION_INSTRUCTION)

        elif mode == "physical":
            await session.generate_reply(
                instructions="Got it. Let’s switch gears and do a quick physical wellness check-in."
            )
            await session.generate_reply(instructions=PHYSICAL_SESSION_INSTRUCTION)

    def on_user_input_transcribed(event: UserInputTranscribedEvent):
        asyncio.create_task(handle_user_input_transcribed(event))

    async def handle_user_input_transcribed(event: UserInputTranscribedEvent):
        transcript = event.transcript.strip()
        logging.info(
            f"USER({event.speaker_id}): {transcript} "
            f"(lang={event.language}, final={event.is_final})"
        )
        print(f"USER({event.speaker_id}): {transcript}")

        lower = transcript.lower()

        # Mode switching based on user request
        if "mental session" in lower or "mental wellness" in lower:
            await switch_session_mode("mental")
            return
        elif "physical session" in lower or "physical wellness" in lower:
            await switch_session_mode("physical")
            return
        # Otherwise continue the current session (LLM handles context automatically)

    session.on("user_input_transcribed", on_user_input_transcribed)

    @session.on("conversation_item_added")
    def on_conversation_item_added(event: ConversationItemAddedEvent):
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
                print(f" - audio: {content.frame}, transcript: {content.transcript}")

    # Handle incoming data (typed chat messages)
    def on_data_received_sync(data: rtc.DataPacket):
        asyncio.create_task(on_data_received_async(data))

    async def on_data_received_async(data: rtc.DataPacket):
        try:
            message_data = json.loads(data.data.decode('utf-8'))
            logging.info(f"Received data: {message_data}")

            # Handle typed chat messages - DON'T echo them back
            if message_data.get('type') == 'chat':
                user_message = message_data.get('text', '')
                logging.info(f"User typed: {user_message}")

                # Generate response to the typed message
                # This will trigger the voice response and transcription
                await session.generate_reply(user_input=user_message)

        except json.JSONDecodeError:
            # Handle plain text messages
            text_message = data.data.decode('utf-8').strip()
            if text_message:
                logging.info(f"Received plain text: {text_message}")
                await session.generate_reply(user_input=text_message)
        except Exception as e:
            logging.error(f"Error handling data: {e}")

    # Set up room event listeners
    ctx.room.on("data_received", on_data_received_sync)

    # Connect to room
    await ctx.connect()

    # Start agent
    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            video_enabled=True,
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Default startup: mental wellness session
    await session.generate_reply(
        instructions=MENTAL_SESSION_INSTRUCTION
    )

log_dir = "./logs"

# Ensure directory exists
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

logging.basicConfig(filename="./logs/app.log", level=logging.INFO)

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
