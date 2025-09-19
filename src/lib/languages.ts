// HeyGen supported languages and voice configuration
export interface Language {
  code: string
  name: string
  nativeName: string
  voiceId: string
  region?: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  // English variants
  { code: 'en-US', name: 'English (US)', nativeName: 'English (United States)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (United Kingdom)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'en-AU', name: 'English (AU)', nativeName: 'English (Australia)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Spanish variants
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // French variants
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'fr-BE', name: 'French (Belgium)', nativeName: 'Français (Belgique)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // German variants
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'de-AT', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'de-CH', name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Chinese variants
  { code: 'zh-CN', name: 'Chinese (Mandarin)', nativeName: '中文 (普通话)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'zh-HK', name: 'Chinese (Cantonese)', nativeName: '中文 (粵語)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Japanese
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Korean
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Portuguese variants
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Italian
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Russian
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Arabic variants
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية (السعودية)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'ar-AE', name: 'Arabic (UAE)', nativeName: 'العربية (الإمارات)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Hindi
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Dutch
  { code: 'nl-NL', name: 'Dutch (Netherlands)', nativeName: 'Nederlands (Nederland)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'nl-BE', name: 'Dutch (Belgium)', nativeName: 'Nederlands (België)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Swedish
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Norwegian
  { code: 'no-NO', name: 'Norwegian', nativeName: 'Norsk', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Danish
  { code: 'da-DK', name: 'Danish', nativeName: 'Dansk', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Finnish
  { code: 'fi-FI', name: 'Finnish', nativeName: 'Suomi', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Polish
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Czech
  { code: 'cs-CZ', name: 'Czech', nativeName: 'Čeština', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Hungarian
  { code: 'hu-HU', name: 'Hungarian', nativeName: 'Magyar', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Romanian
  { code: 'ro-RO', name: 'Romanian', nativeName: 'Română', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Bulgarian
  { code: 'bg-BG', name: 'Bulgarian', nativeName: 'Български', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Croatian
  { code: 'hr-HR', name: 'Croatian', nativeName: 'Hrvatski', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Serbian
  { code: 'sr-RS', name: 'Serbian', nativeName: 'Српски', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Greek
  { code: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Turkish
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Hebrew
  { code: 'he-IL', name: 'Hebrew', nativeName: 'עברית', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Thai
  { code: 'th-TH', name: 'Thai', nativeName: 'ไทย', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Vietnamese
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Indonesian
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Malay
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Filipino
  { code: 'fil-PH', name: 'Filipino', nativeName: 'Filipino', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Bengali
  { code: 'bn-BD', name: 'Bengali (Bangladesh)', nativeName: 'বাংলা (বাংলাদেশ)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'bn-IN', name: 'Bengali (India)', nativeName: 'বাংলা (ভারত)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Tamil
  { code: 'ta-IN', name: 'Tamil (India)', nativeName: 'தமிழ் (இந்தியா)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'ta-MY', name: 'Tamil (Malaysia)', nativeName: 'தமிழ் (மலேசியா)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'ta-SG', name: 'Tamil (Singapore)', nativeName: 'தமிழ் (சிங்கப்பூர்)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'ta-LK', name: 'Tamil (Sri Lanka)', nativeName: 'தமிழ் (இலங்கை)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Telugu
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Gujarati
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Marathi
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Kannada
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Malayalam
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Punjabi
  { code: 'pa-IN', name: 'Punjabi (India)', nativeName: 'ਪੰਜਾਬੀ (ਭਾਰਤ)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'pa-PK', name: 'Punjabi (Pakistan)', nativeName: 'پنجابی (پاکستان)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Urdu
  { code: 'ur-IN', name: 'Urdu (India)', nativeName: 'اردو (بھارت)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'ur-PK', name: 'Urdu (Pakistan)', nativeName: 'اردو (پاکستان)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Persian
  { code: 'fa-IR', name: 'Persian (Iran)', nativeName: 'فارسی (ایران)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Ukrainian
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Estonian
  { code: 'et-EE', name: 'Estonian', nativeName: 'Eesti', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Latvian
  { code: 'lv-LV', name: 'Latvian', nativeName: 'Latviešu', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Lithuanian
  { code: 'lt-LT', name: 'Lithuanian', nativeName: 'Lietuvių', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Slovenian
  { code: 'sl-SI', name: 'Slovenian', nativeName: 'Slovenščina', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Slovak
  { code: 'sk-SK', name: 'Slovak', nativeName: 'Slovenčina', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Macedonian
  { code: 'mk-MK', name: 'Macedonian', nativeName: 'Македонски', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Albanian
  { code: 'sq-AL', name: 'Albanian', nativeName: 'Shqip', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Bosnian
  { code: 'bs-BA', name: 'Bosnian', nativeName: 'Bosanski', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Icelandic
  { code: 'is-IS', name: 'Icelandic', nativeName: 'Íslenska', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Maltese
  { code: 'mt-MT', name: 'Maltese', nativeName: 'Malti', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Welsh
  { code: 'cy-GB', name: 'Welsh', nativeName: 'Cymraeg', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Irish
  { code: 'ga-IE', name: 'Irish', nativeName: 'Gaeilge', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Basque
  { code: 'eu-ES', name: 'Basque', nativeName: 'Euskera', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Catalan
  { code: 'ca-ES', name: 'Catalan', nativeName: 'Català', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Galician
  { code: 'gl-ES', name: 'Galician', nativeName: 'Galego', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Swahili
  { code: 'sw-KE', name: 'Swahili (Kenya)', nativeName: 'Kiswahili (Kenya)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  { code: 'sw-TZ', name: 'Swahili (Tanzania)', nativeName: 'Kiswahili (Tanzania)', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Zulu
  { code: 'zu-ZA', name: 'Zulu', nativeName: 'IsiZulu', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Afrikaans
  { code: 'af-ZA', name: 'Afrikaans', nativeName: 'Afrikaans', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Amharic
  { code: 'am-ET', name: 'Amharic', nativeName: 'አማርኛ', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Armenian
  { code: 'hy-AM', name: 'Armenian', nativeName: 'Հայերեն', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Azerbaijani
  { code: 'az-AZ', name: 'Azerbaijani', nativeName: 'Azərbaycan', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Georgian
  { code: 'ka-GE', name: 'Georgian', nativeName: 'ქართული', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Kazakh
  { code: 'kk-KZ', name: 'Kazakh', nativeName: 'Қазақша', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Kyrgyz
  { code: 'ky-KG', name: 'Kyrgyz', nativeName: 'Кыргызча', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Mongolian
  { code: 'mn-MN', name: 'Mongolian', nativeName: 'Монгол', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Uzbek
  { code: 'uz-UZ', name: 'Uzbek', nativeName: 'Oʻzbekcha', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Tajik
  { code: 'tg-TJ', name: 'Tajik', nativeName: 'Тоҷикӣ', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Turkmen
  { code: 'tk-TM', name: 'Turkmen', nativeName: 'Türkmençe', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Pashto
  { code: 'ps-AF', name: 'Pashto', nativeName: 'پښتو', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Sinhala
  { code: 'si-LK', name: 'Sinhala', nativeName: 'සිංහල', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Nepali
  { code: 'ne-NP', name: 'Nepali', nativeName: 'नेपाली', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Burmese
  { code: 'my-MM', name: 'Burmese', nativeName: 'မြန်မာ', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Khmer
  { code: 'km-KH', name: 'Khmer', nativeName: 'ខ្មែរ', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Lao
  { code: 'lo-LA', name: 'Lao', nativeName: 'ລາວ', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Javanese
  { code: 'jv-ID', name: 'Javanese', nativeName: 'Basa Jawa', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Sundanese
  { code: 'su-ID', name: 'Sundanese', nativeName: 'Basa Sunda', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
  
  // Somali
  { code: 'so-SO', name: 'Somali', nativeName: 'Soomaali', voiceId: '1bd001e7e50f421d891986aad5158bc3' },
]

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code)
}

export function getLanguageName(code: string): string {
  const language = getLanguageByCode(code)
  return language ? language.name : code
}

export function getLanguageNativeName(code: string): string {
  const language = getLanguageByCode(code)
  return language ? language.nativeName : code
}

export function getLanguageVoiceId(code: string): string {
  const language = getLanguageByCode(code)
  return language ? language.voiceId : '1bd001e7e50f421d891986aad5158bc3' // Default voice
}

// Popular languages for quick selection
export const POPULAR_LANGUAGES = [
  'en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ja-JP', 'ko-KR', 'pt-BR', 'it-IT', 'ru-RU',
  'ar-SA', 'hi-IN', 'nl-NL', 'sv-SE', 'no-NO', 'da-DK', 'fi-FI', 'pl-PL', 'tr-TR', 'th-TH'
]

// Language groups for organized selection
export const LANGUAGE_GROUPS = {
  'European': ['en-US', 'en-GB', 'en-AU', 'es-ES', 'es-MX', 'es-AR', 'fr-FR', 'fr-CA', 'fr-BE', 'de-DE', 'de-AT', 'de-CH', 'it-IT', 'pt-BR', 'pt-PT', 'nl-NL', 'nl-BE', 'sv-SE', 'no-NO', 'da-DK', 'fi-FI', 'pl-PL', 'cs-CZ', 'hu-HU', 'ro-RO', 'bg-BG', 'hr-HR', 'sr-RS', 'el-GR', 'tr-TR', 'ru-RU', 'uk-UA', 'et-EE', 'lv-LV', 'lt-LT', 'sl-SI', 'sk-SK', 'mk-MK', 'sq-AL', 'bs-BA', 'is-IS', 'mt-MT', 'cy-GB', 'ga-IE', 'eu-ES', 'ca-ES', 'gl-ES'],
  'Asian': ['zh-CN', 'zh-TW', 'zh-HK', 'ja-JP', 'ko-KR', 'hi-IN', 'bn-BD', 'bn-IN', 'ta-IN', 'ta-MY', 'ta-SG', 'ta-LK', 'te-IN', 'gu-IN', 'mr-IN', 'kn-IN', 'ml-IN', 'pa-IN', 'pa-PK', 'ur-IN', 'ur-PK', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY', 'fil-PH', 'my-MM', 'km-KH', 'lo-LA', 'jv-ID', 'su-ID'],
  'Middle Eastern & African': ['ar-SA', 'ar-EG', 'ar-AE', 'fa-IR', 'he-IL', 'ps-AF', 'sw-KE', 'sw-TZ', 'zu-ZA', 'af-ZA', 'am-ET', 'so-SO'],
  'Other': ['si-LK', 'ne-NP', 'tg-TJ', 'tk-TM', 'uz-UZ', 'ky-KG', 'mn-MN', 'kk-KZ', 'az-AZ', 'ka-GE', 'hy-AM']
}
