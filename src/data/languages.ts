export interface LanguageOption {
  code: string;
  name: string;
  localName: string;
  flag: string;
  speechCode: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', localName: 'हिंदी', flag: '🇮🇳', speechCode: 'hi-IN' },
  { code: 'en', name: 'English', localName: 'English', flag: '🇬🇧', speechCode: 'en-US' },
  { code: 'ur', name: 'Urdu', localName: 'اردو', flag: '🇵🇰', speechCode: 'ur-PK' },
  { code: 'mr', name: 'Marathi', localName: 'मराठी', flag: '🇮🇳', speechCode: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', localName: 'ગુજરાતી', flag: '🇮🇳', speechCode: 'gu-IN' },
  { code: 'bn', name: 'Bengali', localName: 'বাংলা', flag: '🇮🇳', speechCode: 'bn-IN' },
  { code: 'ta', name: 'Tamil', localName: 'தமிழ்', flag: '🇮🇳', speechCode: 'ta-IN' },
  { code: 'te', name: 'Telugu', localName: 'తెలుగు', flag: '🇮🇳', speechCode: 'te-IN' },
  { code: 'pa', name: 'Punjabi', localName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', speechCode: 'pa-IN' },
  { code: 'es', name: 'Spanish', localName: 'Español', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', localName: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'de', name: 'German', localName: 'Deutsch', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'ar', name: 'Arabic', localName: 'العربية', flag: '🇸🇦', speechCode: 'ar-SA' },
];
