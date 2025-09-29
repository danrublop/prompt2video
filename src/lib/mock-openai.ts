import { ScriptResponse, ScriptScene } from '@/types'

// Mock implementation for testing without OpenAI API keys

function generateThemeAwareDescription(concept: string, themeId: string, sceneType: string): string {
  switch (themeId) {
    case 'whiteboard':
      return `Simple sketch illustration on clean white paper. Completed artwork already on the page with direct top-down perspective and flat 2D appearance. Content-specific header at the top showing "${concept}" - spelled correctly and based on the script. One central simple drawing showing the key concept. Abundant white space around the drawing for clean appearance. Black ink only, basic geometric shapes, minimal detail, educational sketch style.`
    
    case 'modern_infographic':
      return `Professional modern infographic design with clean geometric shapes and modern typography. Main visual element showing "${concept}". Professional blue and white color scheme with accent colors. Grid-based layout with clear information hierarchy. Icon-based design with data visualization elements. High contrast, clean, professional presentation.`
    
    case 'sketchy_notes':
      return `Hand-drawn sketchy notebook style illustration on notebook paper background. Main concept: "${concept}". Pencil and pen illustrations with doodle-style elements. Informal handwritten text style with personal note-taking aesthetic. Black ink on light paper with subtle paper texture. Organic, flowing layout with natural text placement.`
    
    case 'corporate_presentation':
      return `Professional corporate presentation slide design with clean business layout. Main topic: "${concept}". Professional charts and graphs with corporate color scheme. Grid-based professional layout with clear data hierarchy. Corporate blue, white, and gray with accent colors. Formal typography with high-contrast design. Executive presentation style.`
    
    case 'educational_illustration':
      return `Colorful educational illustration design with bright educational colors. Main concept: "${concept}". Friendly illustrations with learning-focused design. Clear visual hierarchy with engaging graphics. Bright, educational colors with high contrast. Child-friendly style with educational content focus. Engaging, colorful, and learning-oriented design.`
    
    default:
      return `Professional ${themeId} style diagram showing ${concept} with clean, modern design and educational content appropriate for ${sceneType} scenes.`
  }
}
export async function generateScript(
  prompt: string,
  targetDuration: number,
  language: string = 'English',
  imageTheme: string = 'whiteboard'
): Promise<ScriptResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Generate language-specific content
  const getLanguageContent = (lang: string) => {
    // Get language code for prefix - Comprehensive list of 100+ languages
    const getLanguageCode = (languageName: string) => {
      const codeMap: { [key: string]: string } = {
        // Major Languages
        'English': 'EN', 'Spanish': 'ES', 'French': 'FR', 'German': 'DE', 'Italian': 'IT',
        'Portuguese': 'PT', 'Russian': 'RU', 'Chinese': 'ZH', 'Japanese': 'JA', 'Korean': 'KO',
        'Arabic': 'AR', 'Hindi': 'HI', 'Bengali': 'BN', 'Punjabi': 'PA', 'Urdu': 'UR',
        
        // European Languages
        'Dutch': 'NL', 'Swedish': 'SV', 'Norwegian': 'NO', 'Danish': 'DA', 'Finnish': 'FI',
        'Polish': 'PL', 'Czech': 'CS', 'Hungarian': 'HU', 'Romanian': 'RO', 'Bulgarian': 'BG',
        'Croatian': 'HR', 'Slovak': 'SK', 'Slovenian': 'SL', 'Estonian': 'ET', 'Latvian': 'LV',
        'Lithuanian': 'LT', 'Greek': 'EL', 'Turkish': 'TR', 'Icelandic': 'IS', 'Irish': 'GA',
        'Welsh': 'CY', 'Basque': 'EU', 'Catalan': 'CA', 'Galician': 'GL', 'Maltese': 'MT',
        'Albanian': 'SQ', 'Macedonian': 'MK', 'Serbian': 'SR', 'Bosnian': 'BS', 'Montenegrin': 'ME',
        'Belarusian': 'BE', 'Ukrainian': 'UK', 'Moldovan': 'MO', 'Georgian': 'KA', 'Armenian': 'HY',
        'Azerbaijani': 'AZ', 'Kazakh': 'KK', 'Kyrgyz': 'KY', 'Tajik': 'TG', 'Turkmen': 'TK',
        'Uzbek': 'UZ', 'Mongolian': 'MN', 'Tibetan': 'BO', 'Nepali': 'NE', 'Sinhala': 'SI',
        
        // Asian Languages
        'Thai': 'TH', 'Vietnamese': 'VI', 'Indonesian': 'ID', 'Malay': 'MS', 'Filipino': 'TL',
        'Tagalog': 'TL', 'Cebuano': 'CEB', 'Ilocano': 'ILO', 'Hiligaynon': 'HIL', 'Waray': 'WAR',
        'Burmese': 'MY', 'Khmer': 'KM', 'Lao': 'LO', 'Javanese': 'JV', 'Sundanese': 'SU',
        'Madurese': 'MAD', 'Minangkabau': 'MIN', 'Buginese': 'BUG', 'Balinese': 'BAN',
        'Tamil': 'TA', 'Telugu': 'TE', 'Kannada': 'KN', 'Malayalam': 'ML', 'Gujarati': 'GU',
        'Marathi': 'MR', 'Odia': 'OR', 'Assamese': 'AS', 'Nepali': 'NE', 'Sinhala': 'SI',
        'Dhivehi': 'DV', 'Tibetan': 'BO', 'Mongolian': 'MN', 'Kazakh': 'KK', 'Uyghur': 'UG',
        
        // Middle Eastern & African Languages
        'Persian': 'FA', 'Pashto': 'PS', 'Dari': 'PRS', 'Kurdish': 'KU', 'Hebrew': 'HE',
        'Amharic': 'AM', 'Tigrinya': 'TI', 'Oromo': 'OM', 'Hausa': 'HA', 'Yoruba': 'YO',
        'Igbo': 'IG', 'Swahili': 'SW', 'Zulu': 'ZU', 'Xhosa': 'XH', 'Afrikaans': 'AF',
        'Somali': 'SO', 'Berber': 'BER', 'Fulani': 'FF', 'Wolof': 'WO', 'Akan': 'AK',
        
        // South American Languages
        'Quechua': 'QU', 'Guarani': 'GN', 'Aymara': 'AY', 'Mapudungun': 'ARN',
        
        // Other Languages
        'Esperanto': 'EO', 'Latin': 'LA', 'Sanskrit': 'SA', 'Yiddish': 'YI', 'Ladino': 'LAD',
        'Romani': 'ROM', 'Cherokee': 'CHR', 'Navajo': 'NV', 'Hawaiian': 'HAW', 'Maori': 'MI',
        'Samoan': 'SM', 'Tongan': 'TO', 'Fijian': 'FJ', 'Tahitian': 'TY', 'Marquesan': 'MRQ',
        'Rapa Nui': 'RAP', 'Chamorro': 'CH', 'Palauan': 'PAU', 'Marshallese': 'MH',
        'Gilbertese': 'GIL', 'Nauruan': 'NA', 'Tuvaluan': 'TVL', 'Tokelauan': 'TKL',
        'Niuean': 'NIU', 'Cook Islands Maori': 'RAR', 'Tahitian': 'TY', 'Marquesan': 'MRQ'
      }
      return codeMap[languageName] || languageName.substring(0, 2).toUpperCase()
    }

    const languageCode = getLanguageCode(lang)
    
    // Full translations for major languages
    const fullTranslations: { [key: string]: { [key: string]: string } } = {
      'English': {
        welcome: `Welcome to this explanation about ${prompt.toLowerCase()}. Today we'll explore the key concepts and benefits.`,
        principles: `The fundamental principles of ${prompt.toLowerCase()} are based on proven methodologies and best practices.`,
        applications: `In practice, ${prompt.toLowerCase()} can be applied in various scenarios to achieve remarkable results.`,
        benefits: `The benefits of implementing ${prompt.toLowerCase()} include improved efficiency, better outcomes, and enhanced user experience.`,
        title: `Understanding ${prompt}`,
        intro: "Introduction",
        core: "Core Principles", 
        apps: "Applications",
        benefits_label: "Key Benefits"
      },
      'Spanish': {
        welcome: `Bienvenidos a esta explicación sobre ${prompt.toLowerCase()}. Hoy exploraremos los conceptos clave y beneficios.`,
        principles: `Los principios fundamentales de ${prompt.toLowerCase()} se basan en metodologías probadas y mejores prácticas.`,
        applications: `En la práctica, ${prompt.toLowerCase()} puede aplicarse en varios escenarios para lograr resultados notables.`,
        benefits: `Los beneficios de implementar ${prompt.toLowerCase()} incluyen mayor eficiencia, mejores resultados y experiencia de usuario mejorada.`,
        title: `Entendiendo ${prompt}`,
        intro: "Introducción",
        core: "Principios Fundamentales",
        apps: "Aplicaciones", 
        benefits_label: "Beneficios Clave"
      },
      'French': {
        welcome: `Bienvenue à cette explication sur ${prompt.toLowerCase()}. Aujourd'hui, nous explorerons les concepts clés et les avantages.`,
        principles: `Les principes fondamentaux de ${prompt.toLowerCase()} sont basés sur des méthodologies éprouvées et les meilleures pratiques.`,
        applications: `En pratique, ${prompt.toLowerCase()} peut être appliqué dans divers scénarios pour obtenir des résultats remarquables.`,
        benefits: `Les avantages de l'implémentation de ${prompt.toLowerCase()} incluent une efficacité améliorée, de meilleurs résultats et une expérience utilisateur améliorée.`,
        title: `Comprendre ${prompt}`,
        intro: "Introduction",
        core: "Principes Fondamentaux",
        apps: "Applications",
        benefits_label: "Avantages Clés"
      }
    }
    
    // If we have a full translation, use it
    if (fullTranslations[lang]) {
      return fullTranslations[lang]
    }
    
    // Otherwise, use English content with language prefix
    const englishContent = fullTranslations['English']
    return {
      welcome: `${languageCode}: ${englishContent.welcome}`,
      principles: `${languageCode}: ${englishContent.principles}`,
      applications: `${languageCode}: ${englishContent.applications}`,
      benefits: `${languageCode}: ${englishContent.benefits}`,
      title: `${languageCode}: ${englishContent.title}`,
      intro: `${languageCode}: ${englishContent.intro}`,
      core: `${languageCode}: ${englishContent.core}`,
      apps: `${languageCode}: ${englishContent.apps}`,
      benefits_label: `${languageCode}: ${englishContent.benefits_label}`
    }
  }
  
  const content = getLanguageContent(language)
  
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

  // Generate mock script based on prompt with proper timing and safe image descriptions
  const sceneTemplates = [
    {
      goal: "Introduce the main concept",
      narration: content.welcome,
      caption: content.intro,
      imageDescription: generateThemeAwareDescription('main concept', imageTheme, 'introduction'),
      durationVariation: 0
    },
    {
      goal: "Explain the core principles",
      narration: content.principles,
      caption: content.core,
      imageDescription: generateThemeAwareDescription('key principles', imageTheme, 'explanation'),
      durationVariation: 2
    },
    {
      goal: "Show practical applications",
      narration: content.applications,
      caption: content.apps,
      imageDescription: generateThemeAwareDescription('practical applications', imageTheme, 'examples'),
      durationVariation: 1
    },
    {
      goal: "Highlight key benefits",
      narration: content.benefits,
      caption: content.benefits_label,
      imageDescription: generateThemeAwareDescription('key benefits', imageTheme, 'benefits'),
      durationVariation: -1
    },
    {
      goal: "Provide examples and case studies",
      narration: content.applications,
      caption: content.apps,
      imageDescription: `Professional case study infographic with real-world examples and clean design`,
      durationVariation: 1
    },
    {
      goal: "Summarize and conclude",
      narration: content.benefits,
      caption: content.benefits_label,
      imageDescription: `Summary infographic highlighting key takeaways with professional design and educational content`,
      durationVariation: -2
    },
    {
      goal: "Explore advanced concepts",
      narration: content.principles,
      caption: content.core,
      imageDescription: `Advanced educational diagram with detailed explanations and professional design`,
      durationVariation: 0
    },
    {
      goal: "Address common questions",
      narration: content.welcome,
      caption: content.intro,
      imageDescription: `FAQ-style infographic with clear answers and professional presentation`,
      durationVariation: 1
    },
    {
      goal: "Show real-world impact",
      narration: content.benefits,
      caption: content.benefits_label,
      imageDescription: `Impact visualization with statistics and professional design elements`,
      durationVariation: -1
    },
    {
      goal: "Provide next steps",
      narration: content.applications,
      caption: content.apps,
      imageDescription: generateThemeAwareDescription('next steps', imageTheme, 'action'),
      durationVariation: 0
    },
    {
      goal: "Share expert insights",
      narration: content.principles,
      caption: content.core,
      imageDescription: generateThemeAwareDescription('expert insights', imageTheme, 'insights'),
      durationVariation: 2
    },
    {
      goal: "Wrap up with key points",
      narration: content.benefits,
      caption: content.benefits_label,
      imageDescription: generateThemeAwareDescription('key takeaways', imageTheme, 'summary'),
      durationVariation: -1
    }
  ]

  // Generate scenes dynamically based on calculated number
  const scenes: ScriptScene[] = []
  for (let i = 0; i < numScenes; i++) {
    const template = sceneTemplates[i % sceneTemplates.length]
    const duration = Math.max(minSceneDuration, Math.min(maxSceneDuration, avgSceneDuration + template.durationVariation))
    
    scenes.push({
      sceneId: `scene_${i + 1}`,
      goal: template.goal,
      narration: template.narration,
      caption: template.caption,
      imageDescription: template.imageDescription,
      duration
    })
  }

  return {
    title: content.title,
    totalDuration: targetDuration,
    scenes
  }
}

export async function generateImage(
  description: string,
  styleProfile: string = "Modern medical infographic style"
): Promise<Buffer> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Create a simple mock image (1x1 pixel PNG)
  const mockImageData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  )
  
  return mockImageData
}

export async function generateVideo(
  description: string,
  styleProfile: string = "Modern medical infographic style",
  duration: number = 5
): Promise<Buffer> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // For demo purposes, return the same mock image as video
  return generateImage(description, styleProfile)
}

export function calculateTokenCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gpt-4'
): number {
  // Return mock cost for demo
  return 0.05
}
