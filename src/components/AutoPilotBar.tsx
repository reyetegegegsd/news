import React from 'react';
import { Play, Pause, Zap, Clock, Instagram } from 'lucide-react';

interface AutoPilotBarProps {
  isEnabled: boolean;
  onToggle: () => void;
  nextRunCountdown: number;
  currentActionLog: string;
  onTriggerInstantRun: () => void;
  isProcessing: boolean;
  onOpenAgentHub?: () => void;
  onOpenScheduleModal?: () => void;
  intervalMinutes?: number;
  onUpdateInterval?: (minutes: number) => void;
  igHandle?: string;
  onViewProgress?: () => void;
  progressPct?: number;
}

export const AutoPilotBar: React.FC<AutoPilotBarProps> = ({
  isEnabled,
  onToggle,
  nextRunCountdown,
  currentActionLog,
  onTriggerInstantRun,
  isProcessing,
  intervalMinutes = 15,
  onUpdateInterval,
  igHandle = '@viralnews.live',
  onViewProgress,
  progressPct = 0,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:px-4 sm:py-2.5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
      {/* Left: Mode Title & Info */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isEnabled ? 'bg-pink-400 animate-ping' : 'bg-slate-600'
            }`}
            aria-hidden="true"
          />
          <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>AI Reel Agent ({intervalMinutes}m Auto-Upload)</span>
          </span>
          <span className="text-slate-500 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-pink-300 font-medium text-[11px] sm:text-xs">
            {igHandle}
          </span>
          <span className="text-slate-500 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-slate-400 font-normal text-[11px] sm:text-xs">
            {isEnabled ? 'Monitoring & Posting Live' : 'Paused'}
          </span>
        </div>

        {currentActionLog && (
          <span className="text-[11px] text-slate-400 font-mono hidden xl:inline truncate max-w-xs">
            {currentActionLog}
          </span>
        )}
      </div>

      {/* Right: Controls, Interval Selector & Countdown */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Interval Dropdown */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400 text-[10px] sm:text-[11px] font-medium hidden xs:inline">Interval:</span>
          <select
            value={intervalMinutes}
            onChange={(e) => onUpdateInterval?.(Number(e.target.value))}
            className="bg-transparent text-amber-300 font-bold outline-none cursor-pointer text-xs"
            title="Upload Interval"
            aria-label="Upload Interval"
          >
            <option value={1} className="bg-slate-900 text-amber-300 font-bold">🚀 1 min (Fast)</option>
            <option value={2} className="bg-slate-900 text-amber-300 font-bold">⚡ 2 min</option>
            <option value={5} className="bg-slate-900 text-amber-300 font-bold">⚡ 5 min</option>
            <option value={10} className="bg-slate-900 text-amber-300 font-bold">⚡ 10 min</option>
            <option value={15} className="bg-slate-900 text-amber-300 font-bold">⭐ 15 min</option>
            <option value={30} className="bg-slate-900 text-amber-300 font-bold">🕒 30 min</option>
            <option value={60} className="bg-slate-900 text-amber-300 font-bold">🕐 60 min</option>
          </select>
        </div>

        {isEnabled && (
          <div className="flex items-center gap-1 font-mono tabular-nums text-pink-300 text-[11px] sm:text-xs px-2 py-1 bg-pink-950/40 border border-pink-900/50 rounded-md shadow-xs">
            <Clock className="w-3 h-3 text-pink-400 animate-pulse shrink-0" />
            <span className="font-bold">Next: {formatTime(nextRunCountdown)}</span>
          </div>
        )}

        {isProcessing && (
          <button
            onClick={onViewProgress}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/70 border border-rose-500/50 hover:bg-rose-900/60 rounded-lg text-rose-300 font-bold transition text-xs cursor-pointer shadow-sm animate-pulse"
            title="लाइव स्टेप्स व प्रोग्रेस देखें"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>🎬 {progressPct > 0 ? `${progressPct}%` : 'प्रोसेसिंग...'}</span>
          </button>
        )}

        <button
          onClick={onTriggerInstantRun}
          disabled={isProcessing}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-xs shadow-xs cursor-pointer"
          title="Instant Auto Publish Reel to Connected Channels"
        >
          <Zap className="w-3.5 h-3.5 text-amber-200 shrink-0" />
          <span className="hidden sm:inline">Upload Reel Now</span>
          <span className="sm:hidden">Upload Now</span>
        </button>

        <button
          onClick={onToggle}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
            isEnabled
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isEnabled ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>Start ({intervalMinutes}m)</span>
            </>
          )}
        </button>
      </div>

      {/* Mini Progress Bar when reel is being recorded/uploaded */}
      {isProcessing && (
        <div className="w-full mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 transition-all duration-300 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
          />
        </div>
      )}
    </div>
  );
};
