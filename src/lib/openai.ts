import OpenAI from 'openai'
import { ScriptResponse } from '@/types'
import { getTheme, generateThemedImagePrompt, generateContentSpecificPrompt } from './themes'

function getThemeSpecificGuidelines(themeId: string): string {
  switch (themeId) {
    case 'whiteboard':
      return `WHITEBOARD THEME:
- Create "Simple sketch illustrations on clean white paper"
- Use "Direct top-down perspective with flat, 2D appearance"
- Show "Completed sketch artwork already on the page"
- Include "Clear header text at the top" - spelled correctly and based on the script for the scene
- Feature "One central simple drawing" showing the key concept
- Maintain "Abundant white space around the drawing for clean appearance"
- Use "Black ink only, basic geometric shapes, minimal detail"
- Style: "Educational sketch illustration, clean and simple"
- Avoid: complex illustrations, professional diagrams, or detailed artwork`

    case 'modern_infographic':
      return `MODERN INFOGRAPHIC THEME:
- Use "Professional modern infographic design with clean geometric shapes"
- Include "Modern typography and professional color palette"
- Describe "Grid-based layout with clear information hierarchy"
- Specify "Professional blue and white color scheme with accent colors"
- Use "Icon-based design with data visualization elements"
- Emphasize "Corporate style with minimalist design"
- Include "High contrast, clean, professional presentation"`

    case 'sketchy_notes':
      return `SKETCHY NOTES THEME:
- Use "Hand-drawn sketchy notebook style illustration on notebook paper background"
- Include "Pencil and pen illustrations with doodle-style elements"
- Describe "Informal handwritten text style with personal note-taking aesthetic"
- Specify "Black ink on light paper with subtle paper texture"
- Use "Organic, flowing layout with natural text placement"
- Emphasize "Rough sketch aesthetic with personal, informal style"
- Include "Doodle-style elements and rough, hand-drawn appearance"`

    case 'corporate_presentation':
      return `CORPORATE PRESENTATION THEME:
- Use "Professional corporate presentation slide design with clean business layout"
- Include "Professional charts and graphs with corporate color scheme"
- Describe "Grid-based professional layout with clear data hierarchy"
- Specify "Corporate blue, white, and gray with accent colors"
- Use "Formal typography with high-contrast design"
- Emphasize "Executive presentation style with business-focused design"
- Include "Data visualization with professional, formal appearance"`

    case 'educational_illustration':
      return `EDUCATIONAL ILLUSTRATION THEME:
- Use "Colorful educational illustration design with bright educational colors"
- Include "Friendly illustrations with learning-focused design"
- Describe "Clear visual hierarchy with engaging graphics"
- Specify "Bright, educational colors with high contrast"
- Use "Child-friendly style with educational content focus"
- Emphasize "Engaging, colorful, and learning-oriented design"
- Include "Friendly, readable fonts perfect for learning"`

    default:
      return `DEFAULT THEME (${themeId}):
- Use professional, clean design appropriate for educational content
- Include clear visual hierarchy and engaging graphics
- Describe appropriate color schemes and composition
- Specify professional typography and layout
- Emphasize high-quality, educational content
- Include appropriate styling for the selected theme`
  }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

const STYLE_PROFILE = 'Professional infographic style, clean white background, modern design, educational content, safe for work, appropriate for all audiences, minimal text, high quality'

function buildWhiteboardIllustrationPrompt(simpleSubject: string, variant: 'whiteboard_bw' | 'whiteboard_color' | 'clipart' = 'whiteboard_bw'): string {
  const subject = simpleSubject.trim()
  if (variant === 'clipart') {
    return `Clipart of a ${subject}, simple and clean design, blank white background, no shadows, no extra text.`
  }
  if (variant === 'whiteboard_color') {
    return `A hand-drawn illustration of a ${subject}, whiteboard style, simple and clean design, blank white background, no shadows, no extra text.`
  }
  return `A hand-drawn black and white illustration of a ${subject}, whiteboard style, bold marker lines, simple and clean design, blank white background, no shadows, no extra text.`
}

function simplifyDescriptionForSubject(description: string): string {
  // Convert an arbitrary description into a short subject phrase (2-8 words)
  const cleaned = (description || '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/["'`]/g, '')
    .trim()
  if (!cleaned) return 'simple icon'
  const words = cleaned.split(' ').slice(0, 8)
  return words.join(' ')
}

export async function generateScript(
  prompt: string,
  targetDuration: number,
  language: string = 'English',
  imageTheme: string = 'whiteboard'
): Promise<ScriptResponse> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not set. Cannot generate real script.')
  }

  // Calculate optimal number of scenes based on target duration
  // Aim for 20-25 seconds per scene (including pauses)
  const idealSceneDuration = 22 // 20 seconds content + 2 seconds pause
  const numScenes = Math.max(3, Math.min(12, Math.round(targetDuration / idealSceneDuration)))
  
  const pauseDuration = 3 // 3 seconds between scenes
  const totalPauseTime = (numScenes - 1) * pauseDuration
  const availableContentTime = targetDuration - totalPauseTime
  const avgSceneDuration = Math.floor(availableContentTime / numScenes)
  
  // Ensure scenes are between 15-30 seconds, but prioritize filling the target duration
  const minSceneDuration = Math.max(15, Math.floor(avgSceneDuration * 0.8))
  const maxSceneDuration = Math.min(30, Math.floor(avgSceneDuration * 1.2))

  const systemPrompt = `You are a professional video script writer. Create a structured explainer video script.

Requirements:
- Generate exactly ${numScenes} scenes
- Total content duration should be ${availableContentTime} seconds (target: ${targetDuration}s with 3s pauses between scenes)
- Each scene should be ${minSceneDuration}-${maxSceneDuration} seconds long
- Narration should be 125-160 words per minute
- Use clear, engaging language in ${language}
- Each scene should have a clear goal and purpose
- Include on-screen captions and detailed image descriptions
- Distribute content evenly across scenes to fill the ${availableContentTime} seconds

IMPORTANT: For image descriptions, produce a SIMPLE SUBJECT PHRASE designed for DALL·E prompting in a whiteboard style when applicable.
If the theme is whiteboard, keep the imageDescription extremely concise (2-8 words), noun phrase only, no verbs, no style words, no punctuation, no quotes. Examples: "heart diagram", "doctor with stethoscope", "bar chart"
If the theme is not whiteboard, keep it concise but specific (<= 12 words).

Theme-Specific Image Description Guidelines:

${getThemeSpecificGuidelines(imageTheme)}

Context Awareness:
- Consider the overall video topic and theme
- Build upon previous scenes and set up future scenes
- Include specific visual elements, composition, and style details
- Are appropriate for educational, professional content
- Avoid any content that could be flagged by content safety systems

General Guidelines:
- Be specific about visual elements (charts, diagrams, illustrations, etc.)
- Include composition details (layout, positioning, hierarchy)
- Mention color schemes and style elements appropriate for the theme
- Consider the scene's position in the overall video narrative
- Make descriptions that will generate consistent, high-quality visuals

Return a JSON object with this exact structure:
{
  "title": "Video Title",
  "totalDuration": ${targetDuration},
  "scenes": [
    {
      "sceneId": "scene_1",
      "goal": "One sentence describing what this scene accomplishes",
      "narration": "The spoken narration text for this scene",
      "caption": "On-screen text caption (short and impactful)",
  "imageDescription": "Short subject phrase for DALL·E (for whiteboard: 2-8 words, noun phrase only)",
      "duration": ${avgSceneDuration}
    }
  ]
}`

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000
  })

  let content = resp.choices[0]?.message?.content
  if (!content) throw new Error('No content from OpenAI')
  // Some models return markdown code fences. Strip them if present.
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch && fenceMatch[1]) {
    content = fenceMatch[1]
  }
  // As a fallback, try to isolate the first JSON object
  if (content.trim().startsWith('```')) {
    // remove any leading backticks remnants
    content = content.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '')
  }
  // If still contains text around JSON, slice between first { and last }
  if (!content.trim().startsWith('{')) {
    const first = content.indexOf('{')
    const last = content.lastIndexOf('}')
    if (first !== -1 && last !== -1 && last > first) {
      content = content.slice(first, last + 1)
    }
  }
  return JSON.parse(content) as ScriptResponse
}

