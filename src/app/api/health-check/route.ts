import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  const checks = {
    openai: false,
    ffmpeg: false,
    tempDir: false,
    errors: [] as string[]
  }

  try {
    // Check OpenAI API key
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      checks.openai = true
    } else {
      checks.errors.push('OPENAI_API_KEY not set or invalid')
    }

    // Check FFmpeg
    try {
      await execAsync('ffmpeg -version')
      checks.ffmpeg = true
    } catch (error) {
      checks.errors.push('FFmpeg not found or not accessible')
    }

    // Check temp directory
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const tempDir = path.join(process.cwd(), 'temp')
      await fs.mkdir(tempDir, { recursive: true })
      checks.tempDir = true
    } catch (error) {
      checks.errors.push(`Cannot create temp directory: ${error}`)
    }

    const allGood = checks.openai && checks.ffmpeg && checks.tempDir

    return NextResponse.json({
      status: allGood ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
