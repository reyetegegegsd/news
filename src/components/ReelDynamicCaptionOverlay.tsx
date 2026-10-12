import React from 'react';
import {
  SpokenPhraseChunk,
  SpokenWordToken,
  ReelCaptionEffect,
} from '../utils/newsVoiceNarrator';
import { Radio, Mic } from 'lucide-react';

interface ReelDynamicCaptionOverlayProps {
  activePhrase: SpokenPhraseChunk | null;
  activeWord: SpokenWordToken | null;
  currentTime: number;
  effect: ReelCaptionEffect;
  titleText: string;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  colorTheme?: string;
  isSpeaking?: boolean;
}

export const ReelDynamicCaptionOverlay: React.FC<ReelDynamicCaptionOverlayProps> = ({
  activePhrase,
  activeWord,
  currentTime,
  effect,
  titleText,
  fontSize = 'md',
  colorTheme = 'red_dark',
  isSpeaking = false,
}) => {
  if (!activePhrase) {
    return (
      <div className="relative z-20 p-4 text-center">
        <p className="text-sm font-bold text-white/80 animate-pulse">
          Starting voice narration...
        </p>
      </div>
    );
  }

  const isTitle = activePhrase.isTitle;
  const words = activePhrase.words;

  // Font size multiplier
  const sizeClass =
    fontSize === 'sm'
      ? 'text-base sm:text-lg'
      : fontSize === 'lg'
      ? 'text-xl sm:text-2xl'
      : fontSize === 'xl'
      ? 'text-2xl sm:text-3xl'
      : 'text-lg sm:text-xl';

  // --- EFFECT 1: HORMOZI VIRAL POP (Yellow Box on Active Word) ---
  if (effect === 'hormozi_pop') {
    return (
      <div className="relative z-20 px-4 py-3 space-y-2 flex flex-col justify-end">
        {/* Phase Badge */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-black shadow-md flex items-center gap-1">
            <Mic className="w-2.5 h-2.5" />
            <span>{isTitle ? 'HEADLINE' : 'LIVE VOICE'}</span>
          </span>
        </div>

        {/* Dynamic Spoken Words */}
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-2 font-black uppercase leading-tight ${sizeClass}`}>
          {words.map((w) => {
            const isCurrent = activeWord?.id === w.id;
            const hasBeenSpoken = currentTime >= w.endTime;

            if (isCurrent) {
              return (
                <span
                  key={w.id}
                  className="px-2 py-0.5 rounded-md bg-yellow-400 text-black shadow-lg shadow-yellow-500/30 scale-105 transition-all duration-75 inline-block font-black"
                >
                  {w.word}
                </span>
              );
            }

            return (
              <span
                key={w.id}
                className={`transition-colors duration-100 ${
                  hasBeenSpoken
                    ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                    : 'text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                }`}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // --- EFFECT 2: KARAOKE NEON GLOW (Cyan to Lime Progressive Flow) ---
  if (effect === 'karaoke_glow') {
    return (
      <div className="relative z-20 px-4 py-3 space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500 text-black shadow-sm">
            {isTitle ? '⚡ TOP STORY' : '🎙️ NARRATION'}
          </span>
        </div>

        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 font-extrabold leading-tight ${sizeClass}`}>
          {words.map((w) => {
            const isCurrent = activeWord?.id === w.id;
            const hasBeenSpoken = currentTime >= w.endTime;

            if (isCurrent) {
              return (
                <span
                  key={w.id}
                  className="text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)] scale-105 transition-all font-black underline decoration-cyan-400 decoration-2 underline-offset-4"
                >
                  {w.word}
                </span>
              );
            }

            return (
              <span
                key={w.id}
                className={`transition-all duration-100 ${
                  hasBeenSpoken
                    ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                    : 'text-white/40'
                }`}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // --- EFFECT 3: KINETIC CINE-FADE (Smooth Cinematic Glass Box) ---
  if (effect === 'kinetic_fade') {
    return (
      <div className="relative z-20 px-4 py-3">
        <div className="bg-black/65 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-2 shadow-2xl transition-all duration-200">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>{isTitle ? 'Official Headline' : 'Correspondent Audio'}</span>
            </span>
            <span className="text-slate-400 font-mono text-[9px]">
              {Math.floor(currentTime)}s
            </span>
          </div>

          <p className={`font-black text-white leading-snug drop-shadow-md ${sizeClass}`}>
            {activePhrase.text}
          </p>

          {activeWord && (
            <div className="text-[11px] text-amber-300 font-medium truncate pt-1 border-t border-white/10">
              Spoken: &ldquo;<strong className="text-white">{activeWord.cleanWord}</strong>&rdquo;
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- EFFECT 4: TV NEWS TELEPROMPTER BAR (Broadcast Anchor Lower-Third) ---
  if (effect === 'teleprompter_bar') {
    return (
      <div className="relative z-20 px-3 py-2 space-y-2">
        <div className="bg-gradient-to-r from-red-950/90 via-slate-950/90 to-red-950/90 border-y-2 border-red-600 p-3 shadow-2xl backdrop-blur-sm space-y-1.5">
          <div className="flex items-center justify-between text-[9px] font-bold text-red-400 tracking-wider uppercase">
            <span className="flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-red-500 animate-pulse" />
              <span>NEWS ANCHOR TELEPROMPTER</span>
            </span>
            <span className="text-white bg-red-600 px-1 rounded">LIVE AUDIO</span>
          </div>

          <div className={`font-black text-white uppercase tracking-wide leading-tight ${sizeClass}`}>
            {words.map((w) => {
              const isCurrent = activeWord?.id === w.id;
              return (
                <span
                  key={w.id}
                  className={`mr-1.5 transition-colors ${
                    isCurrent ? 'bg-red-600 text-white px-1 rounded' : 'text-slate-100'
                  }`}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- EFFECT 5: TYPEWRITER TERMINAL (Retro Cyber Cursor) ---
  if (effect === 'typewriter') {
    return (
      <div className="relative z-20 px-4 py-3">
        <div className="bg-slate-950/90 border border-emerald-500/50 rounded-xl p-3.5 font-mono shadow-2xl space-y-2">
          <div className="flex items-center justify-between text-[10px] text-emerald-400/80 border-b border-emerald-900/60 pb-1">
            <span>&gt; DISPATCH_FEED://{isTitle ? 'TITLE' : 'AUDIO_WIRE'}</span>
            <span className="animate-pulse">REC ●</span>
          </div>

          <div className={`text-emerald-400 font-bold leading-tight ${sizeClass}`}>
            {activePhrase.text}
            <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse align-middle" />
          </div>
        </div>
      </div>
    );
  }

  // --- EFFECT 6: HEADLINE PUNCH & ROLL (Locked Headline + Rolling Cards) ---
  if (effect === 'headline_punch') {
    return (
      <div className="relative z-20 px-4 py-3 space-y-3">
        {/* Fixed Title Punch at top of captions */}
        {!isTitle && (
          <div className="bg-black/60 border border-white/20 rounded-lg p-2 text-xs font-bold text-amber-300 truncate">
            📌 {titleText}
          </div>
        )}

        <div className="bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent p-3 rounded-xl border border-rose-500/40 space-y-1.5 shadow-xl">
          <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded uppercase">
            {isTitle ? 'HEADLINE' : 'DETAILS'}
          </span>
          <p className={`font-black text-white leading-tight ${sizeClass}`}>
            {activePhrase.text}
          </p>
        </div>
      </div>
    );
  }

  // --- EFFECT 7: MINIMALIST VOX PILL (Clean Charcoal Pill) ---
  if (effect === 'vox_minimal') {
    return (
      <div className="relative z-20 px-4 py-3">
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm space-y-1.5">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
            {isTitle ? 'Headlines' : 'Reporting'}
          </span>
          <div className={`font-bold text-slate-100 leading-snug ${sizeClass}`}>
            {words.map((w) => {
              const isCurrent = activeWord?.id === w.id;
              return (
                <span
                  key={w.id}
                  className={`mr-1.5 transition-all ${
                    isCurrent
                      ? 'bg-white text-slate-950 px-1.5 py-0.5 rounded font-black'
                      : 'text-slate-200'
                  }`}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- EFFECT 8: CYBER MATRIX WIRE (HUD & Sound Frequency Wave) ---
  if (effect === 'cyber_matrix') {
    return (
      <div className="relative z-20 px-4 py-3">
        <div className="bg-slate-950/85 border-2 border-emerald-500/70 rounded-xl p-3 font-mono shadow-2xl space-y-2">
          {/* Animated Frequency Audio Waves reacting to voice */}
          <div className="flex items-center justify-between text-[9px] text-emerald-400">
            <span>VOICE FREQUENCY (24kHz)</span>
            <div className="flex items-end gap-1 h-3">
              {[8, 14, 18, 10, 16, 20, 12, 18].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{ height: isSpeaking ? `${h}px` : '4px' }}
                />
              ))}
            </div>
          </div>

          <p className={`font-mono font-bold text-emerald-300 leading-tight ${sizeClass}`}>
            {activePhrase.text}
          </p>
        </div>
      </div>
    );
  }

  // --- EFFECT 9: STUDIO SPOTLIGHT (100% White Focus, 35% Dimming) ---
  if (effect === 'spotlight') {
    return (
      <div className="relative z-20 px-4 py-3 space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white text-black shadow-sm">
            🔦 SPOTLIGHT
          </span>
        </div>

        <div className={`flex flex-wrap items-center gap-x-2 gap-y-2 font-black leading-tight ${sizeClass}`}>
          {words.map((w) => {
            const isCurrent = activeWord?.id === w.id;
            return (
              <span
                key={w.id}
                className={`transition-all duration-100 ${
                  isCurrent
                    ? 'text-white scale-110 drop-shadow-[0_0_16px_rgba(255,255,255,1)] underline decoration-amber-400 decoration-2 underline-offset-4'
                    : 'text-white/35 drop-shadow-sm'
                }`}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // --- EFFECT 10: BOLD IMPACT ZOOM (Spring Zoom with Crimson Line) ---
  return (
    <div className="relative z-20 px-4 py-3 space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md">
          💥 IMPACT
        </span>
      </div>

      <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-2 font-black uppercase leading-tight ${sizeClass}`}>
        {words.map((w) => {
          const isCurrent = activeWord?.id === w.id;
          return (
            <span
              key={w.id}
              className={`transition-all duration-75 ${
                isCurrent
                  ? 'text-white scale-110 bg-rose-600 px-1.5 py-0.5 rounded shadow-lg shadow-rose-600/50'
                  : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
              }`}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
