// lib/livekit.ts - LiveKit utility functions (optional)
import { Room, RoomOptions, VideoPresets } from 'livekit-client';

export const createRoom = (options?: RoomOptions): Room => {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    },
    ...options,
  });
};

export const getRoomUrl = () => {
  return process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;
};

// types/livekit.ts - TypeScript types (optional)
export interface TokenResponse {
  token: string;
  wsUrl: string;
}

export interface TokenRequest {
  room: string;
  username: string;
}