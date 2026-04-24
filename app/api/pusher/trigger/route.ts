import Pusher from 'pusher';
import { NextRequest, NextResponse } from 'next/server';

const appId = process.env.PUSHER_APP_ID || '';
const key = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
const secret = process.env.PUSHER_SECRET || '';
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';

const pusher = new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});

export async function POST(request: NextRequest) {
  const { channelName, eventName, data } = await request.json();

  if (!channelName || !eventName) {
    return NextResponse.json(
      { error: 'Missing channelName or eventName' },
      { status: 400 }
    );
  }

  try {
    await pusher.trigger(channelName, eventName, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger event' },
      { status: 500 }
    );
  }
}