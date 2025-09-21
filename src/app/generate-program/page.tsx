// src/app/generate-program/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useRoomContext,
  useTracks,
  useVoiceAssistant,
  useLocalParticipant,
  VideoTrack,
  useParticipants,
  useTranscriptions,
  useChat,
} from "@livekit/components-react";
import { Track, ConnectionState } from "livekit-client";
import "@livekit/components-styles";
import { Mic, MicOff, Video, VideoOff, MessageCircle, Send } from "lucide-react";

type TranscriptMessage = {
  content: string;
  role: "user" | "assistant";
  timestamp: number;
  type: "voice";
};

type ChatMessage = {
  message: string;
  from: "YOU" | "AGENT";
  timestamp: number;
  type: "chat";
};

function MindFlexSession() {
  const room = useRoomContext();
  const { state: assistantState, audioTrack: assistantAudioTrack } = useVoiceAssistant();
  const localParticipant = useLocalParticipant()?.localParticipant;
  const participants = useParticipants();
  const transcriptions = useTranscriptions();
  const chat = useChat();
  const tracks = useTracks([Track.Source.Microphone, Track.Source.Camera], { onlySubscribed: false });

  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [callEnded, setCallEnded] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const { user } = useUser();
  const router = useRouter();

  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Derive agent presence (use participant.isAgent from components-react)
  const agentConnected = participants.some((p) => (p as any).isAgent === true);

  // Build transcript messages from useTranscriptions()
  const transcriptMessages: TranscriptMessage[] = useMemo(() => {
    return transcriptions.map((t) => {
      const isLocal = t.participantInfo?.identity === room?.localParticipant?.identity;
      return {
        content: t.text,
        role: isLocal ? "user" : "assistant",
        timestamp: t.streamInfo.timestamp ?? Date.now(),
        type: "voice",
      };
    });
  }, [transcriptions, room]);

  // Build chat messages from useChat()
  const chatMessages: ChatMessage[] = useMemo(() => {
    return chat.chatMessages.map((m) => {
      const isLocal = m.from?.isLocal ?? false;
      return {
        message: m.message,
        from: isLocal ? "YOU" : "AGENT",
        timestamp: m.timestamp,
        type: "chat",
      };
    });
  }, [chat.chatMessages]);

  // auto-scroll transcript and chat when updated
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcriptMessages.length]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  // navigate after call ends
  useEffect(() => {
    if (callEnded) {
      const t = setTimeout(() => router.push("/profile"), 3000);
      return () => clearTimeout(t);
    }
  }, [callEnded, router]);

  // Watch connection state of the room: if disconnected, mark ended
  useEffect(() => {
    if (!room) return;
    const onConn = (st: ConnectionState) => {
      if (st === "disconnected") setCallEnded(true);
    };
    room.on("connectionStateChanged", onConn);
    return () => {
      room.off("connectionStateChanged", onConn);
    };
  }, [room]);

  // Toggle camera/mic using the provided localParticipant helper methods
  const toggleCamera = async () => {
    if (!localParticipant) return;
    try {
      const newEnabled = !isCameraEnabled;
      await localParticipant.setCameraEnabled(newEnabled);
      setIsCameraEnabled(newEnabled);
    } catch (e) {
      console.error("toggleCamera error", e);
    }
  };

  const toggleMicrophone = async () => {
    if (!localParticipant) return;
    try {
      const newEnabled = !isMicEnabled;
      await localParticipant.setMicrophoneEnabled(newEnabled);
      setIsMicEnabled(newEnabled);
    } catch (e) {
      console.error("toggleMicrophone error", e);
    }
  };

  // Send chat using the useChat() send helper
  const sendChatMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    try {
      await chat.send(trimmed); // send via LiveKit text stream
      setChatInput("");
    } catch (e) {
      console.error("sendChatMessage error", e);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const isSpeaking = assistantState === "speaking";
  const isListening = assistantState === "listening";
  const isConnected = room?.state === "connected" || room?.state === "connected"; // fallback

  // user's camera video track (local)
  const userVideoTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && t.participant === localParticipant
  );

  const endCall = () => {
    if (room) room.disconnect();
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-6xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Have a voice conversation with MindFlex to create your personalized plan
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* VIDEO CALL AREA */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI ASSISTANT CARD */}
            <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
              <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
                {/* AI VOICE ANIMATION */}
                <div className={`absolute inset-0 ${isSpeaking ? "opacity-30" : "opacity-0"} transition-opacity duration-300`}>
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`mx-1 h-16 w-1 bg-primary rounded-full ${isSpeaking ? "animate-sound-wave" : ""}`}
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          height: isSpeaking ? `${Math.random() * 50 + 20}%` : "5%",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* AI IMAGE */}
                <div className="relative size-32 mb-4">
                  <div className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg ${isSpeaking ? "animate-pulse" : ""}`} />
                  <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10"></div>
                    <img src="/ai-avatar.png" alt="MindFlex Assistant" className="w-full h-full object-cover" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-foreground">MindFlex</h2>
                <p className="text-sm text-muted-foreground mt-1">Wellness Assistant</p>

                {/* CONNECTION STATUS */}
                <div className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border ${isConnected && agentConnected ? "border-primary" : "border-border"}`}>
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-primary animate-pulse" : isListening ? "bg-green-500 animate-pulse" : isConnected && agentConnected ? "bg-blue-500" : "bg-muted"}`} />
                  <span className="text-xs text-muted-foreground">
                    {isSpeaking ? "Speaking..." : isListening ? "Listening..." : callEnded ? "Session ended..." : isConnected && agentConnected ? "Connected" : isConnected ? "Waiting for agent..." : "Connecting..."}
                  </span>
                </div>
              </div>
            </Card>

            {/* USER CARD */}
            <Card className="bg-card/90 backdrop-blur-sm border overflow-hidden relative">
              <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
                <div className="relative size-32 mb-4">
                  {userVideoTrack && isCameraEnabled ? (
                    <VideoTrack trackRef={userVideoTrack} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <img src={user?.imageUrl} alt="User" className="size-full object-cover rounded-full" />
                  )}
                </div>

                <h2 className="text-xl font-bold text-foreground">You</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {user ? (user.firstName + " " + (user.lastName || "")).trim() : "Guest"}
                </p>

                <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border">
                  <div className={`w-2 h-2 rounded-full ${isMicEnabled ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-xs text-muted-foreground">{isMicEnabled ? "Ready" : "Muted"}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* CHAT SIDEBAR */}
          <div className="lg:col-span-1">
            <Card className="bg-card/90 backdrop-blur-sm border border-border h-full flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Chat</h3>
                <Button variant="ghost" size="sm" onClick={() => { /* toggle chat in your layout if desired */ }}>
                  <MessageCircle size={16} />
                </Button>
              </div>

              <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3" style={{ maxHeight: "400px" }}>
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm">Conversation will appear here...</div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className="text-sm">
                      <div className={`font-medium text-xs mb-1 ${msg.from === "AGENT" ? "text-blue-400" : "text-green-400"}`}>{msg.from}:</div>
                      <p className="text-foreground break-words">{msg.message}</p>
                      <div className="text-xs text-muted-foreground mt-1">{msg.type === "chat" ? "💬" : "🎤"}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={callEnded}
                  />
                  <Button onClick={sendChatMessage} disabled={!chatInput.trim() || callEnded} size="sm">
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* TRANSCRIPT */}
        {transcriptMessages.length > 0 && (
          <div ref={transcriptContainerRef} className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-8 h-64 overflow-y-auto transition-all duration-300 scroll-smooth">
            <h3 className="font-semibold mb-4 text-sm text-muted-foreground">Voice Conversation Transcript</h3>
            <div className="space-y-3">
              {transcriptMessages.map((msg, i) => (
                <div key={i} className="message-item animate-fadeIn">
                  <div className="font-semibold text-xs text-muted-foreground mb-1">{msg.role === "assistant" ? "MindFlex" : "You"}:</div>
                  <p className="text-foreground">{msg.content}</p>
                </div>
              ))}
              {callEnded && (
                <div className="message-item animate-fadeIn">
                  <div className="font-semibold text-xs text-primary mb-1">System:</div>
                  <p className="text-foreground">Your wellness program has been created! Redirecting to your profile...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div className="w-full flex justify-center gap-4">
          <Button onClick={toggleMicrophone} variant={isMicEnabled ? "secondary" : "destructive"} size="lg" className="rounded-full p-4" disabled={callEnded}>
            {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </Button>

          <Button onClick={toggleCamera} variant={isCameraEnabled ? "secondary" : "outline"} size="lg" className="rounded-full p-4" disabled={callEnded}>
            {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </Button>

          <Button className={`px-8 text-lg rounded-3xl ${callEnded ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"} text-white`} onClick={endCall} disabled={callEnded}>
            {callEnded ? "Redirecting..." : "End Session"}
          </Button>
        </div>

        <RoomAudioRenderer />
        <StartAudio label="Click to enable audio" />
      </div>
    </div>
  );
}

export default function GenerateProgramPage() {
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const { user } = useUser();

  const connectToRoom = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: "mindflex-wellness",
          username: user?.id || `user-${Date.now()}`,
          firstName: user?.firstName,
        }),
      });

      if (!res.ok) throw new Error("Failed to get access token");

      const data = await res.json();
      setToken(data.participantToken || data.token || "");
      setWsUrl(data.serverUrl || data.wsUrl || "");
      setConnected(true);
    } catch (err) {
      console.error("Connection failed:", err);
      alert("Failed to connect. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col min-h-screen text-foreground items-center justify-center pb-6 pt-24">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            <span>Start Your </span>
            <span className="text-primary uppercase">Wellness Journey</span>
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md">Connect with MindFlex, your dedicated wellness assistant with a touch of class</p>
          <Button onClick={connectToRoom} disabled={connecting} className="bg-primary hover:bg-primary/90 px-8 py-3 rounded-3xl font-semibold text-lg">
            {connecting ? "Connecting..." : "Start Wellness Session"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom video audio token={token} serverUrl={wsUrl} className="h-screen" onConnected={() => console.log("Room connected")} onDisconnected={() => setConnected(false)}>
      <MindFlexSession />
    </LiveKitRoom>
  );
}
