import { NextRequest, NextResponse } from 'next/server'
import { simpleProcessor } from '@/lib/simple-processor'
import { multiLanguageProcessor } from '@/lib/multi-language-processor'

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

    // Use multi-language processor if multi-language is requested
    const processor = body.multiLanguage ? multiLanguageProcessor : simpleProcessor
    
    // Create and process job
    const job = await processor.createJob({
      prompt: body.prompt.trim(),
      aspectRatio: body.aspectRatio || '16:9',
      duration: body.duration || 150, // 2.5 minutes default
      language: body.language || 'English',
      voiceId: body.voiceId,
      styleProfile: body.styleProfile,
      script: body.script, // Pass the script if provided
      multiLanguage: body.multiLanguage,
      targetLanguages: body.targetLanguages,
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