export async function generateImage(
  description: string,
  styleProfile: string = STYLE_PROFILE
): Promise<Buffer> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not set. Cannot generate real images.')
  }

  // Sanitize the description to be more appropriate for DALL-E
  const sanitizedDescription = description
    .replace(/[^\w\s\-.,!?]/g, '') // Remove special characters that might trigger safety filters
    .replace(/\b(?:violence|weapon|gun|knife|blood|death|kill|murder|hate|discrimination|explicit|adult|sexual|nude|naked|porn|nsfw)\b/gi, '') // Remove potentially problematic words
    .trim()

  const prompt = `${styleProfile}. ${sanitizedDescription}. High quality, professional, clean composition, educational content.`
  
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd'
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) throw new Error('No image URL generated from OpenAI')
    
    // Download the image from the URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) throw new Error('Failed to download image from OpenAI')
    const imageBuffer = await imageResponse.arrayBuffer()
    return Buffer.from(imageBuffer)
  } catch (error: any) {
    // If the prompt is rejected by safety system, try with a more generic description
    if (error.message?.includes('safety') || error.message?.includes('rejected')) {
      console.warn('Original prompt rejected by safety system, trying with generic description')
      const fallbackPrompt = `${styleProfile}. Professional infographic diagram with clean design, educational content, appropriate for all audiences.`
      
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: fallbackPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd'
      })

      const imageUrl = response.data?.[0]?.url
      if (!imageUrl) throw new Error('No image URL generated from OpenAI fallback')
      
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) throw new Error('Failed to download fallback image from OpenAI')
      const imageBuffer = await imageResponse.arrayBuffer()
      return Buffer.from(imageBuffer)
    }
    throw error
  }
}

