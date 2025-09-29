import { ImageTheme, getTheme } from './themes'
import { ScriptScene } from '@/types'

export interface ImageDescriptionContext {
  originalPrompt: string
  videoTitle: string
  totalDuration: number
  sceneIndex: number
  totalScenes: number
  theme: ImageTheme
  previousScenes?: ScriptScene[]
  nextScenes?: ScriptScene[]
}

export interface EnhancedImageDescription {
  description: string
  visualElements: string[]
  composition: string
  colorPalette: string
  textElements: string[]
  styleNotes: string[]
}

/**
 * Generates a context-aware, detailed image description for DALL-E
 * Takes into account the full video context, theme, and scene position
 */
export async function generateContextualImageDescription(
  scene: ScriptScene,
  context: ImageDescriptionContext
): Promise<EnhancedImageDescription> {
  const { originalPrompt, videoTitle, theme, sceneIndex, totalScenes, previousScenes, nextScenes } = context

  // Build comprehensive context for the AI
  const contextPrompt = buildContextPrompt(scene, context)
  
  // For now, we'll use a sophisticated prompt engineering approach
  // In the future, this could call an AI model for even better descriptions
  const description = generateDescriptionFromContext(scene, contextPrompt, theme)
  
  return {
    description: description.main,
    visualElements: description.visualElements,
    composition: description.composition,
    colorPalette: description.colorPalette,
    textElements: description.textElements,
    styleNotes: description.styleNotes
  }
}

function buildContextPrompt(scene: ScriptScene, context: ImageDescriptionContext): string {
  const { originalPrompt, videoTitle, theme, sceneIndex, totalScenes, previousScenes, nextScenes } = context
  
  let contextInfo = `Video Context:
- Original Request: "${originalPrompt}"
- Video Title: "${videoTitle}"
- Total Duration: ${context.totalDuration} seconds
- Scene ${sceneIndex + 1} of ${totalScenes}
- Theme: ${theme.name} (${theme.description})

Current Scene:
- Goal: ${scene.goal}
- Narration: ${scene.narration}
- Caption: ${scene.caption}
- Duration: ${scene.duration} seconds`

  if (previousScenes && previousScenes.length > 0) {
    contextInfo += `\n\nPrevious Scene Context:`
    previousScenes.slice(-2).forEach((prevScene, i) => {
      contextInfo += `\n- Scene ${sceneIndex - previousScenes.length + i + 1}: ${prevScene.goal}`
    })
  }

  if (nextScenes && nextScenes.length > 0) {
    contextInfo += `\n\nUpcoming Scene Context:`
    nextScenes.slice(0, 2).forEach((nextScene, i) => {
      contextInfo += `\n- Scene ${sceneIndex + i + 2}: ${nextScene.goal}`
    })
  }

  return contextInfo
}

function generateDescriptionFromContext(
  scene: ScriptScene, 
  contextPrompt: string, 
  theme: ImageTheme
): {
  main: string
  visualElements: string[]
  composition: string
  colorPalette: string
  textElements: string[]
  styleNotes: string[]
} {
  // Extract key concepts from the narration
  const keyConcepts = extractKeyConcepts(scene.narration)
  const visualMetaphors = generateVisualMetaphors(scene.narration, keyConcepts)
  
  // Build theme-specific description
  const themeSpecificDescription = buildThemeSpecificDescription(scene, theme, keyConcepts, visualMetaphors)
  
  // Determine composition based on scene position and content
  const composition = determineComposition(scene, theme)
  
  // Select appropriate color palette
  const colorPalette = selectColorPalette(theme, keyConcepts)
  
  // Identify text elements needed
  const textElements = identifyTextElements(scene, theme)
  
  // Generate style notes for consistency
  const styleNotes = generateStyleNotes(theme, scene)

  return {
    main: themeSpecificDescription,
    visualElements: visualMetaphors,
    composition,
    colorPalette,
    textElements,
    styleNotes
  }
}

