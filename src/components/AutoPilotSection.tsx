import React from 'react';
import { SocialAccount, PublishedPost, AiAgentConfig } from '../types';
import {
  Play,
  Pause,
  Zap,
  Clock,
  Instagram,
  Sparkles,
  Calendar,
  ShieldCheck,
  Settings,
  Heart,
  Share2,
} from 'lucide-react';

interface AutoPilotSectionProps {
  agentConfig: AiAgentConfig;
  onToggleAgent: () => void;
  nextRunCountdown: number;
  currentActionLog: string;
  onTriggerInstantRun: () => void;
  isPublishing: boolean;
  onUpdateInterval: (minutes: number) => void;
  onOpenScheduleModal: () => void;
  onOpenConnectModal: () => void;
  accounts: SocialAccount[];
  history: PublishedPost[];
  userHandle: string;
  onOpenReelInStudio?: (item: any) => void;
}

export const AutoPilotSection: React.FC<AutoPilotSectionProps> = ({
  agentConfig,
  onToggleAgent,
  nextRunCountdown,
  currentActionLog,
  onTriggerInstantRun,
  isPublishing,
  onUpdateInterval,
  onOpenScheduleModal,
  onOpenConnectModal,
  accounts,
  history,
  userHandle,
  onOpenReelInStudio,
}) => {
  const igAccount = accounts.find((a) => a.platform === 'instagram');
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const reelHistory = history.filter((h) => h.isReel || h.platforms?.includes('instagram'));

  return (
    <div className="space-y-6 pt-2">
      {/* 1. HERO AUTOPILOT CONTROLLER */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-indigo-600 text-white shadow-lg">
                <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>AI Instagram Auto-Pilot</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      agentConfig.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {agentConfig.isEnabled ? '● Live Autonomous Mode' : '○ Standby'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Automatically scans real breaking news, renders 9:16 vertical reels with audio voiceover, and publishes directly to Instagram.
                </p>
              </div>
            </div>

            {currentActionLog && (
              <div className="flex items-center gap-2 text-xs font-mono text-pink-300 bg-black/40 border border-slate-800 rounded-xl px-3 py-1.5 w-fit">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                <span>{currentActionLog}</span>
              </div>
            )}
          </div>

          {/* Quick Actions & Countdown */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Big Start / Pause Toggle */}
            <button
              onClick={onToggleAgent}
              className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                agentConfig.isEnabled
                  ? 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-rose-950/60 ring-2 ring-rose-400/50'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/50'
              }`}
            >
              {agentConfig.isEnabled ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause Auto-Pilot</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Activate 15m Auto-Pilot</span>
                </>
              )}
            </button>

            {/* Instant Force Run */}
            <button
              onClick={onTriggerInstantRun}
              disabled={isPublishing}
              className="px-4 py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition shadow-lg cursor-pointer"
              title="Publish a real news reel to Instagram right now"
            >
              <Zap className={`w-4 h-4 text-amber-200 ${isPublishing ? 'animate-bounce' : ''}`} />
              <span>{isPublishing ? 'Uploading Reel...' : 'Instant Reel Upload'}</span>
            </button>
          </div>
        </div>

        {/* Setting Strip: Interval, Language & Countdown */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Interval Selector */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Upload Frequency</span>
                <span className="font-bold text-white">Every {agentConfig.intervalMinutes} Minutes</span>
              </div>
            </div>
            <select
              value={agentConfig.intervalMinutes}
              onChange={(e) => onUpdateInterval(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs rounded-xl px-2.5 py-1 outline-none cursor-pointer"
            >
              <option value={1}>1 Min (Turbo)</option>
              <option value={5}>5 Min</option>
              <option value={10}>10 Min</option>
              <option value={15}>15 Min (Standard)</option>
              <option value={30}>30 Min</option>
              <option value={60}>60 Min</option>
            </select>
          </div>

          {/* Countdown Clock */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${agentConfig.isEnabled ? 'bg-pink-400 animate-ping' : 'bg-slate-600'}`} />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Next Upload In</span>
                <span className="font-mono font-bold text-pink-300 text-sm">
                  {agentConfig.isEnabled ? formatTime(nextRunCountdown) : 'Timer Paused'}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Autonomous</span>
          </div>

          {/* Connected Instagram Profile */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-400" />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Target Channel</span>
                <span className="font-bold text-white truncate max-w-[120px] block">
                  {igAccount?.handle || userHandle}
                </span>
              </div>
            </div>
            <button
              onClick={onOpenConnectModal}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-[11px] text-slate-300 font-semibold transition cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED CARDS: 2-DAY SCHEDULER & DISPATCH QUEUE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: 2-Day Multi-Reel Scheduler */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Multi-Day Auto-Scheduler</h3>
                <span className="text-xs text-amber-300 font-semibold">Do Din Ka Schedule (2-Day Plan)</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate 4 to 8 scheduled video slots for Today and Tomorrow with real Google-verified breaking news, advance MP4 pre-rendering, and cover images.
            </p>
          </div>

          <button
            onClick={onOpenScheduleModal}
            className="w-full py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-amber-200" />
            <span>Open 2-Day Scheduler Dashboard</span>
          </button>
        </div>

        {/* Card B: Meta Graph API & Instagram Connection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Instagram &amp; Meta Publishing Hub</h3>
                <span className="text-xs text-emerald-400 font-semibold">Live Social Bridge</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your official Instagram Business Account or Facebook News Page with Access Token and Page ID for direct automated posting.
            </p>
          </div>

          <button
            onClick={onOpenConnectModal}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Configure Accounts &amp; Access Tokens</span>
          </button>
        </div>
      </div>

      {/* 3. RECENT DISPATCHES & PUBLISHED REELS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-400" />
              <span>Published Reels &amp; Dispatches ({reelHistory.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live dispatches uploaded to Instagram Reels and social feeds
            </p>
          </div>
        </div>

        {reelHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mb-1" />
            <p className="font-semibold text-slate-300">No dispatches published yet</p>
            <p className="text-slate-500 max-w-sm">
              Click 'Instant Reel Upload' or activate Auto-Pilot to publish your first breaking news reel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reelHistory.slice(0, 6).map((post) => (
              <div
                key={post.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-pink-300 font-bold flex items-center gap-1">
                      <Instagram className="w-3 h-3" /> Instagram Reel
                    </span>
                    <span>{new Date(post.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {post.headline}
                  </h4>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" />
                      <span>{post.likes}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-indigo-400" />
                      <span>{post.shares}</span>
                    </span>
                  </div>

                  {onOpenReelInStudio && (
                    <button
                      onClick={() => onOpenReelInStudio(post)}
                      className="text-pink-400 hover:text-white font-semibold transition"
                    >
                      Open in Studio →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