export async function generateThemedImage(
  description: string,
  themeId: string = 'whiteboard',
  sceneIndex: number = 0,
  totalScenes: number = 6,
  imageStyle?: string
): Promise<Buffer> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not set. Cannot generate real images.')
  }

  const theme = getTheme(themeId)
  // Use the simplified whiteboard illustration prompt for whiteboard theme
  const prompt = theme.id === 'whiteboard'
    ? buildWhiteboardIllustrationPrompt(
        simplifyDescriptionForSubject(description),
        (imageStyle as any) || 'whiteboard_bw'
      )
    : generateThemedImagePrompt(description, theme, sceneIndex, totalScenes)
  
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd'
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) throw new Error('No image URL generated from OpenAI')
    
    // Download the image from the URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) throw new Error('Failed to download image from OpenAI')
    const imageBuffer = await imageResponse.arrayBuffer()
    return Buffer.from(imageBuffer)
  } catch (error: any) {
    // If the prompt is rejected by safety system, try with a more generic description
    if (error.message?.includes('safety') || error.message?.includes('rejected')) {
      console.warn('Original prompt rejected by safety system, trying with generic description')
      const fallbackPrompt = `${theme.basePrompt}. Professional diagram with clean design, educational content, appropriate for all audiences.`
      
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: fallbackPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd'
      })

      const imageUrl = response.data?.[0]?.url
      if (!imageUrl) throw new Error('No image URL generated from OpenAI fallback')
      
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) throw new Error('Failed to download fallback image from OpenAI')
      const imageBuffer = await imageResponse.arrayBuffer()
      return Buffer.from(imageBuffer)
    }
    throw error
  }
}

