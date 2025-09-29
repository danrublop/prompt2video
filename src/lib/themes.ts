// Theme configuration for consistent image generation
export interface ImageTheme {
  id: string
  name: string
  description: string
  basePrompt: string
  styleElements: string[]
  colorScheme: string
  composition: string
  textStyle: string
  consistencyKeywords: string[]
}

export const THEMES: { [key: string]: ImageTheme } = {
  whiteboard: {
    id: 'whiteboard',
    name: 'Whiteboard Drawing',
    description: 'Simple hand-drawn illustrations on blank white page with content-specific headers',
    basePrompt: 'Simple sketch illustration on clean white paper',
    styleElements: [
      'sketch style illustration',
      'black ink on white paper',
      'simple geometric shapes',
      'clean line work',
      'direct top-down perspective',
      'flat 2D appearance',
      'completed artwork',
      'educational illustration',
      'minimal detail',
      'abundant white space'
    ],
    colorScheme: 'Black pen on white paper only',
    composition: 'Content-specific header at top, simple drawing in center',
    textStyle: 'Header text only, spelled correctly based on script',
    consistencyKeywords: [
      'sketch illustration',
      'black ink illustration',
      'white paper background',
      'simple geometric shapes',
      'clean line work',
      'top-down perspective',
      'flat appearance',
      'completed artwork',
      'educational style',
      'minimal detail'
    ]
  },
  modern_infographic: {
    id: 'modern_infographic',
    name: 'Modern Infographic',
    description: 'Clean, modern infographic style with professional design',
    basePrompt: 'Professional modern infographic design',
    styleElements: [
      'clean geometric shapes',
      'modern typography',
      'professional color palette',
      'minimalist design',
      'data visualization elements',
      'icon-based design',
      'corporate style'
    ],
    colorScheme: 'Professional blue and white color scheme with accent colors',
    composition: 'Grid-based layout with clear information hierarchy',
    textStyle: 'Modern sans-serif fonts, clean and professional',
    consistencyKeywords: [
      'modern',
      'infographic',
      'professional',
      'clean',
      'geometric',
      'corporate',
      'minimalist'
    ]
  },
  sketchy_notes: {
    id: 'sketchy_notes',
    name: 'Sketchy Notes',
    description: 'Hand-drawn notebook style with sketchy illustrations',
    basePrompt: 'Hand-drawn sketchy notebook style illustration',
    styleElements: [
      'sketchy hand-drawn style',
      'notebook paper background',
      'pencil and pen illustrations',
      'doodle-style elements',
      'informal handwritten text',
      'rough sketch aesthetic',
      'personal note-taking style'
    ],
    colorScheme: 'Black ink on light paper, subtle paper texture',
    composition: 'Organic, flowing layout with natural text placement',
    textStyle: 'Handwritten, informal, personal note style',
    consistencyKeywords: [
      'sketchy',
      'hand-drawn',
      'notebook',
      'doodle',
      'informal',
      'personal',
      'rough'
    ]
  },
  corporate_presentation: {
    id: 'corporate_presentation',
    name: 'Corporate Presentation',
    description: 'Professional business presentation style with charts and graphs',
    basePrompt: 'Professional corporate presentation slide design',
    styleElements: [
      'clean business layout',
      'professional charts and graphs',
      'corporate color scheme',
      'formal typography',
      'data visualization',
      'executive presentation style',
      'high-contrast design'
    ],
    colorScheme: 'Corporate blue, white, and gray with accent colors',
    composition: 'Grid-based professional layout with clear data hierarchy',
    textStyle: 'Professional sans-serif fonts, formal and business-like',
    consistencyKeywords: [
      'corporate',
      'professional',
      'business',
      'formal',
      'charts',
      'presentation',
      'executive'
    ]
  },
  educational_illustration: {
    id: 'educational_illustration',
    name: 'Educational Illustration',
    description: 'Colorful educational illustrations perfect for learning content',
    basePrompt: 'Colorful educational illustration design',
    styleElements: [
      'bright educational colors',
      'friendly illustrations',
      'learning-focused design',
      'clear visual hierarchy',
      'engaging graphics',
      'child-friendly style',
      'educational content focus'
    ],
    colorScheme: 'Bright, educational colors with high contrast',
    composition: 'Clear educational layout with engaging visuals',
    textStyle: 'Friendly, readable fonts perfect for learning',
    consistencyKeywords: [
      'educational',
      'colorful',
      'friendly',
      'learning',
      'bright',
      'engaging',
      'child-friendly'
    ]
  }
}

export function getTheme(themeId: string): ImageTheme {
  return THEMES[themeId] || THEMES.whiteboard
}

export function extractHeaderFromNarration(narration: string): string {
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

export function generateContentSpecificPrompt(
  narration: string,
  sceneDescription: string,
  theme: ImageTheme,
  sceneIndex: number,
  totalScenes: number
): string {
  const header = extractHeaderFromNarration(narration)
  
  // Create a very specific prompt that forces the simple, childlike style like Scene 3
  return `A very simple hand-drawn sketch on white paper with black pen, like a child drew it. Header text at the top: "${header}". One simple drawing in the center of the page. Lots of white space around the drawing. No other text anywhere. No colors. No details. Very basic shapes. Top-down view of white paper. Minimal and clean. Avoid complex illustrations, professional diagrams, or detailed artwork.`
}

export function generateThemedImagePrompt(
  sceneDescription: string, 
  theme: ImageTheme,
  sceneIndex: number,
  totalScenes: number
): string {
  // Create a consistent prompt that ensures all images in the same video look cohesive
  const consistencyElements = theme.consistencyKeywords.join(', ')
  const styleElements = theme.styleElements.join(', ')
  
  return `${theme.basePrompt}, ${styleElements}, ${theme.colorScheme}, ${theme.composition}, ${theme.textStyle}. ${sceneDescription}. Consistent with ${consistencyElements} style. Scene ${sceneIndex + 1} of ${totalScenes}, maintaining visual consistency throughout the series. High quality, educational content, appropriate for all audiences.`
}

export function getAvailableThemes(): ImageTheme[] {
  return Object.values(THEMES)
}
