// News Voice Narrator & Spoken Word Synchronizer
// Powers voiceover narration for Reels with Title -> Full Description speech synthesis
// and word-by-word synchronized caption animation

export interface SpokenWordToken {
  id: string;
  word: string;
  cleanWord: string;
  phraseIndex: number;
  wordIndexInPhrase: number;
  globalWordIndex: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  isTitle: boolean;
  isKeyword?: boolean;
}

export interface SpokenPhraseChunk {
  id: string;
  text: string;
  words: SpokenWordToken[];
  phraseIndex: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  isTitle: boolean;
}

export interface NarrationScript {
  title: string;
  description: string;
  fullSpokenText: string;
  totalDuration: number;
  phrases: SpokenPhraseChunk[];
  allWords: SpokenWordToken[];
}

export type ReelCaptionEffect =
  | 'hormozi_pop'
  | 'karaoke_glow'
  | 'kinetic_fade'
  | 'teleprompter_bar'
  | 'typewriter'
  | 'headline_punch'
  | 'vox_minimal'
  | 'cyber_matrix'
  | 'spotlight'
  | 'impact_zoom';

export interface CaptionEffectDefinition {
  id: ReelCaptionEffect;
  name: string;
  tagline: string;
  icon: string;
  accentColor: string;
  sampleStyleBadge: string;
  description: string;
}

export const REEL_CAPTION_EFFECTS: CaptionEffectDefinition[] = [
  {
    id: 'hormozi_pop',
    name: 'Hormozi Pop',
    tagline: 'Bold Yellow Word Box',
    icon: '⚡',
    accentColor: '#FACC15',
    sampleStyleBadge: 'bg-yellow-400 text-black font-black',
    description: 'High-impact viral captions with bold black uppercase text and a vibrant yellow pill box popping on the active spoken word.',
  },
  {
    id: 'karaoke_glow',
    name: 'Karaoke Neon',
    tagline: 'Glowing Cyan Word Fill',
    icon: '🎤',
    accentColor: '#38BDF8',
    sampleStyleBadge: 'bg-cyan-500 text-black font-black',
    description: 'Full sentence displayed with flowing progressive neon cyan & electric green word fill as the voice speaks.',
  },
  {
    id: 'kinetic_fade',
    name: 'Kinetic Cine-Fade',
    tagline: 'Smooth Cinematic Rise',
    icon: '🎬',
    accentColor: '#FB7185',
    sampleStyleBadge: 'bg-rose-500 text-white font-bold',
    description: 'Cinematic documentary fade-in with smooth scale-up and subtle dark glass backing for maximum elegance.',
  },
  {
    id: 'teleprompter_bar',
    name: 'TV Teleprompter',
    tagline: 'News Anchor Lower-Third',
    icon: '📡',
    accentColor: '#EF4444',
    sampleStyleBadge: 'bg-red-600 text-white font-black',
    description: 'Official news anchor prompter bar with pulsing red LIVE beacon, displaying spoken phrases in crisp broadcast layout.',
  },
  {
    id: 'typewriter',
    name: 'Terminal Cyber',
    tagline: 'Letter-by-Letter Cursor',
    icon: '⌨️',
    accentColor: '#10B981',
    sampleStyleBadge: 'bg-emerald-500 text-black font-mono font-bold',
    description: 'Retro digital news terminal typing out characters in sync with voiceover with a blinking cyber cursor.',
  },
  {
    id: 'headline_punch',
    name: 'Headline Punch',
    tagline: 'Locked Title + Rolling Deck',
    icon: '💥',
    accentColor: '#F97316',
    sampleStyleBadge: 'bg-orange-500 text-white font-black',
    description: 'Headline stays locked high at the top while descriptive sentences roll in smoothly on dark frosted glass cards.',
  },
  {
    id: 'vox_minimal',
    name: 'Minimalist Vox',
    tagline: 'Clean Charcoal Pill',
    icon: '📰',
    accentColor: '#E2E8F0',
    sampleStyleBadge: 'bg-slate-200 text-slate-900 font-bold',
    description: 'Clean modern journalism typography where active phrases appear inside subtle rounded charcoal pills with crisp white text.',
  },
  {
    id: 'cyber_matrix',
    name: 'Matrix Wire',
    tagline: 'Emerald HUD & EQ Pulse',
    icon: '🟢',
    accentColor: '#22C55E',
    sampleStyleBadge: 'bg-emerald-950 text-emerald-400 font-mono font-black border border-emerald-500',
    description: 'Monospace green wire text with digital audio frequency waves that pulse dynamically to the speaker voice.',
  },
  {
    id: 'spotlight',
    name: 'Studio Spotlight',
    tagline: 'Pure White Focus (35% Dim)',
    icon: '🔦',
    accentColor: '#FFFFFF',
    sampleStyleBadge: 'bg-white text-black font-bold',
    description: 'Active spoken word is illuminated in 100% bright white with a soft halo, while surrounding text drops to 35% opacity.',
  },
  {
    id: 'impact_zoom',
    name: 'Impact Zoom',
    tagline: 'Spring Scale & Red Line',
    icon: '🎯',
    accentColor: '#E11D48',
    sampleStyleBadge: 'bg-rose-600 text-white font-black',
    description: 'High-energy scale zoom on emphasized keywords and numbers with a sharp crimson underline flash.',
  },
];

