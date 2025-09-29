import { NextRequest, NextResponse } from 'next/server'
import { generateScript, generateImage, generateSpeech, calculateTokenCost, generateWhiteboardPlan } from '@/lib/openai'
import { videoComposer } from '@/lib/video-composer'
import { retryOperation } from '@/lib/retry'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, aspectRatio = '16:9', duration = 60, language = 'English', voice = 'alloy' } = body
    
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 422 }
      )
    }

    console.log(`Starting SIMPLE whiteboard video generation for: "${prompt}"`)

    // Step 1: Generate Script with GPT (limit to 3 scenes for faster processing)
    console.log('Step 1: Generating script...')
    const script = await generateScript(prompt.trim(), Math.min(duration, 90), language)
    console.log(`Generated script with ${script.scenes.length} scenes`)

    // Limit to first 3 scenes for faster processing
    const limitedScenes = script.scenes.slice(0, 3)
    console.log(`Processing only first ${limitedScenes.length} scenes for faster generation`)

    // Step 2: Generate Whiteboard Assets for each scene
    console.log('Step 2: Generating whiteboard assets...')
    const whiteboardScenes = []
    
    for (let i = 0; i < limitedScenes.length; i++) {
      const scene = limitedScenes[i]
      console.log(`Processing scene ${i + 1}/${limitedScenes.length}: ${scene.sceneId}`)
      
      try {
        // Generate whiteboard plan (step-by-step bullets)
        console.log(`  - Generating whiteboard plan for scene ${i + 1}`)
        const steps = await retryOperation(() => 
          generateWhiteboardPlan(scene.narration, scene.imageDescription), 
          2, 1000
        )
        console.log(`  - Generated ${steps.length} steps`)
        
        // Generate whiteboard-style image
        console.log(`  - Generating whiteboard image for scene ${i + 1}`)
        const imageBuffer = await retryOperation(() => 
          generateImage(`Professional whiteboard diagram with clean design, educational content, appropriate for all audiences. ${scene.imageDescription}`), 
          2, 1000
        )
        console.log(`  - Image generated, size: ${imageBuffer.length} bytes`)
        
        // Generate TTS audio
        console.log(`  - Generating TTS audio for scene ${i + 1}`)
        const audioBuffer = await retryOperation(() => 
          generateSpeech(scene.narration, voice), 
          2, 1000
        )
        console.log(`  - Audio generated, size: ${audioBuffer.length} bytes`)
        
        whiteboardScenes.push({
          kind: 'WHITEBOARD',
          sceneId: scene.sceneId,
          imageBuffer,
          audioBuffer,
          caption: scene.caption,
          duration: scene.duration,
          steps
        })
        
        console.log(`  - Scene ${i + 1} completed successfully`)
      } catch (sceneError) {
        console.error(`  - Error processing scene ${i + 1}:`, sceneError)
        throw new Error(`Failed to process scene ${i + 1}: ${sceneError instanceof Error ? sceneError.message : 'Unknown error'}`)
      }
    }

    // Step 3: Compose Final Video with FFmpeg
    console.log('Step 3: Composing final whiteboard video with FFmpeg...')
    console.log(`Composing ${whiteboardScenes.length} scenes`)
    
    const compositionOptions = {
      aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
      scenes: whiteboardScenes
    }

    const finalVideoBuffer = await videoComposer.composeVideo(compositionOptions)
    console.log(`Final video generated, size: ${finalVideoBuffer.length} bytes`)
    
    // Convert to base64 for response
    const videoBase64 = finalVideoBuffer.toString('base64')
    
    console.log('SIMPLE whiteboard video generation completed successfully!')

    return NextResponse.json({
      success: true,
      video: `data:video/mp4;base64,${videoBase64}`,
      script: { ...script, scenes: limitedScenes },
      totalCost: calculateTokenCost(1000, 500) + (limitedScenes.length * 0.08),
      duration: limitedScenes.reduce((sum, scene) => sum + scene.duration, 0)
    })

  } catch (error) {
    console.error('SIMPLE whiteboard video generation failed:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'SIMPLE whiteboard video generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
