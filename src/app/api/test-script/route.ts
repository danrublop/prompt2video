import { NextRequest, NextResponse } from 'next/server'
import { generateScript, generateWhiteboardPlan } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, duration = 60, language = 'English' } = body
    
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 422 }
      )
    }

    console.log(`Testing script generation for: "${prompt}"`)

    // Test script generation
    console.log('Step 1: Testing script generation...')
    const script = await generateScript(prompt.trim(), duration, language)
    console.log(`Generated script with ${script.scenes.length} scenes`)

    // Test whiteboard plan generation for first scene
    console.log('Step 2: Testing whiteboard plan generation...')
    const firstScene = script.scenes[0]
    const steps = await generateWhiteboardPlan(firstScene.narration, firstScene.imageDescription)
    console.log(`Generated ${steps.length} steps for first scene`)

    return NextResponse.json({
      success: true,
      script: {
        title: script.title,
        totalDuration: script.totalDuration,
        scenes: script.scenes.map(scene => ({
          sceneId: scene.sceneId,
          goal: scene.goal,
          narration: scene.narration.substring(0, 100) + '...',
          caption: scene.caption,
          imageDescription: scene.imageDescription.substring(0, 100) + '...',
          duration: scene.duration
        }))
      },
      firstSceneSteps: steps
    })

  } catch (error) {
    console.error('Script generation test failed:', error)
    return NextResponse.json(
      { 
        error: 'Script generation test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