// Helper to calculate word weight based on character length and punctuation
export function getWordTimingWeight(word: string): number {
  if (!word) return 1;
  let wt = Math.max(1, word.length);
  // Add weight for punctuation pauses
  if (word.endsWith(',') || word.endsWith(';')) wt += 2.0;
  if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?') || word.endsWith('।')) wt += 4.0;
  return wt;
}

// Aligns a NarrationScript to exact ground truth audio duration with zero drift
export function alignNarrationScript(
  script: NarrationScript,
  actualTotalDuration: number,
  titleDuration?: number,
  pauseDuration: number = 0.35,
  descDuration?: number
): NarrationScript {
  if (!script || actualTotalDuration <= 0) return script;

  const tWords = script.allWords.filter(w => w.isTitle);
  const dWords = script.allWords.filter(w => !w.isTitle);

  // If title/desc split durations not specified, compute proportionally
  let effectiveTitleDuration = titleDuration;
  let effectiveDescDuration = descDuration;

  if (!effectiveTitleDuration || !effectiveDescDuration) {
    const tTotalWt = tWords.reduce((acc, w) => acc + getWordTimingWeight(w.word), 0) || 1;
    const dTotalWt = dWords.reduce((acc, w) => acc + getWordTimingWeight(w.word), 0) || 1;
    const totalWt = tTotalWt + dTotalWt;

    const availableSpeechTime = Math.max(1, actualTotalDuration - pauseDuration);
    effectiveTitleDuration = (tTotalWt / totalWt) * availableSpeechTime;
    effectiveDescDuration = (dTotalWt / totalWt) * availableSpeechTime;
  }

  const alignedAllWords: SpokenWordToken[] = [];
  const alignedPhrases: SpokenPhraseChunk[] = [];
  let phraseIdx = 0;

  // 1. Align Title Words
  const tTotalWt = tWords.reduce((acc, w) => acc + getWordTimingWeight(w.word), 0) || 1;
  let curTime = 0;
  const titleTokens: SpokenWordToken[] = [];

  tWords.forEach((token, i) => {
    const dur = effectiveTitleDuration! * (getWordTimingWeight(token.word) / tTotalWt);
    const start = Number(curTime.toFixed(3));
    const end = Number((curTime + dur).toFixed(3));
    const alignedToken: SpokenWordToken = {
      ...token,
      phraseIndex: phraseIdx,
      wordIndexInPhrase: i,
      startTime: start,
      endTime: end,
    };
    alignedAllWords.push(alignedToken);
    titleTokens.push(alignedToken);
    curTime += dur;
  });

  if (titleTokens.length > 0) {
    alignedPhrases.push({
      id: `phrase-${phraseIdx}`,
      text: titleTokens.map(t => t.word).join(' '),
      words: titleTokens,
      phraseIndex: phraseIdx,
      startTime: 0,
      endTime: Number(effectiveTitleDuration!.toFixed(3)),
      isTitle: true,
    });
    phraseIdx++;
  }

  // 2. Align Description Words
  curTime = effectiveTitleDuration! + pauseDuration;
  const dTotalWt = dWords.reduce((acc, w) => acc + getWordTimingWeight(w.word), 0) || 1;
  const descTokens: SpokenWordToken[] = [];

  dWords.forEach((token, i) => {
    const dur = effectiveDescDuration! * (getWordTimingWeight(token.word) / dTotalWt);
    const start = Number(curTime.toFixed(3));
    const end = Number((curTime + dur).toFixed(3));
    const alignedToken: SpokenWordToken = {
      ...token,
      phraseIndex: phraseIdx,
      wordIndexInPhrase: i % 4,
      startTime: start,
      endTime: end,
    };
    alignedAllWords.push(alignedToken);
    descTokens.push(alignedToken);
    curTime += dur;
  });

  const CHUNK_SIZE = 4;
  for (let i = 0; i < descTokens.length; i += CHUNK_SIZE) {
    const chunkTokens = descTokens.slice(i, i + CHUNK_SIZE);
    alignedPhrases.push({
      id: `phrase-${phraseIdx}`,
      text: chunkTokens.map(t => t.word).join(' '),
      words: chunkTokens,
      phraseIndex: phraseIdx,
      startTime: chunkTokens[0].startTime,
      endTime: chunkTokens[chunkTokens.length - 1].endTime,
      isTitle: false,
    });
    phraseIdx++;
  }

  return {
    ...script,
    totalDuration: actualTotalDuration,
    allWords: alignedAllWords,
    phrases: alignedPhrases,
  };
}

