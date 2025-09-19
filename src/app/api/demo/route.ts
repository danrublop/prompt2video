import { NextRequest, NextResponse } from 'next/server'
import { generateScript, generateImage, generateVideo, calculateTokenCost } from '@/lib/mock-openai'
import { mockHeygenClient } from '@/lib/mock-heygen'

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

    console.log(`Starting DEMO video generation for: "${prompt}"`)

    // Step 1: Generate Script (using mock)
    console.log('Generating script...')
    const script = await generateScript(prompt.trim(), duration, language)
    console.log(`Generated script with ${script.scenes.length} scenes`)

    // Step 2: Generate Visual Content (using mock)
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

    // Step 3: Generate Audio (using mock)
    console.log('Generating audio...')
    const audioAssets = []
    for (let i = 0; i < visualAssets.length; i++) {
      const scene = visualAssets[i]
      console.log(`Generating audio for scene ${i + 1}/${visualAssets.length}`)
      
      const audioBuffer = await mockHeygenClient.generateAndWaitForCompletion(
        scene.narration,
        voiceId || '1bd001e7e50f421d891986aad5158bc3'
      )
      
      audioAssets.push({
        ...scene,
        audioBuffer
      })
    }

    // For demo purposes, create a simple mock video
    // In a real implementation, you'd use the video composer here
    const mockVideoData = Buffer.from('mock-video-data')
    const videoBase64 = mockVideoData.toString('base64')
    
    console.log('DEMO video generation completed successfully!')

    return NextResponse.json({
      success: true,
      video: `data:video/mp4;base64,${videoBase64}`,
      script: script,
      totalCost: calculateTokenCost(1000, 500) + (script.scenes.length * 0.24),
      duration: script.totalDuration,
      demo: true,
      message: "This is a demo mode - no real video was generated. Add your API keys to generate actual videos."
    })

  } catch (error) {
    console.error('Demo video generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Demo video generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
