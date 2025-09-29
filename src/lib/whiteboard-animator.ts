import { promises as fs } from 'fs'
import path from 'path'
import { createCanvas, loadImage } from 'canvas'
import { extractHeaderFromNarration } from './themes'
import { generateContentSpecificImage } from './openai'

export interface WhiteboardAnimationOptions {
  prompt: string
  aspectRatio: '16:9' | '9:16' | '1:1'
  duration: number
  width?: number
  height?: number
  strokeStyle?: string
  lineWidth?: number
  animationSpeed?: number
  imageStyle?: 'whiteboard_bw' | 'whiteboard_color'
  headerTitle?: string
}

export interface DrawingPath {
  x: number
  y: number
}

export interface WhiteboardAnimationResult {
  videoBuffer: Buffer
  imageBuffer: Buffer
  paths: DrawingPath[][]
}

export class WhiteboardAnimator {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  private getVideoDimensions(aspectRatio: string): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1920, height: 1080 }
      case '9:16':
        return { width: 1080, height: 1920 }
      case '1:1':
        return { width: 1024, height: 1024 }
      default:
        return { width: 1920, height: 1080 }
    }
  }

  async generateWhiteboardAnimation(options: WhiteboardAnimationOptions): Promise<WhiteboardAnimationResult> {
    await this.ensureTempDir()
    
    const dimensions = this.getVideoDimensions(options.aspectRatio)
    const width = options.width || dimensions.width
    const height = options.height || dimensions.height
    
    console.log(`[WHITEBOARD] Generating animation for: "${options.prompt}"`)
    console.log(`[WHITEBOARD] Dimensions: ${width}x${height}, Duration: ${options.duration}s`)

    try {
      // Step 1: Generate illustration (uses whiteboard theme; style can be color or bw)
      console.log('[WHITEBOARD] Step 1: Generating DALL-E image...')
      const imageBuffer = await this.generateWhiteboardImage(options.prompt, width, height, options.imageStyle || 'whiteboard_bw')
      
      // Step 2: Extract drawing paths from image
      console.log('[WHITEBOARD] Step 2: Extracting drawing paths...')
      const paths = await this.extractDrawingPaths(imageBuffer, width, height)
      
      // Step 3: Create animated video
      console.log('[WHITEBOARD] Step 3: Creating animated video...')
      const videoBuffer = await this.createAnimatedVideo(paths, {
        width,
        height,
        duration: options.duration,
        strokeStyle: options.strokeStyle || '#000000',
        lineWidth: options.lineWidth || 3,
        animationSpeed: options.animationSpeed || 30,
        baseImageBuffer: imageBuffer,
        imageStyle: options.imageStyle || 'whiteboard_bw',
        headerTitle: options.headerTitle || extractHeaderFromNarration(options.prompt)
      })

      console.log('[WHITEBOARD] Animation generation completed successfully!')
      
      return {
        videoBuffer,
        imageBuffer,
        paths
      }
    } catch (error) {
      console.error('[WHITEBOARD] Animation generation failed:', error instanceof Error ? error.message : error)
      throw new Error(`Whiteboard animation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async generateWhiteboardImage(prompt: string, width: number, height: number, imageStyle: 'whiteboard_bw' | 'whiteboard_color' = 'whiteboard_bw'): Promise<Buffer> {
    console.log(`[WHITEBOARD] Generating whiteboard image via image pipeline for: ${prompt}`)
    try {
      const imageBuffer = await generateContentSpecificImage(
        prompt,            // narration
        prompt,            // sceneDescription
        'whiteboard',      // theme
        0,                 // scene index
        1,                 // total scenes
        { width, height }, // video dimensions
        undefined,         // context
        imageStyle    // image style
      )
      return imageBuffer
    } catch (err) {
      console.warn('[WHITEBOARD] Image pipeline failed, falling back to Canvas renderer:', err)
      return this.createCanvasWhiteboardImage(prompt, width, height)
    }
  }

  private async createCanvasWhiteboardImage(prompt: string, width: number, height: number): Promise<Buffer> {
    console.log(`[WHITEBOARD] Creating Canvas-based whiteboard image for: ${prompt}`)
    
    // Create a Canvas-based whiteboard drawing
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    
    // White background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)
    
    // Black lines for whiteboard drawing
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    // Draw based on prompt content
    this.drawPromptBasedIllustration(ctx, prompt, width, height)
    
    // No demo labels; header overlay handles title visuals
    
    return canvas.toBuffer('image/jpeg')
  }
  
  private drawPromptBasedIllustration(ctx: any, prompt: string, width: number, height: number): void {
    const centerX = width / 2
    const centerY = height / 2
    
    // Draw based on prompt keywords
    if (prompt.toLowerCase().includes('house') || prompt.toLowerCase().includes('home')) {
      this.drawHouse(ctx, centerX, centerY, width, height)
    } else if (prompt.toLowerCase().includes('tree') || prompt.toLowerCase().includes('plant')) {
      this.drawTree(ctx, centerX, centerY, width, height)
    } else if (prompt.toLowerCase().includes('circle') || prompt.toLowerCase().includes('round')) {
      this.drawCircle(ctx, centerX, centerY, width, height)
    } else if (prompt.toLowerCase().includes('line') || prompt.toLowerCase().includes('straight')) {
      this.drawLines(ctx, centerX, centerY, width, height)
    } else if (prompt.toLowerCase().includes('arrow') || prompt.toLowerCase().includes('direction')) {
      this.drawArrow(ctx, centerX, centerY, width, height)
    } else {
      // Default: draw a simple diagram
      this.drawDefaultDiagram(ctx, centerX, centerY, width, height)
    }
  }
  
  private drawHouse(ctx: any, centerX: number, centerY: number, width: number, height: number): void {
    const houseWidth = width * 0.3
    const houseHeight = height * 0.2
    
    // House base
    ctx.beginPath()
    ctx.moveTo(centerX - houseWidth/2, centerY + houseHeight/2)
    ctx.lineTo(centerX - houseWidth/2, centerY - houseHeight/2)
    ctx.lineTo(centerX + houseWidth/2, centerY - houseHeight/2)
    ctx.lineTo(centerX + houseWidth/2, centerY + houseHeight/2)
    ctx.closePath()
    ctx.stroke()
    
    // Roof
    ctx.beginPath()
    ctx.moveTo(centerX - houseWidth/2, centerY - houseHeight/2)
    ctx.lineTo(centerX, centerY - houseHeight)
    ctx.lineTo(centerX + houseWidth/2, centerY - houseHeight/2)
    ctx.stroke()
    
    // Door
    const doorWidth = houseWidth * 0.2
    const doorHeight = houseHeight * 0.6
    ctx.beginPath()
    ctx.moveTo(centerX - doorWidth/2, centerY + houseHeight/2)
    ctx.lineTo(centerX - doorWidth/2, centerY + houseHeight/2 - doorHeight)
    ctx.lineTo(centerX + doorWidth/2, centerY + houseHeight/2 - doorHeight)
    ctx.lineTo(centerX + doorWidth/2, centerY + houseHeight/2)
    ctx.stroke()
  }
  
  private drawTree(ctx: any, centerX: number, centerY: number, width: number, height: number): void {
    const trunkHeight = height * 0.15
    const trunkWidth = width * 0.02
    
    // Trunk
    ctx.beginPath()
    ctx.moveTo(centerX - trunkWidth/2, centerY + trunkHeight/2)
    ctx.lineTo(centerX - trunkWidth/2, centerY - trunkHeight/2)
    ctx.lineTo(centerX + trunkWidth/2, centerY - trunkHeight/2)
    ctx.lineTo(centerX + trunkWidth/2, centerY + trunkHeight/2)
    ctx.closePath()
    ctx.stroke()
    
    // Leaves
    ctx.beginPath()
    ctx.arc(centerX, centerY - trunkHeight/2, width * 0.08, 0, 2 * Math.PI)
    ctx.stroke()
  }
  
  private drawCircle(ctx: any, centerX: number, centerY: number, width: number, height: number): void {
    const radius = Math.min(width, height) * 0.1
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.stroke()
  }
  
  private drawLines(ctx: any, centerX: number, centerY: number, width: number, height: number): void {
    const lineLength = width * 0.2
    
    // Horizontal line
    ctx.beginPath()
    ctx.moveTo(centerX - lineLength/2, centerY)
    ctx.lineTo(centerX + lineLength/2, centerY)
    ctx.stroke()
    
    // Vertical line
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - lineLength/2)
    ctx.lineTo(centerX, centerY + lineLength/2)
    ctx.stroke()
  }
  
  private drawArrow(ctx: any, centerX: number, centerY: number, width: number, height: number): void {
    const arrowLength = width * 0.2
    
    // Arrow shaft
    ctx.beginPath()
    ctx.moveTo(centerX - arrowLength/2, centerY)
    ctx.lineTo(centerX + arrowLength/2, centerY)
    ctx.stroke()
    
    // Arrow head
    ctx.beginPath()
    ctx.moveTo(centerX + arrowLength/2, centerY)
    ctx.lineTo(centerX + arrowLength/2 - 20, centerY - 10)
    ctx.lineTo(centerX + arrowLength/2 - 20, centerY + 10)
    ctx.closePath()
    ctx.stroke()
  }
  
  private drawDefaultDiagram(ctx: any, centerX: number, centerY: number, width: number, height: number): void {
    // Draw a simple flowchart-style diagram
    const boxWidth = width * 0.15
    const boxHeight = height * 0.08
    
    // Box 1
    ctx.beginPath()
    ctx.moveTo(centerX - boxWidth, centerY - boxHeight/2)
    ctx.lineTo(centerX - boxWidth, centerY + boxHeight/2)
    ctx.lineTo(centerX, centerY + boxHeight/2)
    ctx.lineTo(centerX, centerY - boxHeight/2)
    ctx.closePath()
    ctx.stroke()
    
    // Box 2
    ctx.beginPath()
    ctx.moveTo(centerX + boxWidth/2, centerY - boxHeight/2)
    ctx.lineTo(centerX + boxWidth/2, centerY + boxHeight/2)
    ctx.lineTo(centerX + boxWidth * 1.5, centerY + boxHeight/2)
    ctx.lineTo(centerX + boxWidth * 1.5, centerY - boxHeight/2)
    ctx.closePath()
    ctx.stroke()
    
    // Arrow between boxes
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + boxWidth/2, centerY)
    ctx.stroke()
  }

  private async extractDrawingPaths(imageBuffer: Buffer, width: number, height: number): Promise<DrawingPath[][]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load image using canvas
        const img = await loadImage(imageBuffer)
        
        // Create canvas for image processing
        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext('2d')
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height)
        const paths = this.imageDataToDrawingPaths(imageData, width, height)
        
        resolve(paths)
      } catch (error) {
        reject(error)
      }
    })
  }

  private imageDataToDrawingPaths(imageData: any, width: number, height: number): DrawingPath[][] {
    const { data } = imageData
    const paths: DrawingPath[][] = []
    const visited = new Set<string>()
    
    console.log(`[WHITEBOARD] Processing image data: ${width}x${height}`)
    
    // Simple edge detection and path tracing
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = (y * width + x) * 4
        const isBlackPixel = data[index] < 128 // Black pixel detection
        
        if (isBlackPixel && !visited.has(`${x},${y}`)) {
          const path = this.tracePath(data, width, height, x, y, visited)
          if (path.length > 5) { // Only keep paths with sufficient points
            paths.push(path)
          }
        }
      }
    }
    
    console.log(`[WHITEBOARD] Extracted ${paths.length} drawing paths`)
    
    // Optimize drawing order (left to right, top to bottom)
    return this.optimizeDrawingOrder(paths)
  }

  private tracePath(data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number, visited: Set<string>): DrawingPath[] {
    const path: DrawingPath[] = []
    const stack: [number, number][] = [[startX, startY]]
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
        continue
      }
      
      const index = (y * width + x) * 4
      if (data[index] >= 128) continue // Not a black pixel
      
      visited.add(key)
      path.push({ x, y })
      
      // Check 8-connected neighbors
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue
          stack.push([x + dx, y + dy])
        }
      }
    }
    
    return path
  }

  private optimizeDrawingOrder(paths: DrawingPath[][]): DrawingPath[][] {
    // Sort paths by position (left to right, top to bottom)
    return paths.sort((a, b) => {
      const aStart = a[0]
      const bStart = b[0]
      return (aStart.y - bStart.y) || (aStart.x - bStart.x)
    })
  }

  private async createAnimatedVideo(
    paths: DrawingPath[][],
    options: {
      width: number
      height: number
      duration: number
      strokeStyle: string
      lineWidth: number
      animationSpeed: number
      baseImageBuffer?: Buffer
      imageStyle?: 'whiteboard_bw' | 'whiteboard_color'
      headerTitle?: string
    }
  ): Promise<Buffer> {
    const { width, height, duration, strokeStyle, lineWidth, baseImageBuffer, imageStyle, headerTitle } = options
    
    console.log(`[WHITEBOARD] Creating animated video for ${paths.length} paths`)
    
    // Create a temporary directory with a safe name
    const timestamp = Date.now()
    const tempJobDir = path.join(this.tempDir, `wb_${timestamp}`)
    console.log(`[WHITEBOARD] Creating temp directory: ${tempJobDir}`)
    
    try {
      await fs.mkdir(tempJobDir, { recursive: true })
      
      // Calculate frames needed
      const fps = 30
      const totalFrames = Math.ceil(duration * fps)
      const useColorMask = imageStyle === 'whiteboard_color' && baseImageBuffer

      // -------- Header setup (animated write + underline) --------
      const padX = Math.floor(width * 0.03)
      const padY = Math.floor(height * 0.06)
      const usableW = Math.max(50, width - padX * 2)
      const HEADER_SECONDS = 3
      const headerTotalFrames = Math.min(Math.max(1, Math.floor(duration * fps) - 1), Math.floor(fps * HEADER_SECONDS))
      const titlePhaseFrames = Math.max(1, Math.floor(headerTotalFrames * 0.7))
      const underlinePhaseFrames = Math.max(1, headerTotalFrames - titlePhaseFrames)

      // Fit header font to available width
      const fitTitleFont = (title: string, maxWidth: number, basePx: number) => {
        const test = createCanvas(10, 10)
        const m = test.getContext('2d')
        let size = basePx
        let measured = 0
        const fmt = (s: number) => `700 ${s}px Arial, Helvetica, sans-serif`
        // Decrease size until it fits
        while (size > 16) {
          m.font = fmt(size)
          measured = m.measureText(title).width
          if (measured <= maxWidth) break
          size -= 2
        }
        const ascent = Math.ceil(m.measureText('M').actualBoundingBoxAscent || size * 0.82)
        const heightPx = Math.ceil(size)
        return { size, width: Math.ceil(measured), ascent, height: heightPx }
      }

      const titleText = (headerTitle || '').trim()
      const baseFont = Math.floor(height * 0.055)
      const fit = fitTitleFont(titleText || ' ', usableW, baseFont)
      const headerFontSize = fit.size

      // Offscreen header canvas for progressive reveal
      const hdr = createCanvas(Math.max(2, fit.width + 4), Math.max(2, fit.height + 6))
      const hctx = hdr.getContext('2d')
      hctx.font = `700 ${headerFontSize}px Arial, Helvetica, sans-serif`
      hctx.textBaseline = 'alphabetic'
      hctx.fillStyle = '#111'
      const baseY = fit.ascent + 2
      hctx.fillText(titleText, 0, baseY)
      hctx.translate(0.4, 0.2)
      hctx.fillText(titleText, 0, baseY)

      const headerW = fit.width
      const headerH = fit.height
      const underlineY = padY + headerH + Math.max(6, Math.floor(headerFontSize * 0.2))
      const reservedTop = underlineY + Math.max(12, Math.floor(headerFontSize * 0.4))
      const bottomPad = Math.floor(height * 0.05)

      // Precompute underline points for a slight wiggle
      const underlinePoints: Array<{ x: number; y: number }> = []
      const seg = 22
      const wobble = Math.max(0.8, headerFontSize * 0.02)
      for (let i = 0; i <= seg; i++) {
        const s = i / seg
        const x = padX + headerW * s
        const y = underlineY + Math.sin(i * 1.3) * wobble * 0.5
        underlinePoints.push({ x, y })
      }

      // Scale drawing to stay below header
      const drawScale = Math.min(1, (height - reservedTop - bottomPad) / height)
      const drawOffsetX = Math.round((width - Math.floor(width * drawScale)) / 2)
      const drawOffsetY = reservedTop
      const baseImg = useColorMask ? await loadImage(baseImageBuffer as Buffer) : null
      
      // Create frames showing progressive drawing
      for (let frame = 0; frame < totalFrames; frame++) {
        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext('2d')
        
        // White background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, width, height)
        
        // Draw header with animated write/underline
        if (titleText) {
          const frameInHeader = Math.min(headerTotalFrames, frame)
          const titleProgress = frameInHeader <= titlePhaseFrames
            ? frameInHeader / titlePhaseFrames
            : 1
          const srcW = Math.max(0, Math.floor(headerW * titleProgress))
          if (srcW > 0) {
            ctx.drawImage(hdr as any, 0, 0, srcW, hdr.height, padX, padY, srcW, hdr.height)
          }
          // Pen tip while writing
          if (srcW < headerW) {
            const tipX = padX + srcW
            const tipY = padY + headerH - Math.max(12, Math.min(20, Math.floor(headerH * 0.35)))
            ctx.beginPath()
            ctx.arc(tipX, tipY, Math.max(3, Math.floor(headerH * 0.08)), 0, Math.PI * 2)
            ctx.fillStyle = '#111'
            ctx.fill()
          }
          // Underline phase after title completes
          const uStart = titlePhaseFrames
          if (frame > uStart) {
            const uFrame = Math.min(underlinePhaseFrames, frame - uStart)
            const pU = Math.max(0, Math.min(1, uFrame / underlinePhaseFrames))
            ctx.beginPath()
            const maxIdx = Math.max(1, Math.floor(underlinePoints.length * pU))
            for (let i = 0; i < maxIdx; i++) {
              const pt = underlinePoints[i]
              if (i === 0) ctx.moveTo(pt.x, pt.y)
              else ctx.lineTo(pt.x, pt.y)
            }
            ctx.strokeStyle = '#111'
            ctx.lineWidth = 3
            ctx.stroke()
          }
        }

        // Calculate how much of the drawing to show
        const progress = frame < headerTotalFrames
          ? 0
          : Math.min((frame - headerTotalFrames) / (totalFrames - headerTotalFrames) * 0.8 + 0.0001, 1)
        const pathsToShow = Math.floor(paths.length * progress)

        if (useColorMask && baseImg) {
          // Draw full color base image, scaled to keep below header
          ctx.drawImage(baseImg as any, 0, reservedTop, width, height - reservedTop)

          // Build a mask from revealed strokes
          const mask = createCanvas(width, height)
          const mctx = mask.getContext('2d')
          mctx.fillStyle = 'rgba(0,0,0,0)'
          mctx.fillRect(0, 0, width, height)
          mctx.strokeStyle = 'black'
          mctx.lineWidth = Math.max(4, Math.floor(lineWidth * 2.5))
          mctx.lineCap = 'round'
          mctx.lineJoin = 'round'

          // Draw in transformed space so strokes stay below header and slightly smaller
          mctx.save()
          mctx.translate(drawOffsetX, drawOffsetY)
          mctx.scale(drawScale, drawScale)
          for (let i = 0; i < pathsToShow; i++) {
            const path = paths[i]
            if (path && path.length > 1) {
              mctx.beginPath()
              mctx.moveTo(path[0].x, path[0].y)
              for (let j = 1; j < path.length; j++) {
                mctx.lineTo(path[j].x, path[j].y)
              }
              mctx.stroke()
            }
          }
          mctx.restore()

          // Apply mask: keep only pixels where mask has been drawn
          ctx.globalCompositeOperation = 'destination-in'
          ctx.drawImage(mask as any, 0, 0)
          ctx.globalCompositeOperation = 'source-over'
        } else {
          // Classic BW stroke drawing (scaled below header)
          ctx.strokeStyle = strokeStyle
          ctx.lineWidth = lineWidth
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          ctx.save()
          ctx.translate(drawOffsetX, drawOffsetY)
          ctx.scale(drawScale, drawScale)
          for (let i = 0; i < pathsToShow; i++) {
            const path = paths[i]
            if (path && path.length > 1) {
              ctx.beginPath()
              ctx.moveTo(path[0].x, path[0].y)
              for (let j = 1; j < path.length; j++) {
                ctx.lineTo(path[j].x, path[j].y)
              }
              ctx.stroke()
            }
          }
          ctx.restore()
        }
        
        // Save frame
        const frameNumber = String(frame + 1).padStart(6, '0')
        const framePath = path.join(tempJobDir, `frame_${frameNumber}.png`)
        const buffer = canvas.toBuffer('image/png')
        await fs.writeFile(framePath, buffer)
      }
      
      // Create video from frames
      const videoPath = path.join(tempJobDir, 'animation.mp4')
      await this.createVideoFromFrames(tempJobDir, videoPath, fps)
      
      // Read video buffer
      const videoBuffer = await fs.readFile(videoPath)
      
      // Clean up
      await fs.rm(tempJobDir, { recursive: true, force: true })
      
      return videoBuffer
    } catch (error) {
      // Clean up on error
      try {
        await fs.rm(tempJobDir, { recursive: true, force: true })
      } catch (cleanupError) {
        console.warn('[WHITEBOARD] Failed to cleanup temp directory:', cleanupError)
      }
      throw error
    }
  }
  
  private async createVideoFromFrames(framesDir: string, outputPath: string, fps: number): Promise<void> {
    const ffmpeg = require('fluent-ffmpeg')
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(framesDir, 'frame_%06d.png'))
        .inputFPS(fps)
        .outputOptions([
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        ])
        .output(outputPath)
        .on('end', () => {
          console.log('[WHITEBOARD] Video creation completed')
          resolve()
        })
        .on('error', (err: any) => {
          console.error('[WHITEBOARD] FFmpeg error:', err)
          reject(err)
        })
        .run()
    })
  }
  
  private async createSimpleVideo(imagePath: string, outputPath: string, duration: number): Promise<void> {
    const ffmpeg = require('fluent-ffmpeg')
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .inputOptions(['-loop', '1'])
        .outputOptions([
          '-c:v', 'libx264',
          '-t', duration.toString(),
          '-pix_fmt', 'yuv420p',
          '-r', '30'
        ])
        .output(outputPath)
        .on('end', () => {
          console.log('[WHITEBOARD] Simple video creation completed')
          resolve()
        })
        .on('error', (err: Error) => {
          console.error('[WHITEBOARD] Simple video creation failed:', err.message || err)
          reject(new Error(`FFmpeg error: ${err.message || 'Unknown error'}`))
        })
        .run()
    })
  }

  private async framesToVideo(framesDir: string, outputPath: string, fps: number): Promise<void> {
    const ffmpeg = require('fluent-ffmpeg')
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(framesDir, 'frame_%06d.png'))
        .inputFPS(fps)
        .outputOptions([
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-r', fps.toString()
        ])
        .output(outputPath)
        .on('end', () => {
          console.log('[WHITEBOARD] Video creation completed')
          resolve()
        })
        .on('error', (err: Error) => {
          console.error('[WHITEBOARD] Video creation failed:', err.message || err)
          reject(new Error(`FFmpeg error: ${err.message || 'Unknown error'}`))
        })
        .run()
    })
  }
}

export const whiteboardAnimator = new WhiteboardAnimator()