// Split text into words and construct time-aligned script
export function buildNarrationScript(
  title: string,
  description: string,
  speechRate: number = 1.0
): NarrationScript {
  const cleanTitle = (title || 'Breaking News Report').trim();
  const cleanDesc = (description || 'Ground correspondents confirm major live developments. Full updates verified.').trim();

  const phrases: SpokenPhraseChunk[] = [];
  const allWords: SpokenWordToken[] = [];
  let currentTime = 0;
  let phraseIdx = 0;
  let globalWordIdx = 0;

  // Average word duration in seconds at 1.0x rate (~145 wpm = 0.41s/word)
  const baseWordDuration = 0.41;

  // --- 1. TITLE PHRASE(S) ---
  const titleWordsRaw = cleanTitle.split(/\s+/).filter(Boolean);
  const titleWordChunks: string[][] = [];
  if (titleWordsRaw.length > 7) {
    const half = Math.ceil(titleWordsRaw.length / 2);
    titleWordChunks.push(titleWordsRaw.slice(0, half));
    titleWordChunks.push(titleWordsRaw.slice(half));
  } else {
    titleWordChunks.push(titleWordsRaw);
  }

  for (const chunk of titleWordChunks) {
    const chunkWords: SpokenWordToken[] = [];
    const chunkStart = currentTime;

    for (let i = 0; i < chunk.length; i++) {
      const rawWord = chunk[i];
      const cleanW = rawWord.replace(/[^\w\d\u0900-\u097F]/g, '');
      const duration = baseWordDuration * (getWordTimingWeight(rawWord) / 5.0);
      const wEnd = currentTime + duration;

      const token: SpokenWordToken = {
        id: `word-${globalWordIdx}`,
        word: rawWord,
        cleanWord: cleanW,
        phraseIndex: phraseIdx,
        wordIndexInPhrase: i,
        globalWordIndex: globalWordIdx,
        startTime: Number(currentTime.toFixed(3)),
        endTime: Number(wEnd.toFixed(3)),
        isTitle: true,
        isKeyword: /\d+|[A-Z]{2,}/.test(rawWord),
      };

      chunkWords.push(token);
      allWords.push(token);
      currentTime = wEnd;
      globalWordIdx++;
    }

    const chunkEnd = currentTime;
    phrases.push({
      id: `phrase-${phraseIdx}`,
      text: chunk.join(' '),
      words: chunkWords,
      phraseIndex: phraseIdx,
      startTime: Number(chunkStart.toFixed(3)),
      endTime: Number(chunkEnd.toFixed(3)),
      isTitle: true,
    });
    phraseIdx++;
  }

  // Brief breathing pause after reading Title (0.35s)
  currentTime += 0.35;

  // --- 2. FULL DESCRIPTION PHRASES ---
  const descWordsRaw = cleanDesc.split(/\s+/).filter(Boolean);
  const CHUNK_SIZE = 4;
  const descWordChunks: string[][] = [];

  for (let i = 0; i < descWordsRaw.length; i += CHUNK_SIZE) {
    descWordChunks.push(descWordsRaw.slice(i, i + CHUNK_SIZE));
  }

  for (const chunk of descWordChunks) {
    const chunkWords: SpokenWordToken[] = [];
    const chunkStart = currentTime;

    for (let i = 0; i < chunk.length; i++) {
      const rawWord = chunk[i];
      const cleanW = rawWord.replace(/[^\w\d\u0900-\u097F]/g, '');
      const duration = baseWordDuration * (getWordTimingWeight(rawWord) / 5.0);
      const wEnd = currentTime + duration;

      const token: SpokenWordToken = {
        id: `word-${globalWordIdx}`,
        word: rawWord,
        cleanWord: cleanW,
        phraseIndex: phraseIdx,
        wordIndexInPhrase: i,
        globalWordIndex: globalWordIdx,
        startTime: Number(currentTime.toFixed(3)),
        endTime: Number(wEnd.toFixed(3)),
        isTitle: false,
        isKeyword: /\d+|[A-Z]{2,}/.test(rawWord),
      };

      chunkWords.push(token);
      allWords.push(token);
      currentTime = wEnd;
      globalWordIdx++;
    }

    const chunkEnd = currentTime;
    phrases.push({
      id: `phrase-${phraseIdx}`,
      text: chunk.join(' '),
      words: chunkWords,
      phraseIndex: phraseIdx,
      startTime: Number(chunkStart.toFixed(3)),
      endTime: Number(chunkEnd.toFixed(3)),
      isTitle: false,
    });
    phraseIdx++;
  }

  const fullSpokenText = `${cleanTitle}. ${cleanDesc}`;
  const totalDuration = Number(currentTime.toFixed(3));

  return {
    title: cleanTitle,
    description: cleanDesc,
    fullSpokenText,
    totalDuration,
    phrases,
    allWords,
  };
}

