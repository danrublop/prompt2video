import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple health check that doesn't require external services
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mode: 'demo',
      services: {
        api: 'connected',
        mock_services: 'available'
      },
      message: 'Demo mode is working - no external services required'
    })
  } catch (error) {
    console.error('Demo health check failed:', error)
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


