import { NextRequest, NextResponse } from 'next/server'
import { simpleProcessor } from '@/lib/simple-processor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.prompt || body.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 422 }
      )
    }

    console.log('Creating job with data:', {
      prompt: body.prompt,
      languages: body.languages,
      hasScript: !!body.script,
      aspectRatio: body.aspectRatio,
      duration: body.duration
    })

    // Validate TTS provider prerequisites
    if (body.ttsProvider === 'openai') {
      const key = process.env.OPENAI_API_KEY
      if (!key || key === 'mock' || key === 'your_openai_api_key_here') {
        return NextResponse.json(
          { error: 'OpenAI TTS selected but OPENAI_API_KEY is not set on the server.' },
          { status: 422 }
        )
      }
    }

    // Create and process job
    const job = await simpleProcessor.createJob({
      prompt: body.prompt.trim(),
      aspectRatio: body.aspectRatio || '16:9',
      duration: body.duration || 150, // 2.5 minutes default
      languages: body.languages || ['en'],
      voiceId: body.voiceId,
      ttsProvider: body.ttsProvider,
      openaiVoice: body.openaiVoice,
      styleProfile: body.styleProfile,
      script: body.script, // Pass through the script from storyboard
    })

    console.log('Job created successfully:', {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt
    })

    return NextResponse.json({
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
    })

  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
