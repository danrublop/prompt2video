import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleGenAI } from '@google/genai'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const geminiApiKey = process.env.GEMINI_API_KEY
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null
const veoClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null

export interface Veo3VideoRequest {
  prompt: string
  duration?: number // in seconds, max 5 seconds for Veo3
  aspectRatio?: '16:9' | '9:16' | '1:1'
  style?: 'realistic' | 'animated' | 'cinematic'
}

export interface Veo3VideoResponse {
  videoUrl: string
  duration: number
  aspectRatio: string
  prompt: string
}

export async function generateVeo3Video(request: Veo3VideoRequest): Promise<Veo3VideoResponse> {
  if (!veoClient) {
    throw new Error('GEMINI_API_KEY not set. Cannot generate Veo3 videos.')
  }

  const { prompt, duration = 8, aspectRatio = '16:9', style = 'realistic' } = request

  try {
    console.log(`[DEBUG] Generating Veo3 video with prompt: ${prompt}`)
    console.log(`[DEBUG] Parameters: duration=${duration}s, aspectRatio=${aspectRatio}, style=${style}`)

    // Create a whiteboard animation prompt for Veo3
    const whiteboardPrompt = `Top-down view of a white paper or whiteboard. A hand with a black pen draws simple illustrations and text related to: "${prompt}". Show the drawing process in real-time, like someone is sketching by hand. Keep it simple, educational, and focused on the main concept. White background, black pen, clean and minimal.`

    console.log(`[DEBUG] Veo3 whiteboard prompt: ${whiteboardPrompt}`)

    // Generate video using Veo3 API
    const operation = await veoClient.models.generateVideos({
      model: "veo-3.0-generate-001",
      prompt: whiteboardPrompt,
      config: {
        aspectRatio: aspectRatio,
        resolution: aspectRatio === '16:9' ? '1080p' : '720p',
        personGeneration: 'allow_all'
      }
    })

    console.log(`[DEBUG] Veo3 operation started: ${operation.name}`)

    // Poll the operation status until the video is ready
    let currentOperation = operation
    while (!currentOperation.done) {
      console.log("Waiting for Veo3 video generation to complete...")
      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
      currentOperation = await veoClient.operations.get(currentOperation)
    }

    if (currentOperation.error) {
      throw new Error(`Veo3 generation failed: ${currentOperation.error.message}`)
    }

    // Download the generated video
    const generatedVideo = currentOperation.response.generated_videos[0]
    const videoFile = await veoClient.files.download({ file: generatedVideo.video })
    
    // Convert to base64 for storage
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer())
    const base64Video = videoBuffer.toString('base64')
    
    console.log(`[DEBUG] Veo3 video generated successfully: ${generatedVideo.video.name}`)
    
    return {
      videoUrl: `data:video/mp4;base64,${base64Video}`,
      duration: 8, // Veo3 generates 8-second videos
      aspectRatio,
      prompt
    }
  } catch (error) {
    console.error('Veo3 video generation failed:', error)
    
    // Check if it's a quota exceeded error
    if (error instanceof Error && error.message.includes('429')) {
      console.log('[DEBUG] Veo3 quota exceeded, falling back to FFmpeg placeholder')
      return await generateVeo3PlaceholderVideo(request)
    }
    
    throw new Error(`Veo3 video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Fallback function for when Veo3 quota is exceeded
async function generateVeo3PlaceholderVideo(request: Veo3VideoRequest): Promise<Veo3VideoResponse> {
  const { prompt, duration = 8, aspectRatio = '16:9' } = request
  
  console.log(`[DEBUG] Generating Veo3 placeholder video due to quota limit`)
  
  // Create a safe title from the prompt
  const title = prompt.split('.')[0].substring(0, 50).replace(/[^a-zA-Z0-9\s]/g, '')
  const safeTitle = title || 'Whiteboard Video'
  
  // Create temp directory
  const tempDir = '/tmp/veo3_temp'
  await fs.mkdir(tempDir, { recursive: true })
  
  const outputPath = path.join(tempDir, `video_${Date.now()}.mp4`)
  
  // Create FFmpeg command for placeholder video
  const ffmpegCommand = [
    '-f', 'lavfi',
    '-i', `color=c=white:size=1920x1080:duration=${duration}`,
    '-vf', `drawtext=text='${safeTitle}':fontsize=48:fontcolor=black:x=(w-text_w)/2:y=(h-text_h)/2`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-y',
    outputPath
  ]
  
  console.log(`[DEBUG] Running FFmpeg command: ffmpeg ${ffmpegCommand.join(' ')}`)
  
  await execAsync(`ffmpeg ${ffmpegCommand.join(' ')}`)
  
  console.log(`[DEBUG] Veo3 placeholder video generated: ${outputPath}`)
  
  // Read the generated video file
  const videoBuffer = await fs.readFile(outputPath)
  const base64Video = videoBuffer.toString('base64')
  
  // Clean up temp file
  await fs.unlink(outputPath).catch(() => {})
  
  return {
    videoUrl: `data:video/mp4;base64,${base64Video}`,
    duration: duration,
    aspectRatio,
    prompt
  }
}

export async function generateVeo3VideoWithScript(
  script: string,
  sceneIndex: number,
  totalScenes: number,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): Promise<Buffer> {
  if (!veoClient) {
    throw new Error('GEMINI_API_KEY not set. Cannot generate Veo3 videos.')
  }

  try {
    // Create a whiteboard animation video prompt based on the script content
    const videoPrompt = `Create a ${aspectRatio} whiteboard animation video: Top-down view of a white paper or whiteboard. A hand with a black pen draws simple illustrations and text related to: "${script}". Scene ${sceneIndex + 1} of ${totalScenes}. Show the drawing process in real-time, like someone is sketching by hand. Keep it simple, educational, and focused on the main concept. White background, black pen, clean and minimal.`

    console.log(`[DEBUG] Veo3 video prompt for scene ${sceneIndex + 1}:`, videoPrompt)

    const veo3Response = await generateVeo3Video({
      prompt: videoPrompt,
      duration: 8, // Veo3 generates 8-second videos
      aspectRatio,
      style: 'realistic'
    })

    // Handle the response - it's now a base64 data URL
    if (veo3Response.videoUrl.startsWith('data:video/mp4;base64,')) {
      const base64Data = veo3Response.videoUrl.split(',')[1]
      return Buffer.from(base64Data, 'base64')
    } else {
      // Fallback for URL-based responses
      const response = await fetch(veo3Response.videoUrl)
      if (!response.ok) {
        throw new Error(`Failed to download Veo3 video: ${response.statusText}`)
      }
      const videoBuffer = await response.arrayBuffer()
      return Buffer.from(videoBuffer)
    }
  } catch (error) {
    console.error('Veo3 video generation with script failed:', error)
    throw new Error(`Veo3 video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Mock implementation for testing
export async function mockGenerateVeo3Video(request: Veo3VideoRequest): Promise<Veo3VideoResponse> {
  console.log(`[MOCK] Generating Veo3 video: ${request.prompt}`)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    videoUrl: `https://mock-veo3-video.com/mock_${Date.now()}.mp4`,
    duration: request.duration || 5,
    aspectRatio: request.aspectRatio || '16:9',
    prompt: request.prompt
  }
}

export async function mockGenerateVeo3VideoWithScript(
  script: string,
  sceneIndex: number,
  totalScenes: number,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): Promise<Buffer> {
  const videoPrompt = `Create a ${aspectRatio} whiteboard animation video: Top-down view of a white paper or whiteboard. A hand with a black pen draws simple illustrations and text related to: "${script}". Scene ${sceneIndex + 1} of ${totalScenes}. Show the drawing process in real-time, like someone is sketching by hand. Keep it simple, educational, and focused on the main concept. White background, black pen, clean and minimal.`
  
  console.log(`[MOCK] Generating Veo3 video for scene ${sceneIndex + 1}: ${script.substring(0, 50)}...`)
  console.log(`[MOCK] Veo3 video prompt:`, videoPrompt)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Create a mock video using FFmpeg (same as real implementation)
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)
  
  const tempDir = '/tmp/veo3_temp'
  const videoPath = `${tempDir}/mock_video_${Date.now()}.mp4`
  
  // Ensure temp directory exists
  await execAsync(`mkdir -p ${tempDir}`)
  
  // Extract title from script
  const title = script.split(' ').slice(0, 3).join(' ').substring(0, 20) || 'Mock Video'
  const safeTitle = title.replace(/[^a-zA-Z0-9\s]/g, '') || 'Mock Video'
  
  // Create mock whiteboard video
  const ffmpegCommand = `ffmpeg -f lavfi -i color=c=white:size=1920x1080:duration=5 -vf "drawtext=text='${safeTitle}':fontsize=72:fontcolor=black:x=(w-text_w)/2:y=(h-text_h)/2-100:fontfile=/System/Library/Fonts/Helvetica.ttc, drawtext=text='Scene ${sceneIndex + 1}':fontsize=36:fontcolor=gray:x=(w-text_w)/2:y=(h-text_h)/2+50:fontfile=/System/Library/Fonts/Helvetica.ttc, drawtext=text='[MOCK] Drawing...':fontsize=24:fontcolor=darkgray:x=(w-text_w)/2:y=(h-text_h)/2+150:fontfile=/System/Library/Fonts/Helvetica.ttc" -c:v libx264 -pix_fmt yuv420p -y "${videoPath}"`
  
  await execAsync(ffmpegCommand)
  
  // Read the generated video file
  const fs = require('fs')
  const videoBuffer = fs.readFileSync(videoPath)
  
  // Clean up temp file
  await execAsync(`rm -f "${videoPath}"`)
  
  return videoBuffer
}
