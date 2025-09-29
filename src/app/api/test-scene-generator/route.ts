import { NextRequest, NextResponse } from 'next/server'
import { createSceneGenerator } from '@/lib/scene-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { narration = 'A friendly teacher explains renewable energy concepts with simple diagrams and clear explanations', aspectRatio = '16:9', duration = 30 } = body

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('Testing scene generator with narration:', narration)
    
    const sceneGenerator = createSceneGenerator(openaiApiKey)
    
    // Generate scenes from the narration
    const result = await sceneGenerator.generateScenes({
      narration,
      aspectRatio,
      duration
    })

    console.log(`Generated ${result.scenes.length} scenes`)

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${result.scenes.length} scenes`,
      scenes: result.scenes.map(scene => ({
        sceneId: scene.sceneId,
        narration: scene.narration,
        duration: scene.duration,
        storyboard: scene.storyboard
      })),
      totalDuration: result.totalDuration
    })

  } catch (error) {
    console.error('Scene generator test error:', error)
    return NextResponse.json(
      { 
        error: 'Scene generator test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