export interface AudioTimingMeta {
  totalDuration: number;
  titleDuration: number;
  pauseDuration: number;
  descDuration: number;
  words?: SpokenWordToken[];
  phrases?: SpokenPhraseChunk[];
}

// Active narration playback controller
class VoiceNarrationController {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private serverAudio: HTMLAudioElement | null = null;
  private serverAudioUrl: string | null = null;
  private serverAudioBuffer: ArrayBuffer | null = null;
  private cachedKey: string | null = null;
  private timingMeta: AudioTimingMeta | null = null;
  private animFrameId: number | null = null;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private activeScript: NarrationScript | null = null;
  private onTimeUpdateCallback: ((currentTime: number, activePhrase: SpokenPhraseChunk | null, activeWord: SpokenWordToken | null) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isAudioUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.getVoices();
      };
    }
  }

  public unlockAudio() {
    this.isAudioUnlocked = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
      } catch (e) {}
    }
  }

  public clearCache() {
    if (this.serverAudioUrl) {
      try {
        URL.revokeObjectURL(this.serverAudioUrl);
      } catch {}
    }
    this.serverAudioUrl = null;
    this.serverAudioBuffer = null;
    this.cachedKey = null;
    this.timingMeta = null;
  }

  public getTimingMeta(): AudioTimingMeta | null {
    return this.timingMeta;
  }

  public setTimingMeta(meta: AudioTimingMeta | null) {
    this.timingMeta = meta;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }

  public findBestVoice(preferredGender: 'male' | 'female' = 'male', language: 'english' | 'hindi' = 'english'): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (!voices || voices.length === 0) return null;

    const langPrefix = language === 'hindi' ? 'hi' : 'en';
    const filteredByLang = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));

    const searchTerms = preferredGender === 'female'
      ? ['hindi', 'hi-in', 'en-in', 'zira', 'samantha', 'karen', 'victoria', 'natural', 'female', 'google']
      : ['hindi', 'hi-in', 'en-in', 'david', 'george', 'alex', 'daniel', 'natural', 'male', 'google'];

    if (filteredByLang.length > 0) {
      for (const term of searchTerms) {
        const match = filteredByLang.find(v =>
          v.name.toLowerCase().includes(term) ||
          (v.lang && v.lang.toLowerCase().includes(term))
        );
        if (match) return match;
      }
      return filteredByLang[0];
    }

    for (const term of searchTerms) {
      const match = voices.find(v =>
        v.name.toLowerCase().includes(term) ||
        (v.lang && v.lang.toLowerCase().includes(term))
      );
      if (match) return match;
    }

    const enVoice = voices.find(v => v.lang && v.lang.startsWith('en'));
    return enVoice || voices[0];
  }

  public setVoice(voice: SpeechSynthesisVoice | null) {
    this.selectedVoice = voice;
  }

  // Pre-fetch high-quality broadcast anchor speech with timing metadata
  public async prepareBroadcastVoice(
    title: string,
    description: string,
    voiceGender: 'male' | 'female' = 'male',
    language?: 'english' | 'hindi'
  ): Promise<string | null> {
    try {
      const isHi = language === 'hindi' || (/[\u0900-\u097F]/.test(title + ' ' + description));
      const targetLang = isHi ? 'hindi' : (language || 'english');
      const cleanTitle = (title || '').trim();
      const cleanDesc = (description || '').trim();
      const requestKey = `${cleanTitle}:::${cleanDesc}:::${voiceGender}:::${targetLang}`;

      // If already cached for this exact key, return existing URL
      if (this.cachedKey === requestKey && this.serverAudioUrl && this.serverAudioBuffer) {
        return this.serverAudioUrl;
      }

      this.clearCache();

      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle, description: cleanDesc, voiceGender, language: targetLang }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        this.serverAudioBuffer = bytes.buffer;
        this.cachedKey = requestKey;

        if (data.totalDuration && data.totalDuration > 0) {
          this.timingMeta = {
            totalDuration: data.totalDuration,
            titleDuration: data.titleDuration || 0,
            pauseDuration: data.pauseDuration || 0.35,
            descDuration: data.descDuration || 0,
            words: data.words,
            phrases: data.phrases,
          };
        }

        const blob = new Blob([bytes], { type: data.mimeType || 'audio/mpeg' });
        this.serverAudioUrl = URL.createObjectURL(blob);
        return this.serverAudioUrl;
      }
      }
    } catch (e) {
      console.warn('Could not fetch broadcast speech audio:', e);
    }
    return null;
  }

  public getServerAudioUrl(): string | null {
    return this.serverAudioUrl;
  }

  public getCachedKey(): string | null {
    return this.cachedKey;
  }

  public getServerAudioBuffer(expectedTitle?: string, expectedDesc?: string): ArrayBuffer | null {
    if (this.serverAudioBuffer && this.cachedKey) {
      if (expectedTitle !== undefined) {
        const cleanExpectedTitle = (expectedTitle || '').trim();
        const cleanExpectedDesc = (expectedDesc || '').trim();
        const expectedPrefix = `${cleanExpectedTitle}:::${cleanExpectedDesc}:::`;
        if (!this.cachedKey.startsWith(expectedPrefix)) {
          return null;
        }
      }
      return this.serverAudioBuffer;
    }
    return null;
  }

  public storeBufferDirectly(buf: ArrayBuffer, key: string, timing?: AudioTimingMeta) {
    this.serverAudioBuffer = buf;
    this.cachedKey = key;
    if (timing) this.timingMeta = timing;
    try {
      if (this.serverAudioUrl) URL.revokeObjectURL(this.serverAudioUrl);
      const blob = new Blob([buf], { type: 'audio/mpeg' });
      this.serverAudioUrl = URL.createObjectURL(blob);
    } catch {}
  }

  public start(
    script: NarrationScript,
    speechRate: number = 1.0,
    onTimeUpdate: (currentTime: number, activePhrase: SpokenPhraseChunk | null, activeWord: SpokenWordToken | null) => void,
    onEnd: () => void,
    voiceGender: 'male' | 'female' = 'male',
    language: 'english' | 'hindi' = 'english'
  ) {
    this.stop();

    // Re-align script if timing metadata is available
    let effectiveScript = script;
    if (this.timingMeta && this.timingMeta.totalDuration > 0) {
      effectiveScript = alignNarrationScript(
        script,
        this.timingMeta.totalDuration,
        this.timingMeta.titleDuration,
        this.timingMeta.pauseDuration,
        this.timingMeta.descDuration
      );
    }

    this.activeScript = effectiveScript;
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndCallback = onEnd;
    this.isSpeaking = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.pausedAt = 0;

    const isHi = language === 'hindi' || (/[\u0900-\u097F]/.test(effectiveScript.fullSpokenText));
    const effectiveLang = isHi ? 'hindi' : (language || 'english');

    // OPTION A: Pre-rendered Broadcast audio
    if (this.serverAudioUrl) {
      const audio = new Audio(this.serverAudioUrl);
      audio.volume = 1.0;
      audio.playbackRate = Math.max(0.7, Math.min(2.0, speechRate));
      this.serverAudio = audio;

      audio.onended = () => {
        this.isSpeaking = false;
        this.cancelLoop();
        if (this.onEndCallback) this.onEndCallback();
      };

      audio.onerror = () => {
        console.warn('Server audio playback failed, falling back to Web Speech API');
        this.serverAudio = null;
        this.startBrowserSpeech(effectiveScript, speechRate, voiceGender, effectiveLang);
      };

      audio.play().then(() => {
        this.startRAFSyncLoop(effectiveScript, speechRate, audio);
      }).catch((playErr) => {
        console.warn('Audio play autoplay policy blocked:', playErr);
        this.startBrowserSpeech(effectiveScript, speechRate, voiceGender, effectiveLang);
      });
      return;
    }

    // OPTION B: Web Speech API
    this.startBrowserSpeech(effectiveScript, speechRate, voiceGender, effectiveLang);
  }

  private startBrowserSpeech(
    script: NarrationScript,
    speechRate: number,
    voiceGender: 'male' | 'female',
    language: 'english' | 'hindi'
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.startClockOnly(script, speechRate);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) {}

    const textToSpeak = script.fullSpokenText;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = Math.max(0.75, Math.min(1.8, speechRate));
    utterance.pitch = voiceGender === 'female' ? 1.05 : 0.95;
    utterance.volume = 1.0;

    const isHi = language === 'hindi' || (/[\u0900-\u097F]/.test(textToSpeak));
    const effectiveLang = isHi ? 'hindi' : 'english';
    const voice = this.selectedVoice || this.findBestVoice(voiceGender, effectiveLang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || (isHi ? 'hi-IN' : 'en-US');
    }

    this.currentUtterance = utterance;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.cancelLoop();
      if (this.onEndCallback) this.onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis event error:', e);
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        this.isSpeaking = false;
        this.cancelLoop();
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (speakErr) {
      console.warn('Failed to call window.speechSynthesis.speak:', speakErr);
    }

    this.startRAFSyncLoop(script, speechRate);
  }

  private startClockOnly(script: NarrationScript, speechRate: number) {
    this.isSpeaking = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.pausedAt = 0;
    this.startRAFSyncLoop(script, speechRate);
  }

  private startRAFSyncLoop(script: NarrationScript, speechRate: number = 1.0, audioEl?: HTMLAudioElement) {
    const loop = () => {
      if (!this.isSpeaking) return;

      if (!this.isPaused) {
        let elapsedSec: number;
        let searchTime: number;

        if (audioEl && !isNaN(audioEl.currentTime)) {
          elapsedSec = audioEl.currentTime;
          // Audio element currentTime directly matches the calibrated word timeline
          searchTime = elapsedSec;
        } else {
          elapsedSec = (performance.now() - this.startTime) / 1000;
          searchTime = elapsedSec * speechRate;
        }

        // Find active word and active phrase
        const activeWord = script.allWords.find(w => searchTime >= w.startTime && searchTime < w.endTime) || null;
        let activePhrase = script.phrases.find(p => searchTime >= p.startTime && searchTime < p.endTime);
        if (!activePhrase) {
          activePhrase = searchTime >= script.totalDuration
            ? script.phrases[script.phrases.length - 1]
            : script.phrases[0];
        }

        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(elapsedSec, activePhrase || null, activeWord);
        }

        const maxDuration = audioEl?.duration
          ? audioEl.duration
          : (script.totalDuration / speechRate) + 0.35;

        if (elapsedSec >= maxDuration) {
          this.isSpeaking = false;
          if (this.onEndCallback) this.onEndCallback();
          return;
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public pause() {
    if (!this.isSpeaking || this.isPaused) return;
    this.isPaused = true;
    this.pausedAt = performance.now();
    if (this.serverAudio) {
      this.serverAudio.pause();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.pause();
      } catch (e) {}
    }
  }

  public resume() {
    if (!this.isSpeaking || !this.isPaused) return;
    this.isPaused = false;
    const pausedDuration = performance.now() - this.pausedAt;
    this.startTime += pausedDuration;
    if (this.serverAudio) {
      this.serverAudio.play().catch(() => {});
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
      } catch (e) {}
    }
  }

  public stop() {
    this.isSpeaking = false;
    this.isPaused = false;
    this.cancelLoop();
    if (this.serverAudio) {
      this.serverAudio.pause();
      this.serverAudio.currentTime = 0;
      this.serverAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.currentUtterance = null;
  }

  private cancelLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking && !this.isPaused;
  }

  public isCurrentlyPaused(): boolean {
    return this.isPaused;
  }
}