export async function generateContentSpecificImage(
  narration: string,
  description: string,
  themeId: string = 'whiteboard',
  sceneIndex: number = 0,
  totalScenes: number = 6,
  videoDimensions?: { width: number; height: number },
  context?: {
    originalPrompt?: string
    videoTitle?: string
    previousScenes?: any[]
    nextScenes?: any[]
  },
  imageStyle?: string
): Promise<Buffer> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not set. Cannot generate real images.')
  }

  const theme = getTheme(themeId)
  
  // Prefer the whiteboard illustration prompt for whiteboard theme
  let prompt: string
  if (theme.id === 'whiteboard') {
    const subject = simplifyDescriptionForSubject(description)
    prompt = buildWhiteboardIllustrationPrompt(subject, (imageStyle as any) || 'whiteboard_bw')
    console.log(`[DALL-E PROMPT] Whiteboard illustration prompt for scene ${sceneIndex + 1}:`, prompt)
  } else if (context) {
    // Use enhanced contextual prompt generation
    prompt = generateContextualImagePrompt(narration, description, theme, sceneIndex, totalScenes, context)
    console.log(`[DALL-E PROMPT] Enhanced contextual prompt for scene ${sceneIndex + 1}:`, prompt)
  } else {
    // Fallback to original prompt generation
    prompt = generateContentSpecificPrompt(narration, description, theme, sceneIndex, totalScenes)
    console.log(`[DALL-E PROMPT] Fallback prompt for scene ${sceneIndex + 1}:`, prompt)
  }
  
  // Determine the best size based on video dimensions
  let imageSize = '1024x1024' // Default square
  if (videoDimensions) {
    const { width, height } = videoDimensions
    const aspectRatio = width / height
    
    if (Math.abs(aspectRatio - 16/9) < 0.1) {
      imageSize = '1792x1024' // 16:9 aspect ratio
    } else if (Math.abs(aspectRatio - 9/16) < 0.1) {
      imageSize = '1024x1792' // 9:16 aspect ratio (vertical)
    } else if (Math.abs(aspectRatio - 4/3) < 0.1) {
      imageSize = '1024x768' // 4:3 aspect ratio
    } else if (Math.abs(aspectRatio - 3/4) < 0.1) {
      imageSize = '768x1024' // 3:4 aspect ratio (vertical)
    } else if (Math.abs(aspectRatio - 1) < 0.1) {
      imageSize = '1024x1024' // 1:1 aspect ratio (square)
    }
  }
  
  // Add debugging to see what prompt is actually being sent
  console.log(`[DEBUG] Content-specific image prompt for scene ${sceneIndex + 1}:`, prompt)
  console.log(`[DEBUG] Video dimensions: ${videoDimensions?.width}x${videoDimensions?.height}, using image size: ${imageSize}`)
  
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: imageSize as any,
      quality: 'hd'
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) throw new Error('No image URL generated from OpenAI')
    
    console.log(`[DEBUG] Generated image URL: ${imageUrl}`)
    
    // Download the image from the URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) throw new Error('Failed to download image from OpenAI')
    const imageBuffer = await imageResponse.arrayBuffer()
    return Buffer.from(imageBuffer)
  } catch (error: any) {
    // If the prompt is rejected by safety system, try with a more generic description
    if (error.message?.includes('safety') || error.message?.includes('rejected')) {
      console.warn('Original prompt rejected by safety system, trying with generic description')
      const fallbackPrompt = `Very simple hand-drawn sketch on white paper with black pen, like a child drew it. Header text at top. One simple drawing in center. Lots of white space. No other text. No colors. Top-down view. Minimal and clean.`
      
      console.log(`[DEBUG] Fallback prompt:`, fallbackPrompt)
      
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: fallbackPrompt,
        n: 1,
        size: imageSize as any,
        quality: 'hd'
      })

      const imageUrl = response.data?.[0]?.url
      if (!imageUrl) throw new Error('No image URL generated from OpenAI fallback')
      
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) throw new Error('Failed to download fallback image from OpenAI')
      const imageBuffer = await imageResponse.arrayBuffer()
      return Buffer.from(imageBuffer)
    }
    throw error
  }
}

function generateContextualImagePrompt(
  narration: string,
  description: string,
  theme: any,
  sceneIndex: number,
  totalScenes: number,
  context: {
    originalPrompt?: string
    videoTitle?: string
    previousScenes?: any[]
    nextScenes?: any[]
  }
): string {
  const { originalPrompt, videoTitle, previousScenes, nextScenes } = context
  
  // Extract header from narration
  const header = extractHeaderFromNarration(narration)
  
  // Build context-aware prompt
  let contextualPrompt = `${theme.basePrompt}. `
  
  // Add video context
  if (originalPrompt) {
    contextualPrompt += `Video topic: "${originalPrompt}". `
  }
  if (videoTitle) {
    contextualPrompt += `Video title: "${videoTitle}". `
  }
  
  // Add scene context
  contextualPrompt += `Scene ${sceneIndex + 1} of ${totalScenes}. `
  
  // Add previous scene context for continuity
  if (previousScenes && previousScenes.length > 0) {
    const prevScene = previousScenes[previousScenes.length - 1]
    contextualPrompt += `Previous scene covered: ${prevScene.goal}. `
  }
  
  // Add next scene context for setup
  if (nextScenes && nextScenes.length > 0) {
    const nextScene = nextScenes[0]
    contextualPrompt += `Next scene will cover: ${nextScene.goal}. `
  }
  
  // Add main content
  contextualPrompt += `Header: "${header}". Main content: ${description}. `
  
  // Add theme-specific styling
  contextualPrompt += `${theme.styleElements.join(', ')}. ${theme.colorScheme}. ${theme.composition}. `
  
  // Add consistency requirements
  contextualPrompt += `Maintain visual consistency with ${theme.consistencyKeywords.join(', ')} style. `
  
  // Add quality and safety requirements
  contextualPrompt += `High quality, educational content, appropriate for all audiences.`
  
  // Add explicit positive instructions for whiteboard theme
  if (theme.id === 'whiteboard') {
    contextualPrompt += ` This is a completed sketch illustration on white paper. The drawing appears as a finished artwork already on the page. Show only the final drawing result, not the drawing process.`
  }
  
  console.log(`[DALL-E PROMPT DEBUG] Theme: ${theme.id}`)
  console.log(`[DALL-E PROMPT DEBUG] Theme basePrompt: ${theme.basePrompt}`)
  console.log(`[DALL-E PROMPT DEBUG] Theme styleElements: ${theme.styleElements.join(', ')}`)
  console.log(`[DALL-E PROMPT DEBUG] Theme colorScheme: ${theme.colorScheme}`)
  console.log(`[DALL-E PROMPT DEBUG] Theme composition: ${theme.composition}`)
  console.log(`[DALL-E PROMPT DEBUG] Header extracted: "${header}"`)
  console.log(`[DALL-E PROMPT DEBUG] Description: ${description}`)
  console.log(`[DALL-E PROMPT DEBUG] Final contextual prompt: ${contextualPrompt}`)
  
  return contextualPrompt
}

