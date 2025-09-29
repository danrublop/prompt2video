import { NextRequest, NextResponse } from 'next/server'
import { generateScript, generateImage, generateSpeech, generateWhiteboardPlan } from '@/lib/openai'
import { videoComposer } from '@/lib/video-composer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt = 'Explain how a plant grows' } = body
    
    console.log(`Testing single scene generation for: "${prompt}"`)

    // Step 1: Generate Script
    console.log('Step 1: Generating script...')
    const script = await generateScript(prompt.trim(), 30, 'English')
    console.log(`Generated script with ${script.scenes.length} scenes`)

    // Take only the first scene
    const scene = script.scenes[0]
    console.log(`Testing with scene: ${scene.sceneId}`)

    // Step 2: Generate assets for single scene
    console.log('Step 2: Generating assets for single scene...')
    
    // Generate whiteboard plan
    console.log('  - Generating whiteboard plan...')
    const steps = await generateWhiteboardPlan(scene.narration, scene.imageDescription)
    console.log(`  - Generated ${steps.length} steps:`, steps)
    
    // Generate image
    console.log('  - Generating image...')
    const imageBuffer = await generateImage(`Professional whiteboard diagram with clean design, educational content, appropriate for all audiences. ${scene.imageDescription}`)
    console.log(`  - Image generated, size: ${imageBuffer.length} bytes`)
    
    // Generate audio
    console.log('  - Generating audio...')
    const audioBuffer = await generateSpeech(scene.narration, 'alloy')
    console.log(`  - Audio generated, size: ${audioBuffer.length} bytes`)

    // Step 3: Test video composition
    console.log('Step 3: Testing video composition...')
    const whiteboardScene = {
      kind: 'WHITEBOARD',
      sceneId: scene.sceneId,
      imageBuffer,
      audioBuffer,
      caption: scene.caption,
      duration: scene.duration,
      steps
    }

    const compositionOptions = {
      aspectRatio: '16:9' as const,
      scenes: [whiteboardScene]
    }

    console.log('  - Calling video composer with subtitles...')
    const finalVideoBuffer = await videoComposer.composeVideo(compositionOptions, ['en'])
    console.log(`  - Video composed with subtitles, size: ${finalVideoBuffer.length} bytes`)

    // Convert to base64
    const videoBase64 = finalVideoBuffer.toString('base64')
    
    console.log('Single scene test completed successfully!')

    return NextResponse.json({
      success: true,
      video: `data:video/mp4;base64,${videoBase64}`,
      scene: {
        sceneId: scene.sceneId,
        narration: scene.narration,
        caption: scene.caption,
        duration: scene.duration,
        steps
      }
    })

  } catch (error) {
    console.error('Single scene test failed:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Single scene test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