export const voiceNarrator = new VoiceNarrationController();

// Synthesizes a vocal narration AudioBuffer for mixing into exported Reel video
export async function getNarrationAudioBuffer(
  audioCtx: AudioContext,
  script: NarrationScript,
  voiceGender: 'male' | 'female' = 'male',
  language?: 'english' | 'hindi'
): Promise<AudioBuffer | null> {
  const isHi = language === 'hindi' || (/[\u0900-\u097F]/.test(script.fullSpokenText));
  const effectiveLang = isHi ? 'hindi' : (language || 'english');

  // 1. If server buffer is cached and matches this story, decode and return it
  const cachedBuf = voiceNarrator.getServerAudioBuffer(script.title, script.description);
  if (cachedBuf) {
    try {
      return await audioCtx.decodeAudioData(cachedBuf.slice(0));
    } catch (e) {
      console.warn('Could not decode cached server audio:', e);
    }
  }

  // 2. Fetch fresh real spoken MP3 audio from /api/voice/speak
  try {
    const res = await fetch('/api/voice/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: script.title,
        description: script.description,
        voiceGender,
        language: effectiveLang,
      }),
    });
    if (res.ok) {
      try {
        const data = await res.json();
        if (data?.success && data?.audioBase64) {
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const timing = data.totalDuration ? {
            totalDuration: data.totalDuration,
            titleDuration: data.titleDuration || 0,
            pauseDuration: data.pauseDuration || 0.35,
            descDuration: data.descDuration || 0,
            words: data.words,
            phrases: data.phrases,
          } : undefined;
          voiceNarrator.storeBufferDirectly(
            bytes.buffer,
            `${script.title}:::${script.description}:::${voiceGender}:::${effectiveLang}`,
            timing
          );
          return await audioCtx.decodeAudioData(bytes.buffer.slice(0));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Could not generate server audio on export:', err);
  }

  // 3. Fallback: Create clean minimal audio buffer to prevent export crash
  try {
    const sampleRate = audioCtx.sampleRate;
    const duration = Math.max(3, script.totalDuration);
    return audioCtx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  } catch {
    return null;
  }
}
