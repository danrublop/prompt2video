import { NextRequest, NextResponse } from 'next/server'
import { memoryStorage } from '@/lib/memory-storage'
import { generateSpeech } from '@/lib/openai'
import { heygenClient } from '@/lib/heygen'
import { mockHeygenClient } from '@/lib/mock-heygen'

export async function POST(request: NextRequest) {
  try {
    console.log('Regenerate audio API called')
    const body = await request.json()
    console.log('Request body:', body)
    
    const { jobId, assetId, customScript, sceneIndex, ttsProvider, voiceId, openaiVoice } = body
    
    if (!jobId || !assetId || !customScript) {
      console.error('Missing required parameters:', { jobId, assetId, customScript })
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get job details
    console.log('Getting job details for:', jobId)
    const job = await memoryStorage.getJob(jobId)
    if (!job) {
      console.error('Job not found:', jobId)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    console.log('Job found:', job.id, 'Status:', job.status)

    // Check if we're in demo mode
    const hasOpenAI = !!process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'mock' &&
      process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
    const hasHeygen = !!process.env.HEYGEN_API_KEY &&
      process.env.HEYGEN_API_KEY !== 'mock' &&
      process.env.HEYGEN_API_KEY !== 'your_heygen_api_key_here'
    const isDemoMode = !hasOpenAI && !hasHeygen
    
    console.log('TTS Provider:', ttsProvider)
    console.log('Has OpenAI:', hasOpenAI)
    console.log('Has HeyGen:', hasHeygen)
    console.log('Is Demo Mode:', isDemoMode)

    // Generate new audio
    console.log(`Regenerating audio for scene ${sceneIndex} with script: ${customScript}`)
    let audioBuffer: Buffer

    try {
      if (ttsProvider === 'openai') {
        console.log('Using OpenAI TTS')
        // Use OpenAI TTS
        audioBuffer = isDemoMode 
          ? Buffer.from(`Mock OpenAI TTS audio for scene ${sceneIndex}: ${customScript}`)
          : await generateSpeech(customScript, openaiVoice || 'alloy')
      } else {
        console.log('Using HeyGen TTS')
        // Use HeyGen TTS (default)
        audioBuffer = await (isDemoMode ? mockHeygenClient : heygenClient).generateAndWaitForCompletion(
          customScript,
          voiceId || process.env.HEYGEN_VOICE_ID || '1bd001e7e50f421d891986aad5158bc3'
        )
      }
      console.log('Audio generation completed, buffer size:', audioBuffer.length)
    } catch (audioError) {
      console.error('Audio generation failed:', audioError)
      throw audioError
    }

    // Store new audio
    console.log('Storing new audio file...')
    const newAudioUrl = await memoryStorage.storeFile(jobId, 'audio', `scene_${sceneIndex}_audio_edited_${Date.now()}.mp3`, audioBuffer)
    console.log('New audio URL:', newAudioUrl)

    // Update the asset in storage
    console.log('Updating asset in storage...')
    const updatedAsset = await memoryStorage.updateAsset(assetId, {
      url: newAudioUrl,
      meta: { 
        ...job.assets?.find(a => a.id === assetId)?.meta,
        edited: true,
        customScript,
        editedAt: new Date().toISOString()
      }
    })
    console.log('Asset updated:', updatedAsset?.id)

    return NextResponse.json({
      success: true,
      newUrl: newAudioUrl,
      message: 'Audio regenerated successfully'
    })

  } catch (error) {
    console.error('Audio regeneration failed:', error)
    return NextResponse.json(
      { 
        error: 'Audio regeneration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
