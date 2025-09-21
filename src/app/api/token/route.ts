// app/api/token/route.ts
import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

// Environment variables
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// Don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function POST(req: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Parse request body
    const body = await req.json();
    const { room, username, firstName } = body;
    
    // Use provided room or generate one
    const roomName = room || `mindflex_room_${Math.floor(Math.random() * 10_000)}`;
    const participantName = firstName || username || 'user';
    const participantIdentity = username || `mindflex_user_${Math.floor(Math.random() * 10_000)}`;

    // Parse agent configuration from request body (if any)
    const agentName: string = body?.room_config?.agents?.[0]?.agent_name;

    // Generate participant token
    const participantToken = await createParticipantToken(
      { 
        identity: participantIdentity, 
        name: participantName,
        // Add user metadata for agent to access
        metadata: JSON.stringify({
          firstName: firstName || 'User',
          timestamp: new Date().toISOString()
        })
      },
      roomName,
      agentName
    );

    // Return connection details in the expected format
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };
    
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    
    console.log('Token generated successfully for:', { roomName, participantName, participantIdentity });
    
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('Token generation error:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Failed to generate access token', { status: 500 });
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  
  at.addGrant(grant);

  // Add room configuration for agent if specified
  if (agentName) {
    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName }],
    });
  }

  return at.toJwt();
}