export interface CountryItem {
  code: string;
  name: string;
  flag: string;
  hl: string;
  gl: string;
  ceid: string;
}

export const COUNTRIES: CountryItem[] = [
  { code: 'GLOBAL', name: 'Worldwide / All Countries', flag: '🌐', hl: 'en-US', gl: 'US', ceid: 'US:en' },
  { code: 'IN', name: 'India', flag: '🇮🇳', hl: 'en-IN', gl: 'IN', ceid: 'IN:en' },
  { code: 'US', name: 'United States', flag: '🇺🇸', hl: 'en-US', gl: 'US', ceid: 'US:en' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', hl: 'en-GB', gl: 'GB', ceid: 'GB:en' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', hl: 'en-CA', gl: 'CA', ceid: 'CA:en' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', hl: 'en-AU', gl: 'AU', ceid: 'AU:en' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', hl: 'de', gl: 'DE', ceid: 'DE:de' },
  { code: 'FR', name: 'France', flag: '🇫🇷', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', hl: 'ja', gl: 'JP', ceid: 'JP:ja' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', hl: 'pt-BR', gl: 'BR', ceid: 'BR:pt-419' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', hl: 'it', gl: 'IT', ceid: 'IT:it' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', hl: 'es', gl: 'ES', ceid: 'ES:es' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', hl: 'es-419', gl: 'MX', ceid: 'MX:es-419' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', hl: 'nl', gl: 'NL', ceid: 'NL:nl' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', hl: 'en-SG', gl: 'SG', ceid: 'SG:en' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', hl: 'ar', gl: 'AE', ceid: 'AE:ar' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', hl: 'en-ZA', gl: 'ZA', ceid: 'ZA:en' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', hl: 'en-NG', gl: 'NG', ceid: 'NG:en' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', hl: 'ar', gl: 'SA', ceid: 'SA:ar' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', hl: 'en-NZ', gl: 'NZ', ceid: 'NZ:en' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', hl: 'en-IE', gl: 'IE', ceid: 'IE:en' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', hl: 'en-PK', gl: 'PK', ceid: 'PK:en' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', hl: 'bn', gl: 'BD', ceid: 'BD:bn' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', hl: 'id', gl: 'ID', ceid: 'ID:id' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', hl: 'en-PH', gl: 'PH', ceid: 'PH:en' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', hl: 'en-MY', gl: 'MY', ceid: 'MY:en' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', hl: 'es-419', gl: 'AR', ceid: 'AR:es-419' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', hl: 'de-CH', gl: 'CH', ceid: 'CH:de' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', hl: 'sv', gl: 'SE', ceid: 'SE:sv' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', hl: 'no', gl: 'NO', ceid: 'NO:no' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', hl: 'pl', gl: 'PL', ceid: 'PL:pl' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', hl: 'tr', gl: 'TR', ceid: 'TR:tr' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', hl: 'ko', gl: 'KR', ceid: 'KR:ko' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', hl: 'ar', gl: 'EG', ceid: 'EG:ar' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', hl: 'he', gl: 'IL', ceid: 'IL:he' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', hl: 'vi', gl: 'VN', ceid: 'VN:vi' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', hl: 'th', gl: 'TH', ceid: 'TH:th' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', hl: 'en-KE', gl: 'KE', ceid: 'KE:en' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', hl: 'nl-BE', gl: 'BE', ceid: 'BE:nl' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', hl: 'de-AT', gl: 'AT', ceid: 'AT:de' },
];
