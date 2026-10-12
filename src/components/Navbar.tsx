import React from 'react';
import { SocialAccount } from '../types';
import { COUNTRIES } from '../data/countries';
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
} from 'lucide-react';

interface NavbarProps {
  accounts: SocialAccount[];
  selectedCountry: string;
  onCountryChange: (countryCode: string) => void;
  onOpenConnectModal: () => void;
  onOpenHistoryDrawer: () => void;
  onOpenAiModal?: () => void;
  onOpenScheduleModal?: () => void;
  publishedCount: number;
  savedCount: number;
  activeView: 'feed' | 'saved' | 'reels' | 'studio';
  onViewChange: (view: 'feed' | 'saved' | 'reels' | 'studio') => void;
  agentEnabled?: boolean;
  nextRunCountdown?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts: _accounts,
  selectedCountry,
  onCountryChange,
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

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 min-h-14 py-1.5 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
          <button
            onClick={() => onViewChange('feed')}
            className="text-left font-bold tracking-tight text-white text-sm sm:text-base hover:text-slate-200 transition-colors cursor-pointer"
          >
            ViralNews <span className="text-rose-500 font-semibold">Wire</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links / Segmented View Switcher (Auto-scrollable on mobile) */}
        <nav
          className="flex items-center bg-slate-900/95 border border-slate-800/90 rounded-2xl p-0.5 sm:p-1 text-xs shadow-lg shadow-black/40 gap-0.5 sm:gap-1 backdrop-blur-md overflow-x-auto scrollbar-none order-3 md:order-2 w-full md:w-auto justify-center md:justify-start"
          aria-label="Main Navigation"
        >
          <button
            onClick={() => onViewChange('feed')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
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
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
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
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
              activeView === 'studio'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950/60 ring-1 ring-indigo-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Poster Studio</span>
          </button>

          <button
            onClick={() => onViewChange('saved')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap text-xs cursor-pointer ${
              activeView === 'saved'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-950/60 ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Saved</span>
            <span className="font-mono tabular-nums text-[11px] px-1 rounded bg-black/40 text-amber-200">
              {savedCount}
            </span>
          </button>
        </nav>

        {/* Zone 3: Actions (AI Agent, Country selector, Dispatches counter) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-2 md:order-3">
          {/* AI Agent Button ("ai button") */}
          {onOpenAiModal && (
            <button
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 rounded-lg text-xs font-bold text-white transition-all shadow-md shadow-rose-950/40 ring-1 ring-white/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="AI Newsroom: 15-Min Auto-Upload Reels, Dispatch History & Gemini Reasoning Model"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-200" />
              <span className="hidden sm:inline">🤖 AI Agent (15m Reels)</span>
              <span className="sm:hidden">🤖 AI Agent</span>
              {agentEnabled && (
                <span className="font-mono text-[10px] bg-black/40 text-emerald-300 px-1 py-0.2 rounded ml-0.5">
                  ⚡ {Math.floor((nextRunCountdown || 0) / 60)}:{((nextRunCountdown || 0) % 60).toString().padStart(2, '0')}
                </span>
              )}
            </button>
          )}

          {/* Multi-Day Scheduler Button ("Do Din Ka Schedule") */}
          {onOpenScheduleModal && (
            <button
              onClick={onOpenScheduleModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 rounded-lg text-xs font-bold text-white transition-all shadow-md shadow-orange-950/40 ring-1 ring-white/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Multi-Day Auto-Scheduler: Plan 2 Days of Reels with AI News, Advance Pre-Render & Cover Images"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">📅 2-Day Scheduler</span>
              <span className="sm:hidden">📅 Schedule</span>
            </button>
          )}

          {/* Country Selector with Flag */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-700 transition-colors">
            <span className="mr-1.5 text-sm" aria-hidden="true">{currentCountry.flag}</span>
            <select
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-hidden cursor-pointer pr-4 appearance-none"
              title="Select Country Wire"
              aria-label="Country Wire Selection"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Social Channels Config */}
          <button
            onClick={onOpenConnectModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 font-medium transition-colors"
            title="Configure Social Publishing Accounts"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Accounts</span>
          </button>

          {/* Published Dispatches Action */}
          <button
            onClick={onOpenHistoryDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs"
            title="View Published Dispatches History"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dispatches</span>
            <span className="font-mono tabular-nums text-[11px] bg-black/20 px-1.5 py-0.2 rounded">
              {publishedCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
