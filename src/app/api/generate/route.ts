import { NextRequest, NextResponse } from 'next/server'
import { generateScript, generateImage, generateVideo, calculateTokenCost } from '@/lib/openai'
import { heygenClient } from '@/lib/heygen'
import { videoComposer } from '@/lib/video-composer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, aspectRatio = '16:9', duration = 150, language = 'English', voiceId } = body
    
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 422 }
      )
    }

    console.log(`Starting video generation for: "${prompt}"`)

    // Step 1: Generate Script
    console.log('Generating script...')
    const script = await generateScript(prompt.trim(), duration, language)
    console.log(`Generated script with ${script.scenes.length} scenes`)

    // Step 2: Generate Visual Content
    console.log('Generating visual content...')
    const visualAssets = []
    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i]
      console.log(`Generating content for scene ${i + 1}/${script.scenes.length}`)
      
      const [imageBuffer, videoBuffer] = await Promise.all([
        generateImage(scene.imageDescription),
        generateVideo(scene.imageDescription, undefined, Math.min(scene.duration, 10))
      ])

      visualAssets.push({
        ...scene,
        imageBuffer,
        videoBuffer
      })
    }

    // Step 3: Generate Audio
    console.log('Generating audio...')
    const audioAssets = []
    for (let i = 0; i < visualAssets.length; i++) {
      const scene = visualAssets[i]
      console.log(`Generating audio for scene ${i + 1}/${visualAssets.length}`)
      
      const audioBuffer = await heygenClient.generateAndWaitForCompletion(
        scene.narration,
        voiceId || '1bd001e7e50f421d891986aad5158bc3'
      )
      
      audioAssets.push({
        ...scene,
        audioBuffer
      })
    }

    // Step 4: Compose Final Video
    console.log('Composing final video...')
    const compositionOptions = {
      aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
      scenes: audioAssets.map(scene => ({
        sceneId: scene.sceneId,
        imageBuffer: scene.imageBuffer,
        videoBuffer: scene.videoBuffer,
        audioBuffer: scene.audioBuffer,
        caption: scene.caption,
        duration: scene.duration,
      })),
    }

    const finalVideoBuffer = await videoComposer.composeVideo(compositionOptions)
    
    // Convert to base64 for response
    const videoBase64 = finalVideoBuffer.toString('base64')
    
    console.log('Video generation completed successfully!')

    return NextResponse.json({
      success: true,
      video: `data:video/mp4;base64,${videoBase64}`,
      script: script,
      totalCost: calculateTokenCost(1000, 500) + (script.scenes.length * 0.24), // Approximate cost
      duration: script.totalDuration
    })

  } catch (error) {
    console.error('Video generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Video generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