function extractKeyConcepts(narration: string): string[] {
  // Extract key concepts, numbers, and important terms
  const concepts: string[] = []
  
  // Look for numbers and statistics
  const numbers = narration.match(/\d+(?:\.\d+)?%?/g)
  if (numbers) concepts.push(...numbers)
  
  // Look for important keywords (capitalized words, technical terms)
  const keywords = narration.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g)
  if (keywords) concepts.push(...keywords)
  
  // Look for quoted terms
  const quoted = narration.match(/"([^"]+)"/g)
  if (quoted) concepts.push(...quoted.map(q => q.replace(/"/g, '')))
  
  // Look for action words
  const actions = narration.match(/\b(?:show|demonstrate|illustrate|explain|highlight|focus|emphasize|reveal|display|present)\b/gi)
  if (actions) concepts.push(...actions)
  
  return [...new Set(concepts)] // Remove duplicates
}

function generateVisualMetaphors(narration: string, keyConcepts: string[]): string[] {
  const metaphors: string[] = []
  
  // Map concepts to visual metaphors
  keyConcepts.forEach(concept => {
    const lowerConcept = concept.toLowerCase()
    
    if (lowerConcept.includes('growth') || lowerConcept.includes('increase') || lowerConcept.includes('rise')) {
      metaphors.push('upward arrow', 'growing chart', 'ascending line')
    } else if (lowerConcept.includes('decrease') || lowerConcept.includes('decline') || lowerConcept.includes('fall')) {
      metaphors.push('downward arrow', 'declining chart', 'descending line')
    } else if (lowerConcept.includes('connection') || lowerConcept.includes('link') || lowerConcept.includes('relationship')) {
      metaphors.push('connecting lines', 'network diagram', 'linked nodes')
    } else if (lowerConcept.includes('process') || lowerConcept.includes('step') || lowerConcept.includes('flow')) {
      metaphors.push('flowchart', 'process diagram', 'step-by-step illustration')
    } else if (lowerConcept.includes('compare') || lowerConcept.includes('versus') || lowerConcept.includes('vs')) {
      metaphors.push('comparison chart', 'side-by-side diagram', 'contrast illustration')
    } else if (lowerConcept.includes('percentage') || lowerConcept.includes('%')) {
      metaphors.push('pie chart', 'percentage bar', 'statistical graph')
    } else if (lowerConcept.includes('timeline') || lowerConcept.includes('time') || lowerConcept.includes('chronological')) {
      metaphors.push('timeline', 'chronological sequence', 'time-based diagram')
    }
  })
  
  return [...new Set(metaphors)]
}

function buildThemeSpecificDescription(
  scene: ScriptScene, 
  theme: ImageTheme, 
  keyConcepts: string[], 
  visualMetaphors: string[]
): string {
  const { narration, caption, goal } = scene
  
  // Extract header from narration
  const header = extractHeaderFromNarration(narration)
  
  // Build description based on theme
  switch (theme.id) {
    case 'whiteboard':
      return buildWhiteboardDescription(header, keyConcepts, visualMetaphors, goal)
    
    case 'modern_infographic':
      return buildModernInfographicDescription(header, keyConcepts, visualMetaphors, goal)
    
    case 'sketchy_notes':
      return buildSketchyNotesDescription(header, keyConcepts, visualMetaphors, goal)
    
    case 'corporate_presentation':
      return buildCorporatePresentationDescription(header, keyConcepts, visualMetaphors, goal)
    
    case 'educational_illustration':
      return buildEducationalIllustrationDescription(header, keyConcepts, visualMetaphors, goal)
    
    default:
      return buildDefaultDescription(header, keyConcepts, visualMetaphors, goal, theme)
  }
}

function buildWhiteboardDescription(header: string, keyConcepts: string[], visualMetaphors: string[], goal: string): string {
  const mainVisual = visualMetaphors[0] || 'simple diagram'
  const conceptText = keyConcepts.slice(0, 3).join(', ')
  
  return `Simple sketch illustration on clean white paper. Completed artwork already on the page with direct top-down perspective and flat 2D appearance. Content-specific header at the top: "${header}" - spelled correctly and based on the script. One central simple drawing showing ${mainVisual}. Key concepts: ${conceptText}. Abundant white space around the drawing for clean appearance. Black ink only, basic geometric shapes, minimal detail, educational sketch style.`
}

function buildModernInfographicDescription(header: string, keyConcepts: string[], visualMetaphors: string[], goal: string): string {
  const mainVisual = visualMetaphors[0] || 'infographic diagram'
  const conceptText = keyConcepts.slice(0, 4).join(', ')
  
  return `Professional modern infographic design with clean geometric shapes and modern typography. Header: "${header}". Main visual element: ${mainVisual}. Key data points: ${conceptText}. Professional blue and white color scheme with accent colors. Grid-based layout with clear information hierarchy. Modern sans-serif fonts, clean and professional. High quality, educational content, appropriate for all audiences.`
}

function buildSketchyNotesDescription(header: string, keyConcepts: string[], visualMetaphors: string[], goal: string): string {
  const mainVisual = visualMetaphors[0] || 'sketchy illustration'
  const conceptText = keyConcepts.slice(0, 3).join(', ')
  
  return `Hand-drawn sketchy notebook style illustration on notebook paper background. Header: "${header}". Main drawing: ${mainVisual}. Key points: ${conceptText}. Pencil and pen illustrations with doodle-style elements. Informal handwritten text style. Rough sketch aesthetic with personal note-taking style. Black ink on light paper with subtle paper texture.`
}

function buildCorporatePresentationDescription(header: string, keyConcepts: string[], visualMetaphors: string[], goal: string): string {
  const mainVisual = visualMetaphors[0] || 'professional chart'
  const conceptText = keyConcepts.slice(0, 4).join(', ')
  
  return `Professional corporate presentation slide design with clean business layout. Header: "${header}". Main visual: ${mainVisual}. Key metrics: ${conceptText}. Professional charts and graphs with corporate color scheme. Formal typography with high-contrast design. Grid-based professional layout with clear data hierarchy. Corporate blue, white, and gray with accent colors.`
}

function buildEducationalIllustrationDescription(header: string, keyConcepts: string[], visualMetaphors: string[], goal: string): string {
  const mainVisual = visualMetaphors[0] || 'educational diagram'
  const conceptText = keyConcepts.slice(0, 3).join(', ')
  
  return `Colorful educational illustration design with bright educational colors. Header: "${header}". Main illustration: ${mainVisual}. Key concepts: ${conceptText}. Friendly illustrations with learning-focused design. Clear visual hierarchy with engaging graphics. Child-friendly style with educational content focus. Bright, educational colors with high contrast.`
}

function buildDefaultDescription(header: string, keyConcepts: string[], visualMetaphors: string[], goal: string, theme: ImageTheme): string {
  const mainVisual = visualMetaphors[0] || 'diagram'
  const conceptText = keyConcepts.slice(0, 3).join(', ')
  
  return `${theme.basePrompt}. Header: "${header}". Main visual: ${mainVisual}. Key elements: ${conceptText}. ${theme.styleElements.join(', ')}. ${theme.colorScheme}. ${theme.composition}. ${theme.textStyle}. High quality, educational content, appropriate for all audiences.`
}

function determineComposition(scene: ScriptScene, theme: ImageTheme): string {
  // Determine composition based on theme and scene content
  switch (theme.id) {
    case 'whiteboard':
      return 'Header at top, simple drawing in center, lots of white space'
    case 'modern_infographic':
      return 'Grid-based layout with clear information hierarchy'
    case 'sketchy_notes':
      return 'Organic, flowing layout with natural text placement'
    case 'corporate_presentation':
      return 'Grid-based professional layout with clear data hierarchy'
    case 'educational_illustration':
      return 'Clear educational layout with engaging visuals'
    default:
      return theme.composition
  }
}

function selectColorPalette(theme: ImageTheme, keyConcepts: string[]): string {
  // Select colors based on theme and content
  switch (theme.id) {
    case 'whiteboard':
      return 'Black pen on white paper only'
    case 'modern_infographic':
      return 'Professional blue and white with accent colors'
    case 'sketchy_notes':
      return 'Black ink on light paper with subtle paper texture'
    case 'corporate_presentation':
      return 'Corporate blue, white, and gray with accent colors'
    case 'educational_illustration':
      return 'Bright, educational colors with high contrast'
    default:
      return theme.colorScheme
  }
}

function identifyTextElements(scene: ScriptScene, theme: ImageTheme): string[] {
  const elements: string[] = []
  
  // Always include the caption
  if (scene.caption) {
    elements.push(`Caption: "${scene.caption}"`)
  }
  
  // Add header from narration
  const header = extractHeaderFromNarration(scene.narration)
  if (header) {
    elements.push(`Header: "${header}"`)
  }
  
  // Add theme-specific text elements
  switch (theme.id) {
    case 'whiteboard':
      elements.push('Simple text at top only')
      break
    case 'modern_infographic':
      elements.push('Modern sans-serif fonts, clean and professional')
      break
    case 'sketchy_notes':
      elements.push('Handwritten, informal, personal note style')
      break
    case 'corporate_presentation':
      elements.push('Professional sans-serif fonts, formal and business-like')
      break
    case 'educational_illustration':
      elements.push('Friendly, readable fonts perfect for learning')
      break
  }
  
  return elements
}

function generateStyleNotes(theme: ImageTheme, scene: ScriptScene): string[] {
  const notes: string[] = []
  
  // Add consistency keywords
  notes.push(...theme.consistencyKeywords)
  
  // Add scene-specific style notes
  if (scene.narration.length > 200) {
    notes.push('dense content - use clear visual hierarchy')
  }
  
  if (scene.narration.includes('step') || scene.narration.includes('process')) {
    notes.push('process-oriented - use sequential layout')
  }
  
  if (scene.narration.includes('compare') || scene.narration.includes('versus')) {
    notes.push('comparison content - use side-by-side layout')
  }
  
  return notes
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

/**
 * Enhanced script generation that uses contextual image descriptions
 */
export async function generateEnhancedScriptWithImageDescriptions(
  prompt: string,
  targetDuration: number,
  language: string = 'English',
  imageTheme: string = 'whiteboard'
): Promise<{
  script: any
  enhancedDescriptions: EnhancedImageDescription[]
}> {
  // This would integrate with the existing script generation
  // and enhance it with better image descriptions
  // For now, this is a placeholder for the enhanced system
  
  throw new Error('Enhanced script generation not yet implemented')
}
