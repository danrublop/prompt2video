import { NextRequest, NextResponse } from 'next/server'
import { memoryStorage } from '@/lib/memory-storage'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string; type: string; filename: string }> }
) {
  try {
    const { jobId, type, filename } = await context.params
    
    // Validate file type
    if (!['image', 'audio', 'video', 'json'].includes(type)) {
      return new NextResponse('Invalid file type', { status: 400 })
    }
    
    // Construct the file URL
    const fileUrl = `file://${path.join(process.cwd(), 'temp', 'storage', jobId, type, filename)}`
    
    // Serve with Range support for video/audio for better in-site playback
    const filePath = fileUrl.replace('file://', '')
    const stat = await fs.stat(filePath)
    const range = request.headers.get('range')
    let buffer: Buffer
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.webp':
        contentType = 'image/webp'
        break
      case '.mp3':
        contentType = 'audio/mpeg'
        break
      case '.wav':
        contentType = 'audio/wav'
        break
      case '.mp4':
        contentType = 'video/mp4'
        break
      case '.webm':
        contentType = 'video/webm'
        break
      case '.json':
        contentType = 'application/json'
        break
    }
    
    const isDownload = request.nextUrl.searchParams.get('download') === '1'
    if (range && !isDownload && (ext === '.mp4' || ext === '.webm' || ext === '.mp3' || ext === '.wav')) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
      const chunkSize = end - start + 1
      const file = await fs.open(filePath, 'r')
      try {
        const chunk = Buffer.alloc(chunkSize)
        await file.read(chunk, 0, chunkSize, start)
        return new NextResponse(chunk, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunk.length),
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        })
      } finally {
        await file.close()
      }
    } else {
      buffer = await memoryStorage.getFile(fileUrl)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(stat.size),
          'Cache-Control': 'public, max-age=3600',
          'Accept-Ranges': 'bytes',
          ...(isDownload ? { 'Content-Disposition': `attachment; filename="${filename}"` } : {}),
        },
      })
    }
  } catch (error) {
    console.error('Error serving asset:', error)
    return new NextResponse('File not found', { status: 404 })
  }
}


