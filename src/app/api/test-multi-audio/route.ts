import { NextRequest, NextResponse } from 'next/server'
import { generateScript, generateImage, generateSpeech } from '@/lib/openai'
import { videoComposer } from '@/lib/video-composer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt = 'Explain how photosynthesis works', languages = ['en', 'es'] } = body
    
    console.log(`Testing multi-language audio generation for: "${prompt}" in ${languages.length} languages`)

    // Step 1: Generate Script for first language
    console.log('Step 1: Generating script...')
    const script = await generateScript(prompt.trim(), 30, 'English')
    console.log(`Generated script with ${script.scenes.length} scenes`)

    // Take only the first scene for testing
    const scene = script.scenes[0]
    console.log(`Testing with scene: ${scene.sceneId}`)

    // Step 2: Generate assets for multi-language scene
    console.log('Step 2: Generating multi-language assets...')
    
    // Generate image (shared across languages)
    console.log('  - Generating image...')
    const imageBuffer = await generateImage(`Professional whiteboard diagram with clean design, educational content, appropriate for all audiences. ${scene.imageDescription}`)
    console.log(`  - Image generated, size: ${imageBuffer.length} bytes`)
    
    // Generate audio for each language
    const multiLanguageScenes: any[] = []
    
    for (const langCode of languages) {
      console.log(`  - Generating audio for language: ${langCode}`)
      
      // Create language-specific narration (simplified for testing)
      const langNarration = langCode === 'en' 
        ? scene.narration 
        : `[${langCode.toUpperCase()}] ${scene.narration}`
      
      const audioBuffer = await generateSpeech(langNarration, 'alloy')
      console.log(`  - Audio generated for ${langCode}, size: ${audioBuffer.length} bytes`)

      const langScene = {
        kind: 'WHITEBOARD',
        sceneId: `${scene.sceneId}_${langCode}`,
        imageBuffer,
        audioBuffer,
        caption: langCode === 'en' ? scene.caption : `[${langCode.toUpperCase()}] ${scene.caption}`,
        duration: scene.duration,
        language: langCode
      }
      
      multiLanguageScenes.push(langScene)
    }

    // Step 3: Test video composition with multi-language audio
    console.log('Step 3: Testing multi-language video composition...')
    const compositionOptions = {
      aspectRatio: '16:9' as const,
      scenes: multiLanguageScenes
    }

    console.log('  - Calling video composer with multi-language audio...')
    const finalVideoBuffer = await videoComposer.composeVideo(compositionOptions, languages)
    console.log(`  - Video composed with multi-language audio, size: ${finalVideoBuffer.length} bytes`)

    // Convert to base64
    const videoBase64 = finalVideoBuffer.toString('base64')
    
    console.log('Multi-language audio test completed successfully!')

    return NextResponse.json({
      success: true,
      video: `data:video/mp4;base64,${videoBase64}`,
      languages: languages,
      scene: {
        sceneId: scene.sceneId,
        narration: scene.narration,
        caption: scene.caption,
        duration: scene.duration
      },
      message: `Video generated with ${languages.length} language audio tracks and subtitles`
    })

  } catch (error) {
    console.error('Multi-language audio test failed:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Multi-language audio test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

