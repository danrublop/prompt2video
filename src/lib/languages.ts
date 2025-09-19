export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  voiceId?: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  // European Languages
  { code: 'en', name: 'English', nativeName: 'English', region: 'European', voiceId: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'European', voiceId: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'European', voiceId: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'European', voiceId: 'de-DE' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'European', voiceId: 'it-IT' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'European', voiceId: 'pt-PT' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'European', voiceId: 'ru-RU' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'European', voiceId: 'pl-PL' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'European', voiceId: 'nl-NL' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'European', voiceId: 'sv-SE' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'European', voiceId: 'no-NO' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', region: 'European', voiceId: 'da-DK' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'European', voiceId: 'fi-FI' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'European', voiceId: 'cs-CZ' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', region: 'European', voiceId: 'hu-HU' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', region: 'European', voiceId: 'ro-RO' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', region: 'European', voiceId: 'bg-BG' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'European', voiceId: 'hr-HR' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'European', voiceId: 'sk-SK' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', region: 'European', voiceId: 'sl-SI' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', region: 'European', voiceId: 'et-EE' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', region: 'European', voiceId: 'lv-LV' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'European', voiceId: 'lt-LT' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'European', voiceId: 'el-GR' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'European', voiceId: 'tr-TR' },

  // Asian Languages
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', region: 'Asian', voiceId: 'zh-CN' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', region: 'Asian', voiceId: 'zh-TW' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'Asian', voiceId: 'ja-JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'Asian', voiceId: 'ko-KR' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', region: 'Asian', voiceId: 'th-TH' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Asian', voiceId: 'vi-VN' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Asian', voiceId: 'id-ID' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Asian', voiceId: 'ms-MY' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', region: 'Asian', voiceId: 'tl-PH' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'Asian', voiceId: 'hi-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'Asian', voiceId: 'bn-BD' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Asian', voiceId: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Asian', voiceId: 'te-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Asian', voiceId: 'ml-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Asian', voiceId: 'kn-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Asian', voiceId: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Asian', voiceId: 'pa-IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'Asian', voiceId: 'or-IN' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', region: 'Asian', voiceId: 'as-IN' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'Asian', voiceId: 'ne-NP' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', region: 'Asian', voiceId: 'si-LK' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', region: 'Asian', voiceId: 'my-MM' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', region: 'Asian', voiceId: 'km-KH' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', region: 'Asian', voiceId: 'lo-LA' },

  // Middle Eastern & African Languages
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Middle Eastern', voiceId: 'ar-SA' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'Middle Eastern', voiceId: 'he-IL' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', region: 'Middle Eastern', voiceId: 'fa-IR' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'Middle Eastern', voiceId: 'ur-PK' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'African', voiceId: 'sw-KE' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', region: 'African', voiceId: 'am-ET' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', region: 'African', voiceId: 'ha-NG' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', region: 'African', voiceId: 'yo-NG' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', region: 'African', voiceId: 'ig-NG' },
  { code: 'zu', name: 'Zulu', nativeName: 'IsiZulu', region: 'African', voiceId: 'zu-ZA' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'African', voiceId: 'af-ZA' },
  { code: 'xh', name: 'Xhosa', nativeName: 'IsiXhosa', region: 'African', voiceId: 'xh-ZA' },

  // Americas
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'Americas', voiceId: 'pt-BR' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', region: 'Americas', voiceId: 'es-MX' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', region: 'Americas', voiceId: 'es-AR' },
  { code: 'es-CO', name: 'Spanish (Colombia)', nativeName: 'Español (Colombia)', region: 'Americas', voiceId: 'es-CO' },
  { code: 'es-PE', name: 'Spanish (Peru)', nativeName: 'Español (Perú)', region: 'Americas', voiceId: 'es-PE' },
  { code: 'es-CL', name: 'Spanish (Chile)', nativeName: 'Español (Chile)', region: 'Americas', voiceId: 'es-CL' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (Canada)', region: 'Americas', voiceId: 'en-CA' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', region: 'Americas', voiceId: 'fr-CA' },

  // Other Languages
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'European', voiceId: 'uk-UA' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', region: 'European', voiceId: 'be-BY' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', region: 'European', voiceId: 'ka-GE' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', region: 'European', voiceId: 'hy-AM' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', region: 'European', voiceId: 'az-AZ' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ', region: 'European', voiceId: 'kk-KZ' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', region: 'European', voiceId: 'ky-KG' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', region: 'European', voiceId: 'uz-UZ' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', region: 'Asian', voiceId: 'mn-MN' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་ཡིག', region: 'Asian', voiceId: 'bo-CN' },
];

export const LANGUAGE_REGIONS = [
  'European',
  'Asian', 
  'Middle Eastern',
  'African',
  'Americas'
];

export function getLanguagesByRegion(region: string): Language[] {
  return SUPPORTED_LANGUAGES.filter(lang => lang.region === region);
}

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getPopularLanguages(): Language[] {
  return SUPPORTED_LANGUAGES.filter(lang => 
    ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'].includes(lang.code)
  );
}
