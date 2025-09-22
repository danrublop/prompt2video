import { NextRequest, NextResponse } from 'next/server'
import { memoryStorage } from '@/lib/memory-storage'

export async function GET(request: NextRequest) {
  try {
    console.log('Debug endpoint called')
    const health = await memoryStorage.healthCheck()
    console.log('Health check result:', health)
    
    return NextResponse.json({
      health,
      message: 'Debug endpoint working - getAllJobs method not available yet'
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
