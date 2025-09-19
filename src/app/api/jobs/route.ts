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

    // Create and process job
    const job = await simpleProcessor.createJob({
      prompt: body.prompt.trim(),
      aspectRatio: body.aspectRatio || '16:9',
      duration: body.duration || 150, // 2.5 minutes default
      languages: body.languages || ['en'],
      voiceId: body.voiceId,
      styleProfile: body.styleProfile,
      script: body.script, // Pass through the script from storyboard
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
