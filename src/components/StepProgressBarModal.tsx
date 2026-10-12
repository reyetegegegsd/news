import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Loader2,
  Film,
  Download,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Zap,
  Volume2,
  Image as ImageIcon,
  Subtitles,
  FileVideo,
  Clock,
  ArrowRight,
  AlertCircle,
  Share2,
  Newspaper,
  Palette,
  Type,
  Hash,
} from 'lucide-react';
import { ReelProgressState } from '../types';

interface StepProgressBarModalProps {
  progressState: ReelProgressState;
  onClose: () => void;
  onDownload?: () => void;
  onPreview?: () => void;
  onPublishToInstagram?: () => void;
  onOpenStudio?: () => void;
  onOpenReels?: () => void;
  onRetry?: () => void;
}

export const StepProgressBarModal: React.FC<StepProgressBarModalProps> = ({
  progressState,
  onClose,
  onDownload,
  onPreview,
  onPublishToInstagram,
  onOpenStudio,
  onOpenReels,
  onRetry,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'logs'>('steps');
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll logs to bottom when new log arrives
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [progressState.logs]);

  if (!progressState.isVisible) return null;

  const isStoryMode = progressState.actionType === 'story';

  // Floating Minimized Pill at bottom-right
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-slate-900/95 border border-rose-500/50 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl flex items-center gap-3.5 ring-1 ring-white/10 max-w-sm">
          <div className="relative flex items-center justify-center">
            <svg className="w-11 h-11 transform -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-rose-500 transition-all duration-300"
                fill="transparent"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * Math.min(100, Math.max(0, progressState.percentage))) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[11px] font-black text-white tabular-nums">
              {progressState.percentage}%
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <p className="text-xs font-bold text-white truncate">
                {progressState.isComplete ? '🎉 तैयार हो गया!' : isStoryMode ? '📰 स्टोरी तैयार हो रही है' : '🎬 रील तैयार हो रही है'}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {progressState.statusTextHi || progressState.statusText || 'प्रोग्रेस चालू है...'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="बड़ा करें (Maximize)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            {progressState.isComplete && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Helper step icons
  const getStepIcon = (stepId: number) => {
    if (isStoryMode) {
      switch (stepId) {
        case 1:
          return <Zap className="w-4 h-4" />;
        case 2:
          return <Type className="w-4 h-4" />;
        case 3:
          return <Palette className="w-4 h-4" />;
        case 4:
          return <Hash className="w-4 h-4" />;
        case 5:
          return <Sparkles className="w-4 h-4" />;
        default:
          return <Clock className="w-4 h-4" />;
      }
    }
    switch (stepId) {
      case 1:
        return <Zap className="w-4 h-4" />;
      case 2:
        return <Volume2 className="w-4 h-4" />;
      case 3:
        return <ImageIcon className="w-4 h-4" />;
      case 4:
        return <Subtitles className="w-4 h-4" />;
      case 5:
        return <Film className="w-4 h-4" />;
      case 6:
        return <FileVideo className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const completedCount = progressState.steps.filter((s) => s.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isStoryMode ? 'bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500' : 'bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-600'} text-white shadow-lg`}>
              {isStoryMode ? <Newspaper className="w-5 h-5 animate-pulse" /> : <Film className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>{isStoryMode ? '📰 Live Wire Editorial - स्टेप-बाय-स्टेप प्रोग्रेस ट्रैकर' : '🎬 AI Reel Studio - लाइव प्रोग्रेस ट्रैकर'}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Step-by-Step
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                {progressState.headline ? `📰 ${progressState.headline}` : isStoryMode ? 'लाइव वायर से पूर्ण पत्रकारिता स्टोरी और पोस्टर जेनरेशन' : '9:16 वर्टिकल रील वीडियो जेनरेशन'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="छोटा करें (Minimize to background)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              disabled={!progressState.isComplete && !progressState.error}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title={progressState.isComplete || progressState.error ? 'बंद करें' : 'प्रोसेस पूरा होने तक इंतज़ार करें'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Main Progress Bar & Metrics */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>क्या चल रहा है (Current Status):</span>
                </span>
                <p className="text-sm font-black text-white mt-0.5 flex items-center gap-2">
                  <span>{progressState.statusTextHi || progressState.statusText || 'प्रोसेस शुरू हो रहा है...'}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent tabular-nums">
                  {progressState.percentage}%
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {completedCount} / {progressState.steps.length} स्टेप्स पूरे
                </div>
              </div>
            </div>

            {/* Glowing Striped Progress Bar */}
            <div className="relative w-full h-3.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-300 ease-out relative shadow-sm"
                style={{ width: `${Math.min(100, Math.max(0, progressState.percentage))}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>

            {/* Micro Details under bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
              <span className="flex items-center gap-1 text-slate-300 truncate max-w-xs">
                {progressState.isComplete ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> सब कुछ सफलतापूर्वक पूरा हो गया
                  </span>
                ) : (
                  <span>कदम {progressState.currentStepId} / 6 चालू है</span>
                )}
              </span>
              <span>1080x1920 • 9:16 Video</span>
            </div>
          </div>

          {/* Sub Navigation: Step by step cards VS Live Log Terminal */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('steps')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'steps'
                    ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📋 स्टेप-बाय-स्टेप प्रोग्रेस ({completedCount}/6)</span>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>💻 लाइव एक्टिविटी लॉग ({progressState.logs.length})</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              क्रमबद्ध (Step by Step) प्रोसेस
            </span>
          </div>

          {/* TAB 1: STEP-BY-STEP CARDS (Sab ek sath nahi, ek ek step dikhana) */}
          {activeTab === 'steps' && (
            <div className="space-y-2.5">
              {progressState.steps.map((step) => {
                const isCompleted = step.status === 'completed';
                const isActive = step.status === 'active';
                const isPending = step.status === 'pending';

                return (
                  <div
                    key={step.id}
                    className={`rounded-xl p-3 border transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-rose-950/40 to-slate-900 border-rose-500/60 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/30'
                        : isCompleted
                        ? 'bg-slate-950/40 border-emerald-900/40 opacity-90'
                        : 'bg-slate-950/20 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Step number badge / Icon */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                            isCompleted
                              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                              : isActive
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/50 animate-pulse'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isActive ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            getStepIcon(step.id)
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">
                              स्टेप {step.id}: {step.titleHi}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                              ({step.title})
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {isActive
                              ? step.detailHi || step.detail || 'प्रोसेसिंग जारी है...'
                              : isCompleted
                              ? 'सफलतापूर्वक पूरा हुआ (Completed)'
                              : step.detailHi || 'प्रतीक्षा में (Waiting for previous step)'}
                          </p>
                        </div>
                      </div>

                      {/* Status indicator tag */}
                      <div className="shrink-0 text-right">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> पूरा हुआ
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> चालू है
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/40">
                            बाकी है
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: LIVE ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div
              ref={logContainerRef}
              className="bg-black/80 border border-slate-800 rounded-xl p-3.5 font-mono text-xs max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700"
            >
              {progressState.logs.length === 0 ? (
                <div className="text-slate-500 py-4 text-center">
                  लॉग्स अभी शुरू हो रहे हैं...
                </div>
              ) : (
                progressState.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed text-[11px]">
                    <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                    <span
                      className={
                        log.text.includes('🎉') || log.text.includes('Complete') || log.text.includes('सफलतापूर्वक')
                          ? 'text-emerald-400 font-bold'
                          : log.text.includes('⚠️') || log.text.includes('Error')
                          ? 'text-rose-400'
                          : log.text.includes('Recording') || log.text.includes('रिकॉर्ड')
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Error Banner */}
          {progressState.error && (
            <div className="bg-rose-950/60 border border-rose-700/60 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-rose-200">एक्सपोर्ट में समस्या आई</h4>
                <p className="text-xs text-rose-300/90 mt-0.5">{progressState.error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition"
                  >
                    दोबारा कोशिश करें (Retry)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Completion Celebration Card */}
          {progressState.isComplete && (
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 rounded-xl p-4 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-white">
                    {isStoryMode
                      ? '🎉 बधाई हो! आपकी लाइव वायर स्टोरी और पोस्टर पूरी तरह तैयार हैं'
                      : '🎉 बधाई हो! आपका 9:16 रील वीडियो पूरी तरह तैयार है'}
                  </h4>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    {isStoryMode
                      ? '100% सत्यापित Google News वायर फैक्ट्स, विस्तृत संपादकीय रिपोर्ट और HD पोस्टर्स तैयार हो चुके हैं।'
                      : '100% क्लियर वॉइसओवर ऑडियो, सिंक किए गए सबटाइटल्स और न्यूज़ विज़ुअल्स सुरक्षित हो गए हैं।'}
                  </p>
                  {progressState.fileSizeBytes && (
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                      <span>साइज़: {(progressState.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                      {progressState.durationSec && (
                        <span>अवधि: {Math.round(progressState.durationSec)} सेकंड</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-slate-800">
                {isStoryMode && onOpenStudio && (
                  <button
                    onClick={onOpenStudio}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>🎨 पोस्टर स्टूडियो में खोलें (Open in Poster Studio)</span>
                  </button>
                )}

                {isStoryMode && onOpenReels && (
                  <button
                    onClick={onOpenReels}
                    className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5 text-white" />
                    <span>🎬 रील स्टूडियो में बनाएं (Create Reel)</span>
                  </button>
                )}

                {!isStoryMode && onDownload && (
                  <button
                    onClick={onDownload}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>📥 वीडियो डाउनलोड करें (Download MP4)</span>
                  </button>
                )}

                {!isStoryMode && onPreview && (
                  <button
                    onClick={onPreview}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>प्ले करें (Preview)</span>
                  </button>
                )}

                {!isStoryMode && onPublishToInstagram && (
                  <button
                    onClick={onPublishToInstagram}
                    className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-pink-950/40 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>📸 इंस्टाग्राम पर पोस्ट करें</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition cursor-pointer ml-auto"
                >
                  बंद करें (Close)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                progressState.isComplete
                  ? 'bg-emerald-400'
                  : progressState.error
                  ? 'bg-rose-500'
                  : 'bg-rose-400 animate-ping'
              }`}
            />
            <span className="text-[11px]">
              {progressState.isComplete
                ? 'एक्सपोर्ट संपन्न • फ़ाइल सुरक्षित'
                : progressState.error
                ? 'त्रुटि हुई'
                : 'रियल-टाइम रील रेंडरिंग जारी...'}
            </span>
          </span>

          <button
            onClick={() => setIsMinimized(true)}
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
          >
            बैकग्राउंड में चलाएं (Run in Background)
          </button>
        </div>
      </div>
    </div>
  );
};
