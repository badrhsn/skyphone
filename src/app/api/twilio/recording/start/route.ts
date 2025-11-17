import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-simple';

export async function POST(request: NextRequest) {
  try {
    const { callSid } = await request.json();
    if (!callSid) return NextResponse.json({ error: 'callSid required' }, { status: 400 });

    const client = await getTwilioClient();
    if (!client) return NextResponse.json({ error: 'Twilio client not available' }, { status: 500 });

    const recording = await client.calls(callSid).recordings.create({
      // optional params can be added
    });

    return NextResponse.json({ success: true, recordingSid: recording.sid, recording });
  } catch (err: any) {
    console.error('Start recording error', err);
    return NextResponse.json({ error: err?.message || 'Failed to start recording' }, { status: 500 });
  }
}
