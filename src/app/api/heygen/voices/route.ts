import { NextRequest, NextResponse } from 'next/server'
import { heygenClient } from '@/lib/heygen'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching HeyGen voices...')
    
    const voices = await heygenClient.getVoices()
    
    console.log(`Successfully fetched ${voices.length} voices`)
    
    return NextResponse.json({
      success: true,
      voices: voices,
      count: voices.length
    })
  } catch (error) {
    console.error('Error fetching HeyGen voices:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch voices',
      voices: [],
      count: 0
    }, { status: 500 })
  }
}