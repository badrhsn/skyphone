import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-simple';

export async function POST(request: NextRequest) {
  try {
    const { recordingSid } = await request.json();
    if (!recordingSid) return NextResponse.json({ error: 'recordingSid required' }, { status: 400 });

    const client = await getTwilioClient();
    if (!client) return NextResponse.json({ error: 'Twilio client not available' }, { status: 500 });

    // Attempt to stop/update the recording
    const updated = await client.recordings(recordingSid).update({ status: 'stopped' });

    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    console.error('Stop recording error', err);
    return NextResponse.json({ error: err?.message || 'Failed to stop recording' }, { status: 500 });
  }
}
