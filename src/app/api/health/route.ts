import { NextResponse } from 'next/server'
import { memoryStorage } from '@/lib/memory-storage'
import { simpleProcessor } from '@/lib/simple-processor'

export async function GET() {
  try {
    // Check memory storage
    const storageHealth = await memoryStorage.healthCheck()
    
    // Check processor
    const processorHealth = await simpleProcessor.healthCheck()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        memory_storage: storageHealth.status,
        processor: processorHealth.status,
      },
      stats: {
        jobs: storageHealth.jobs,
        steps: storageHealth.steps,
        assets: storageHealth.assets,
        processing: processorHealth.processing,
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
