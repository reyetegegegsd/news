import React from 'react';
import { SocialAccount } from '../types';
import { COUNTRIES } from '../data/countries';
import { LANGUAGES } from '../data/languages';
import {
  Settings,
  BarChart2,
  Film,
  Newspaper,
  Bookmark,
  Palette,
  ChevronDown,
  Sparkles,
  Calendar,
  Globe2,
} from 'lucide-react';

interface NavbarProps {
  accounts: SocialAccount[];
  selectedCountry: string;
  onCountryChange: (countryCode: string) => void;
  selectedLanguage: string;
  onLanguageChange: (langName: string) => void;
  onOpenConnectModal: () => void;
  onOpenHistoryDrawer: () => void;
  onOpenAiModal?: () => void;
  onOpenScheduleModal?: () => void;
  publishedCount: number;
  savedCount: number;
  activeView: 'feed' | 'saved' | 'reels' | 'studio' | 'autopilot';
  onViewChange: (view: 'feed' | 'saved' | 'reels' | 'studio' | 'autopilot') => void;
  agentEnabled?: boolean;
  nextRunCountdown?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts: _accounts,
  selectedCountry,
  onCountryChange,
  selectedLanguage,
  onLanguageChange,
  onOpenConnectModal,
  onOpenHistoryDrawer,
  onOpenAiModal,
  onOpenScheduleModal,
  publishedCount,
  savedCount,
  activeView,
  onViewChange,
  agentEnabled = false,
  nextRunCountdown = 900,
}) => {
  const currentCountry = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];
  const currentLang = LANGUAGES.find((l) => l.name.toLowerCase() === selectedLanguage.toLowerCase()) || LANGUAGES[0];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      {/* Primary Top Bar: Brand, Language, Country & Quick Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Wordmark & Status Indicator */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onViewChange('feed')}
            className="flex items-center gap-2 text-left group cursor-pointer focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 p-0.5 shadow-md shadow-rose-950/50 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg block leading-none">
                ViralNews <span className="text-rose-500 font-black">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase block mt-0.5">
                Auto Studio &amp; Wire
              </span>
            </div>
          </button>
        </div>

        {/* Global Controls: Language, Country, AI Agent & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
          {/* Multilingual Selector */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 transition-colors shadow-xs">
            <Globe2 className="w-3.5 h-3.5 text-rose-400 mr-1.5 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-hidden cursor-pointer pr-4 appearance-none"
              title="Select News Language"
              aria-label="Select News Language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name} className="bg-slate-900 text-white py-1">
                  {lang.flag} {lang.name} ({lang.localName})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Country Selector */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 transition-colors shadow-xs">
            <span className="mr-1.5 text-sm" aria-hidden="true">{currentCountry.flag}</span>
            <select
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-hidden cursor-pointer pr-4 appearance-none"
              title="Select Country Wire"
              aria-label="Country Wire Selection"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white py-1">
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* AI Agent Modal Button */}
          {onOpenAiModal && (
            <button
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-rose-950/40 ring-1 ring-white/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="AI Newsroom: 15-Min Auto-Upload Reels, Dispatch History & Gemini Reasoning Model"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-200" />
              <span className="hidden sm:inline">AI Agent</span>
              {agentEnabled && (
                <span className="font-mono text-[10px] bg-black/40 text-emerald-300 px-1 py-0.2 rounded ml-0.5">
                  ⚡ {Math.floor((nextRunCountdown || 0) / 60)}:{((nextRunCountdown || 0) % 60).toString().padStart(2, '0')}
                </span>
              )}
            </button>
          )}

          {/* 2-Day Scheduler Button */}
          {onOpenScheduleModal && (
            <button
              onClick={onOpenScheduleModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-orange-950/40 ring-1 ring-white/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Multi-Day Auto-Scheduler: Plan 2 Days of Reels with AI News, Advance Pre-Render & Cover Images"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-200" />
              <span>2-Day Schedule</span>
            </button>
          )}

          {/* Social Accounts Button */}
          <button
            onClick={onOpenConnectModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 font-medium transition-colors cursor-pointer"
            title="Configure Social Publishing Accounts"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Accounts</span>
          </button>

          {/* Dispatches History Button */}
          <button
            onClick={onOpenHistoryDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 rounded-xl text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
            title="View Published Dispatches History"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dispatches</span>
            <span className="font-mono tabular-nums text-[11px] bg-black/30 px-1.5 py-0.2 rounded font-black">
              {publishedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Secondary Bar: Responsive Navigation Tabs (Smooth Scrolling on Mobile & Tablet) */}
      <div className="border-t border-slate-900/80 bg-slate-950/60 px-3 sm:px-6 lg:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <nav
            className="flex items-center bg-slate-900/95 border border-slate-800/90 rounded-2xl p-1 text-xs shadow-md shadow-black/30 gap-1 w-full sm:w-auto"
            aria-label="Main Navigation"
          >
            <button
              onClick={() => onViewChange('feed')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
                activeView === 'feed'
                  ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md ring-1 ring-slate-600'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Live Wire</span>
            </button>

            <button
              onClick={() => onViewChange('reels')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
                activeView === 'reels'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Reels Studio</span>
            </button>

            <button
              onClick={() => onViewChange('studio')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
                activeView === 'studio'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950/60 ring-1 ring-indigo-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Poster Studio</span>
            </button>

            <button
              onClick={() => onViewChange('autopilot')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
                activeView === 'autopilot'
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-md shadow-purple-950/60 ring-1 ring-purple-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>AI Auto-Pilot</span>
            </button>

            <button
              onClick={() => onViewChange('saved')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
                activeView === 'saved'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-950/60 ring-1 ring-amber-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Saved</span>
              <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.2 rounded-md bg-black/40 text-amber-200">
                {savedCount}
              </span>
            </button>
          </nav>

          {/* Quick Language Indicator Tag */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300 font-semibold">
              {currentLang.localName} Wire • {currentCountry.name}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
