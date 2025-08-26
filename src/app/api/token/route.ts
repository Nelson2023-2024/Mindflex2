// app/api/livekit-token/route.ts
import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, username, firstName } = body;

    if (!room || !username) {
      return NextResponse.json(
        { error: 'Missing required parameters: room and username' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      console.error('Missing LiveKit environment variables:', {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasWsUrl: !!wsUrl
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );   
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, { 
      identity: username,
      // Add user metadata for agent to access
      metadata: JSON.stringify({
        firstName: firstName || 'User',
        timestamp: new Date().toISOString()
      })
    });
    
    // Grant permissions
    at.addGrant({ 
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    
    console.log('Token generated successfully for:', { room, username });
    
    return NextResponse.json({ 
      token,
      wsUrl: wsUrl,
      room
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}