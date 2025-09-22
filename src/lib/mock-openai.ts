import { ScriptResponse, ScriptScene } from '@/types'

// Mock implementation for testing without OpenAI API keys
export async function generateScript(
  prompt: string,
  targetDuration: number,
  language: string = 'English'
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
  
  // Generate mock script based on prompt
  const scenes: ScriptScene[] = [
    {
      sceneId: "scene_1",
      goal: "Introduce the main concept",
      narration: content.welcome,
      caption: content.intro,
      imageDescription: `A professional infographic showing ${prompt} concept with clean, modern design`,
      duration: Math.min(20, targetDuration / 4)
    },
    {
      sceneId: "scene_2", 
      goal: "Explain the core principles",
      narration: content.principles,
      caption: content.core,
      imageDescription: `A diagram illustrating the main principles of ${prompt} with clear visual hierarchy`,
      duration: Math.min(25, targetDuration / 4)
    },
    {
      sceneId: "scene_3",
      goal: "Show practical applications",
      narration: content.applications,
      caption: content.apps,
      imageDescription: `A showcase of real-world applications of ${prompt} with examples and case studies`,
      duration: Math.min(30, targetDuration / 4)
    },
    {
      sceneId: "scene_4",
      goal: "Highlight key benefits",
      narration: content.benefits,
      caption: content.benefits_label,
      imageDescription: `A benefits diagram showing the advantages of ${prompt} with icons and statistics`,
      duration: Math.min(25, targetDuration / 4)
    }
  ]

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
