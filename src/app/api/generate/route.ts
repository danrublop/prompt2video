import { NextRequest, NextResponse } from 'next/server'
import { generateScript, generateContentSpecificImage, calculateTokenCost, generateWhiteboardPlan } from '@/lib/openai'
import { heygenClient } from '@/lib/heygen'
import { videoComposer } from '@/lib/video-composer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, aspectRatio = '16:9', duration = 150, language = 'English', voiceId, avatarId, imageTheme = 'whiteboard' } = body
    
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

    // Step 2 & 3: Build alternating AVATAR and WHITEBOARD scenes
    if (!avatarId && !process.env.HEYGEN_AVATAR_ID) {
      return NextResponse.json({ error: 'avatarId is required (or set HEYGEN_AVATAR_ID)' }, { status: 422 })
    }
    const effectiveAvatarId = avatarId || process.env.HEYGEN_AVATAR_ID as string

    console.log('Generating alternating AVATAR and WHITEBOARD scenes...')
    const composedScenes: any[] = []
    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i]
      const isAvatar = i % 2 === 0

      if (isAvatar) {
        console.log(`Generating AVATAR video for scene ${i + 1}/${script.scenes.length}`)
        const { video_id } = await heygenClient.generateAvatarVideo(scene.narration, {
          avatarId: effectiveAvatarId,
          voiceId: voiceId || process.env.HEYGEN_VOICE_ID,
        })
        const avatarVideoBuffer = await heygenClient.waitForVideoMp4(video_id)
        composedScenes.push({
          kind: 'AVATAR',
          sceneId: scene.sceneId,
          avatarVideoBuffer,
          caption: scene.caption,
          duration: scene.duration
        })
      } else {
        console.log(`Generating WHITEBOARD assets for scene ${i + 1}/${script.scenes.length}`)
        const imageBuffer = await generateContentSpecificImage(scene.narration, scene.imageDescription, imageTheme, i, script.scenes.length)
        const steps = await generateWhiteboardPlan(scene.narration, scene.imageDescription)
        // Reuse the avatar's narration audio to keep voice continuous across avatar + whiteboard
        const { video_id: tmpId } = await heygenClient.generateAvatarVideo(scene.narration, {
          avatarId: effectiveAvatarId,
          voiceId: voiceId || process.env.HEYGEN_VOICE_ID,
        })
        const tmpVideo = await heygenClient.waitForVideoMp4(tmpId)
        const audioBuffer = await heygenClient.extractAudioFromMp4(tmpVideo)
        composedScenes.push({
          kind: 'WHITEBOARD',
          sceneId: scene.sceneId,
          imageBuffer,
          audioBuffer,
          caption: scene.caption,
          duration: scene.duration,
          steps
        })
      }
    }

    // Step 4: Compose Final Video
    console.log('Composing final video...')
    const compositionOptions = {
      aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
      scenes: composedScenes
    }

    const finalVideoBuffer = await videoComposer.composeVideo(compositionOptions, ['en'])
    
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


