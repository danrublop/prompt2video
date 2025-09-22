import { NextRequest, NextResponse } from 'next/server'
import { heygenClient } from '@/lib/heygen'

export async function GET() {
  try {
    const voices = await heygenClient.getVoices()
    return NextResponse.json({ ok: true, voicesCount: voices.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json()
    const sample = typeof text === 'string' && text.trim().length > 0
      ? text
      : 'This is a short HeyGen voice test.'
    const effectiveVoiceId = voiceId || process.env.HEYGEN_VOICE_ID || ''
    if (!effectiveVoiceId) {
      return NextResponse.json({ ok: false, error: 'Missing voiceId. Provide in body or set HEYGEN_VOICE_ID.' }, { status: 400 })
    }

    const audioBuffer = await heygenClient.generateAndWaitForCompletion(sample, effectiveVoiceId)

    return NextResponse.json({ ok: true, bytes: audioBuffer.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}


