export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  hl: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', hl: 'hi', flag: '🇮🇳' },
  { code: 'en', name: 'English', nativeName: 'English', hl: 'en', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', hl: 'es', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', hl: 'fr', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', hl: 'de', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', hl: 'ar', flag: '🇸🇦' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', hl: 'bn', flag: '🇧🇩' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', hl: 'mr', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', hl: 'gu', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', hl: 'ta', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', hl: 'te', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', hl: 'ru', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', hl: 'ja', flag: '🇯🇵' },
];