function extractHeaderFromNarration(narration: string): string {
  // Extract the first sentence or key phrase to use as header
  const sentences = narration.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) return 'Topic'
  
  const firstSentence = sentences[0].trim()
  
  // Clean up the header - remove extra spaces, fix common issues
  let header = firstSentence
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, '') // Remove special characters that might cause issues
    .trim()
  
  // If header is too long, take first few words
  if (header.length > 40) {
    const words = header.split(' ')
    header = words.slice(0, 5).join(' ')
  }
  
  return header
}

export function calculateTokenCost(promptTokens: number, completionTokens: number): number {
  // Simple approximate costing for demonstration (adjust as needed)
  const inputCostPerToken = 0.0000015 // $ per token
  const outputCostPerToken = 0.000002  // $ per token
  return promptTokens * inputCostPerToken + completionTokens * outputCostPerToken
}

export async function generateVideo(
  description: string,
  styleProfile: string = STYLE_PROFILE,
  duration: number = 5
): Promise<Buffer> {
  // Not used in current pipeline; return empty buffer for compatibility
  return Buffer.from('')
}

export async function generateWhiteboardPlan(
  narration: string,
  imageDescription: string
): Promise<string[]> {
  if (!openai) {
    return []
  }
  const systemPrompt = `You are planning a whiteboard drawing to accompany a narrated scene. 
Create 3-6 concise bullet points that the hand will draw/write, in order, to visually reinforce the narration.
Keep each bullet under 8 words. Return JSON array of strings only.`
  const userPrompt = `Narration: ${narration}\nImage focus: ${imageDescription}`
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.5,
    max_tokens: 300
  })
  let content = resp.choices[0]?.message?.content || '[]'
  const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence && fence[1]) content = fence[1]
  try {
    const arr = JSON.parse(content)
    return Array.isArray(arr) ? arr.slice(0, 6).map(s => String(s)) : []
  } catch {
    return []
  }
}

export async function generateSpeech(
  text: string,
  voice: string = 'alloy'
): Promise<Buffer> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not set. Cannot generate speech.')
  }

  // Simple retry to avoid transient API hiccups
  let lastError: unknown
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as any,
        input: text,
        response_format: 'mp3'
      })

      const contentType = response.headers.get('content-type') || ''
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Validate that we received MP3 data (starts with 'ID3' or frame sync 0xFF 0xFB)
      const looksLikeMp3 =
        buffer.length > 1000 &&
        (
          (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
          (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
        )

      if (!contentType.includes('audio') || !looksLikeMp3) {
        // Try to extract error text for debugging
        try {
          const textResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice as any,
            input: text,
            response_format: 'json'
          })
          const errorText = await textResponse.text()
          throw new Error(`OpenAI TTS returned non-audio payload (content-type=${contentType}). Details: ${errorText}`)
        } catch {
          throw new Error(`OpenAI TTS returned non-audio payload (content-type=${contentType}).`)
        }
      }

      return buffer
    } catch (err) {
      lastError = err
      if (attempt === 2) break
      await new Promise(r => setTimeout(r, 300))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('OpenAI TTS failed')
}


