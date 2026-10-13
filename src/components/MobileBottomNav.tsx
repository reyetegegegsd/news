import React from 'react';
import {
  Newspaper,
  Film,
  Palette,
  Sparkles,
  Bookmark,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeView: 'feed' | 'saved' | 'reels' | 'studio' | 'autopilot';
  onViewChange: (view: 'feed' | 'saved' | 'reels' | 'studio' | 'autopilot') => void;
  savedCount: number;
  agentEnabled?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onViewChange,
  savedCount,
  agentEnabled,
}) => {
  const tabs = [
    {
      id: 'feed' as const,
      label: 'News',
      localLabel: 'ख़बरें',
      icon: Newspaper,
      accent: 'rose',
    },
    {
      id: 'reels' as const,
      label: 'Reels',
      localLabel: 'रील वीडियो',
      icon: Film,
      accent: 'rose',
    },
    {
      id: 'studio' as const,
      label: 'Posters',
      localLabel: 'पोस्टर',
      icon: Palette,
      accent: 'indigo',
    },
    {
      id: 'autopilot' as const,
      label: 'AutoPilot',
      localLabel: 'ऑटोपायलट',
      icon: Sparkles,
      accent: 'purple',
      hasDot: agentEnabled,
    },
    {
      id: 'saved' as const,
      label: 'Saved',
      localLabel: 'सेव',
      icon: Bookmark,
      accent: 'amber',
      badge: savedCount > 0 ? savedCount : undefined,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 shadow-2xl safe-area-pb"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                onViewChange(tab.id);
                // Optional haptic vibration if supported on phone
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  try {
                    navigator.vibrate(10);
                  } catch {}
                }
              }}
              className={`relative flex flex-col items-center justify-center py-1 transition-all group cursor-pointer focus:outline-hidden ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 shadow-sm shadow-rose-500" />
              )}

              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? tab.accent === 'rose'
                        ? 'bg-rose-600/30 text-rose-400 ring-1 ring-rose-500/40'
                        : tab.accent === 'indigo'
                        ? 'bg-indigo-600/30 text-indigo-400 ring-1 ring-indigo-500/40'
                        : tab.accent === 'purple'
                        ? 'bg-purple-600/30 text-purple-300 ring-1 ring-purple-500/40'
                        : 'bg-amber-600/30 text-amber-400 ring-1 ring-amber-500/40'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Badge count (e.g. saved stories) */}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-slate-950">
                    {tab.badge}
                  </span>
                )}

                {/* Live Agent Dot */}
                {tab.hasDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-950 animate-pulse" />
                )}
              </div>

              <span
                className={`text-[10px] tracking-tight leading-tight mt-0.5 font-bold ${
                  isActive ? 'text-white font-extrabold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
