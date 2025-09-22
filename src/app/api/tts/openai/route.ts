import { NextRequest, NextResponse } from 'next/server'
import { generateSpeech } from '@/lib/openai'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text') || 'This is a test of OpenAI text to speech.'
    const voice = searchParams.get('voice') || 'alloy'

    const audioBuffer = await generateSpeech(text, voice)
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    const message = error?.message || 'Failed to generate speech'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const text = (body.text as string) || 'This is a test of OpenAI text to speech.'
    const voice = (body.voice as string) || 'alloy'

    const audioBuffer = await generateSpeech(text, voice)
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    const message = error?.message || 'Failed to generate speech'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}


