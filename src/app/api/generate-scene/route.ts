import { NextRequest, NextResponse } from 'next/server'
import { createSceneGenerator } from '@/lib/scene-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { narration, aspectRatio = '16:9', duration = 60 } = body

    if (!narration) {
      return NextResponse.json(
        { error: 'Narration is required' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const sceneGenerator = createSceneGenerator(openaiApiKey)
    
    // Generate scenes from the narration
    const result = await sceneGenerator.generateScenes({
      narration,
      aspectRatio,
      duration
    })

    return NextResponse.json({
      success: true,
      scenes: result.scenes.map(scene => ({
        sceneId: scene.sceneId,
        narration: scene.narration,
        duration: scene.duration,
        // Don't send the actual video buffer in the response
        // The client should request individual scene videos separately
      })),
      totalDuration: result.totalDuration
    })

  } catch (error) {
    console.error('Scene generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scenes' },
      { status: 500 }
    )
  }
}
