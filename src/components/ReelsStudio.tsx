import React, { useState, useEffect, useRef } from 'react';
import { TrendingNewsItem, ReelProgressState, ReelProgressStep } from '../types';
import { StepProgressBarModal } from './StepProgressBarModal';
import { NEWS_BACKGROUNDS } from '../data/backgrounds';
import { FALLBACK_TRENDING_NEWS } from '../data/fallbackNews';
import { PRESET_BACKGROUND_VIDEOS } from '../data/backgroundVideos';
import type { NewsTrackType } from '../utils/newsAudioSynth';
import { exportReelVideo, downloadReelBlob, getSupportedVideoMimeType } from '../utils/reelVideoExporter';
import {
  voiceNarrator,
  buildNarrationScript,
  alignNarrationScript,
  NarrationScript,
  SpokenPhraseChunk,
  SpokenWordToken,
  ReelCaptionEffect,
  REEL_CAPTION_EFFECTS,
} from '../utils/newsVoiceNarrator';
import { ReelDynamicCaptionOverlay } from './ReelDynamicCaptionOverlay';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Download,
  Film,
  Video,
  Upload,
  Trash2,
  Save,
  Radio,
  Loader2,
  Share2,
  Heart,
  MessageCircle,
  FileAudio,
  FileVideo,
  AlertCircle,
  CheckCircle2,
  Mic,
  RotateCcw,
  Sparkles,
  Sliders,
  Copy,
  Check,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';

interface ReelsStudioProps {
  activeItem: TrendingNewsItem | null;
  userHandle: string;
  feedItems?: TrendingNewsItem[];
  onSelectOtherItem?: (item: TrendingNewsItem) => void;
  onClose?: () => void;
}

const LOCAL_STORAGE_REEL_SETTINGS = 'viralnews_reels_saved_settings';

export const INITIAL_REEL_STEPS: ReelProgressStep[] = [
  {
    id: 1,
    title: 'Script & News Structure',
    titleHi: 'स्क्रिप्ट और डेटा तैयारी',
    detail: 'Parsing headline, summary and structuring narration phrases...',
    detailHi: 'न्यूज़ हेडलाइन, सारांश और वाक्यों का विश्लेषण...',
    status: 'pending',
  },
  {
    id: 2,
    title: 'AI Voiceover & Audio Mastering',
    titleHi: 'AI आवाज़ और ऑडियो टाइमिंग',
    detail: 'Synthesizing broadcast audio & determining ground-truth duration...',
    detailHi: 'AI ब्रॉडकास्ट आवाज़ तैयार और टाइमिंग मापी जा रही है...',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Visual Media & Layout Setup',
    titleHi: 'मीडिया और बैकग्राउंड विज़ुअल्स',
    detail: 'Loading 9:16 background visual assets & live phone preview layers...',
    detailHi: '9:16 वर्टिकल बैकग्राउंड मीडिया और लाइव प्रीव्यू लोड...',
    status: 'pending',
  },
  {
    id: 4,
    title: 'Caption & Subtitles Alignment',
    titleHi: 'कैप्शन और सबटाइटल अलाइनमेंट',
    detail: 'Locking word-by-word timestamps to exact audio duration without drift...',
    detailHi: 'एक-एक शब्द की टाइमिंग को ऑडियो से लॉक किया जा रहा है...',
    status: 'pending',
  },
  {
    id: 5,
    title: '9:16 Reel Video Recording',
    titleHi: 'रील वीडियो फ्रेम्स रिकॉर्डिंग',
    detail: 'Rendering animated kinetic typography & news tickers in real-time...',
    detailHi: 'काइनेटिक टाइपोग्राफी और न्यूज़ टिकर के साथ फ़्रेम रिकॉर्डिंग...',
    status: 'pending',
  },
  {
    id: 6,
    title: 'Video Packaging & MP4 Export',
    titleHi: 'फ़ाइनल वीडियो एनकोडिंग और डाउनलोड',
    detail: 'Finalizing MP4 media streams and preparing download file...',
    detailHi: 'ऑडियो और वीडियो ट्रैक्स को मिलाकर MP4 फ़ाइल बनाई जा रही है...',
    status: 'pending',
  },
];

export const ReelsStudio: React.FC<ReelsStudioProps> = ({
  activeItem,
  userHandle: propUserHandle,
  feedItems = [],
  onSelectOtherItem,
  onClose,
}) => {
  // Load Saved Reel Post Settings from localStorage
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_REEL_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load reel settings:', e);
    }
    return null;
  };

  const initialSettings = loadSavedSettings();

  // If no active item, check saved draft, then live feed; NEVER force dummy mock news!
  const item: TrendingNewsItem = activeItem || (initialSettings?.spokenTitle ? {
    id: initialSettings.id || 'draft-reel',
    headline: initialSettings.spokenTitle,
    summary: initialSettings.spokenDescription || '',
    fullDescription: initialSettings.spokenDescription || '',
    trendingScore: 100,
    keywords: [],
    sourceWebsite: 'Live Wire',
    publishedTimeAgo: 'Just now',
    formattedDateTime: 'Live',
    country: 'Global',
    category: 'general',
    badge: '🚨 BREAKING NEWS',
    verification: {
      isVerified: true,
      credibilityScore: 100,
      status: 'VERIFIED_REAL_NEWS',
      matchedSourcesCount: 1,
      sources: [],
      factCheckSummary: 'Verified report',
    },
  } : feedItems[0] || {
    id: 'custom-reel',
    headline: '',
    summary: '',
    fullDescription: '',
    trendingScore: 100,
    keywords: [],
    sourceWebsite: 'Live Wire',
    publishedTimeAgo: 'Live',
    formattedDateTime: 'Live',
    country: 'Global',
    category: 'general',
    badge: '🚨 BREAKING NEWS',
    verification: {
      isVerified: true,
      credibilityScore: 100,
      status: 'VERIFIED_REAL_NEWS',
      matchedSourcesCount: 1,
      sources: [],
      factCheckSummary: 'Verified report',
    },
  });

  // Reels Configuration & Channel
  const [userHandle, setUserHandle] = useState<string>(
    initialSettings?.userHandle || propUserHandle || '@NewsLiveOfficial'
  );
  const [showWatermark, setShowWatermark] = useState<boolean>(
    initialSettings?.showWatermark !== false
  );
  const [showSocialMockup, setShowSocialMockup] = useState<boolean>(false);
  const [settingsSavedBadge, setSettingsSavedBadge] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'script' | 'captions' | 'media' | 'audio'>('script');

  // Spoken Script & Narration States (Title First, Full Description Second) - No Default Dummy Text
  const [spokenTitle, setSpokenTitle] = useState<string>(() => {
    if (activeItem?.headline) return activeItem.headline;
    if (initialSettings?.spokenTitle !== undefined) return initialSettings.spokenTitle;
    if (feedItems[0]?.headline) return feedItems[0].headline;
    return '';
  });
  const [spokenDescription, setSpokenDescription] = useState<string>(() => {
    if (activeItem?.fullDescription || activeItem?.summary) return activeItem.fullDescription || activeItem.summary || '';
    if (initialSettings?.spokenDescription !== undefined) return initialSettings.spokenDescription;
    if (feedItems[0]?.fullDescription || feedItems[0]?.summary) return feedItems[0].fullDescription || feedItems[0].summary || '';
    return '';
  });
  const [speechRate, setSpeechRate] = useState<number>(initialSettings?.speechRate || 1.0);
  const [captionEffect, setCaptionEffect] = useState<ReelCaptionEffect>(
    initialSettings?.captionEffect || 'hormozi_pop'
  );
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(
    initialSettings?.voiceGender || 'male'
  );
  const [duckMusic, setDuckMusic] = useState<boolean>(
    initialSettings?.duckMusic !== false
  );
  const [musicMuted, setMusicMuted] = useState<boolean>(
    initialSettings?.musicMuted !== undefined ? initialSettings.musicMuted : true
  );

  // Narration Script & Sync Engine
  const [narrationScript, setNarrationScript] = useState<NarrationScript>(() =>
    buildNarrationScript(
      item.headline || 'Breaking News Report',
      item.fullDescription || item.summary || 'Ground correspondents confirm major live developments.',
      1.0
    )
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentNarrationTime, setCurrentNarrationTime] = useState<number>(0);
  const [activePhrase, setActivePhrase] = useState<SpokenPhraseChunk | null>(null);
  const [activeWord, setActiveWord] = useState<SpokenWordToken | null>(null);

  // Background Visuals & Motion
  const [bgImage, setBgImage] = useState<string>(
    item.imageSuggestion ||
      item.autoPoster?.bgImageUrl ||
      NEWS_BACKGROUNDS[0].url
  );
  const [bgVideoUrl, setBgVideoUrl] = useState<string | null>(initialSettings?.bgVideoUrl || null);
  const [bgVideoName, setBgVideoName] = useState<string>(initialSettings?.bgVideoName || '');
  const [kenBurnsMotion, setKenBurnsMotion] = useState<boolean>(
    initialSettings?.kenBurnsMotion ?? true
  );
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(
    initialSettings?.fontSize || 'md'
  );
  const [colorTheme, setColorTheme] = useState<
    'red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire'
  >(initialSettings?.colorTheme || 'red_dark');

  // Custom Uploaded Music & Audio States (All default music disabled)
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [selectedTrack, setSelectedTrack] = useState<NewsTrackType>(
    initialSettings?.selectedTrack || 'breaking_pulse'
  );
  const [volume, setVolume] = useState<number>(initialSettings?.volume ?? 1.0); // 100% Volume default
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>('');
  const [uploadedMusicVolume, setUploadedMusicVolume] = useState<number>(0.35); // 35% background volume for uploaded music
  const customAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Refs & Export States
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [customImageName, setCustomImageName] = useState<string>('');
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [audioMeter, setAudioMeter] = useState<number[]>([15, 25, 40, 60, 45, 30, 20]);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [videoExportPct, setVideoExportPct] = useState<number>(0);
  const [videoExportStatus, setVideoExportStatus] = useState<string>('');
  const [exportError, setExportError] = useState<string | null>(null);

  // Step-by-Step Reel Progress Modal State (सब कुछ एक साथ नहीं, क्रमबद्ध स्टेप्स)
  const [progressModalState, setProgressModalState] = useState<ReelProgressState>({
    isVisible: false,
    percentage: 0,
    currentStepId: 1,
    statusText: '',
    statusTextHi: '',
    headline: item.headline || '',
    steps: INITIAL_REEL_STEPS,
    logs: [],
    isComplete: false,
    error: null,
  });

  // Spoken voice preparation & Drafts persistence states
  const [isPreparingVoice, setIsPreparingVoice] = useState<boolean>(false);
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [manualSaveFeedback, setManualSaveFeedback] = useState<string | null>(null);

  // Voice Language accent mode (Hindi or English news voice)
  const [currentLanguage, setCurrentLanguage] = useState<'english' | 'hindi'>('english');
  const [detectFeedback, setDetectFeedback] = useState<string | null>(null);

  const buildCurrentPayload = (override?: Partial<any>) => ({
    id: item.id || `reel-${Date.now()}`,
    spokenTitle,
    spokenDescription,
    selectedTrack,
    volume,
    kenBurnsMotion,
    fontSize,
    colorTheme,
    captionEffect,
    speechRate,
    voiceGender,
    duckMusic,
    musicMuted,
    showWatermark,
    bgVideoUrl: bgVideoUrl || undefined,
    bgVideoName,
    bgImageUrl: bgImage,
    userHandle,
    currentLanguage,
    ...override,
    updatedAt: new Date().toISOString(),
  });

  // Save Settings to localStorage & return payload
  const saveReelSettingsToStorage = (override?: Partial<any>) => {
    try {
      const configToSave = buildCurrentPayload(override);
      localStorage.setItem(LOCAL_STORAGE_REEL_SETTINGS, JSON.stringify(configToSave));
      setSettingsSavedBadge(true);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(timeStr);
      setTimeout(() => setSettingsSavedBadge(false), 2500);
      return configToSave;
    } catch (err) {
      console.warn('Failed to save reel settings:', err);
      return null;
    }
  };

  // Full Auto-Save: Persists to localStorage AND backend server API
  const autoSaveAllData = async (override?: Partial<any>) => {
    setIsAutoSaving(true);
    const payload = saveReelSettingsToStorage(override);
    if (!payload) {
      setIsAutoSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/reels/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.success && data?.reels) {
        setSavedDrafts(data.reels);
      }
    } catch (e) {
      console.warn('Auto-save server sync warning:', e);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Manual 1-Click Save Data Button
  const handleManualSave = async () => {
    setIsSavingDraft(true);
    await autoSaveAllData();
    setIsSavingDraft(false);
    setManualSaveFeedback('✅ सारा डेटा सुरक्षित हो गया! All Reel Data & Settings Saved Successfully.');
    setTimeout(() => setManualSaveFeedback(null), 3500);
  };

  const applyReelItem = (targetItem: TrendingNewsItem) => {
    const newTitle = targetItem.headline || 'Breaking News Report';
    const newDesc = targetItem.fullDescription || targetItem.summary || 'Ground correspondents confirm major live developments.';
    setSpokenTitle(newTitle);
    setSpokenDescription(newDesc);
    // CRITICAL BUG FIX: Clear old video loop so new story's visual is active!
    setBgVideoUrl(null);
    setBgVideoName('');
    voiceNarrator.clearCache(); // Invalidate old audio buffer
    const newBg = targetItem.imageSuggestion || targetItem.autoPoster?.bgImageUrl || NEWS_BACKGROUNDS[0].url;
    setBgImage(newBg);
    const script = buildNarrationScript(newTitle, newDesc, speechRate);
    setNarrationScript(script);
    setCurrentNarrationTime(0);
    setActivePhrase(script.phrases[0] || null);
    setActiveWord(script.allWords[0] || null);
    setDetectFeedback(`ताज़ा खबर सेट: ${newTitle.slice(0, 36)}...`);
    setTimeout(() => setDetectFeedback(null), 3500);

    // Immediately auto-save this new story so export has fresh data
    autoSaveAllData({
      id: targetItem.id,
      spokenTitle: newTitle,
      spokenDescription: newDesc,
      bgVideoUrl: undefined,
      bgVideoName: '',
      bgImageUrl: newBg,
    });

    setTimeout(() => {
      startNarrationWithScript(script);
    }, 300);
  };

  const handleAutoDetectLatestReel = async () => {
    if (feedItems && feedItems.length > 0) {
      const target = feedItems[0];
      if (onSelectOtherItem) onSelectOtherItem(target);
      applyReelItem(target);
      return;
    }
    try {
      const res = await fetch('/api/news/trending?category=all&country=IN&limit=5');
      if (res.ok) {
        const data = await res.json();
        if (data.news && data.news.length > 0) {
          if (onSelectOtherItem) onSelectOtherItem(data.news[0]);
          applyReelItem(data.news[0]);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to auto-detect reel news, using fallback:', e);
    }
    if (FALLBACK_TRENDING_NEWS && FALLBACK_TRENDING_NEWS.length > 0) {
      if (onSelectOtherItem) onSelectOtherItem(FALLBACK_TRENDING_NEWS[0]);
      applyReelItem(FALLBACK_TRENDING_NEWS[0]);
    }
  };

  const handleLanguageChange = (lang: 'english' | 'hindi') => {
    setCurrentLanguage(lang);
    voiceNarrator.clearCache();
  };

  // Fetch saved drafts from server on mount
  useEffect(() => {
    fetchSavedDrafts();
  }, []);

  const fetchSavedDrafts = async () => {
    try {
      const res = await fetch('/api/reels/saved');
      const data = await res.json();
      if (data.reels) {
        setSavedDrafts(data.reels);
      }
    } catch (e) {
      console.warn('Failed to load saved reels drafts from server:', e);
    }
  };

  const handleSaveProjectToServer = async () => {
    await handleManualSave();
  };

  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/reels/saved/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.reels) {
        setSavedDrafts(data.reels);
        setManualSaveFeedback('ड्राफ्ट हटा दिया गया। Draft deleted.');
        setTimeout(() => setManualSaveFeedback(null), 2500);
      }
    } catch (e) {
      console.warn('Failed to delete draft:', e);
    }
  };

  const handleLoadDraft = (draft: any) => {
    if (draft.spokenTitle) setSpokenTitle(draft.spokenTitle);
    if (draft.spokenDescription) setSpokenDescription(draft.spokenDescription);
    if (draft.selectedTrack) setSelectedTrack(draft.selectedTrack);
    if (draft.volume !== undefined) setVolume(draft.volume);
    if (draft.kenBurnsMotion !== undefined) setKenBurnsMotion(draft.kenBurnsMotion);
    if (draft.fontSize) setFontSize(draft.fontSize);
    if (draft.colorTheme) setColorTheme(draft.colorTheme);
    if (draft.captionEffect) setCaptionEffect(draft.captionEffect);
    if (draft.speechRate !== undefined) setSpeechRate(draft.speechRate);
    if (draft.voiceGender) setVoiceGender(draft.voiceGender);
    if (draft.duckMusic !== undefined) setDuckMusic(draft.duckMusic);
    if (draft.musicMuted !== undefined) setMusicMuted(draft.musicMuted);
    if (draft.showWatermark !== undefined) setShowWatermark(draft.showWatermark);
    if (draft.bgVideoUrl) setBgVideoUrl(draft.bgVideoUrl);
    else setBgVideoUrl(null);
    if (draft.bgVideoName) setBgVideoName(draft.bgVideoName);
    else setBgVideoName('');
    if (draft.bgImageUrl) setBgImage(draft.bgImageUrl);
    if (draft.userHandle) setUserHandle(draft.userHandle);

    voiceNarrator.clearCache();
    setManualSaveFeedback('ड्राफ्ट सफलतापूर्वक लोड किया गया! Draft Project restored successfully.');
    setTimeout(() => setManualSaveFeedback(null), 3000);
  };

  // Debounced server broadcast voice preparation when text or parameters change
  useEffect(() => {
    let active = true;
    voiceNarrator.clearCache(); // invalidate old voice immediately on edit
    const timer = setTimeout(async () => {
      if (!spokenTitle || !spokenDescription) return;
      setIsPreparingVoice(true);
      try {
        await voiceNarrator.prepareBroadcastVoice(spokenTitle, spokenDescription, voiceGender, currentLanguage);
        const meta = voiceNarrator.getTimingMeta();
        if (meta && meta.totalDuration > 0) {
          setNarrationScript((prev) =>
            alignNarrationScript(
              prev,
              meta.totalDuration,
              meta.titleDuration,
              meta.pauseDuration || 0.35,
              meta.descDuration
            )
          );
        }
      } catch (e) {
        console.warn('Failed to prepare broadcast voice:', e);
      } finally {
        if (active) {
          setIsPreparingVoice(false);
        }
      }
    }, 400); // 400ms debounce

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [spokenTitle, spokenDescription, voiceGender, currentLanguage]);

  // Rebuild script when spoken text or speechRate changes
  useEffect(() => {
    const script = buildNarrationScript(spokenTitle, spokenDescription, speechRate);
    setNarrationScript(script);
    if (!isSpeaking) {
      setActivePhrase(script.phrases[0] || null);
      setActiveWord(script.allWords[0] || null);
    }
  }, [spokenTitle, spokenDescription, speechRate]);

  // Active Item ID tracking to prevent stomping user-typed text
  const prevItemIdRef = useRef<string | null>(item?.id || null);

  // When active item changes to a DIFFERENT news story: update script and visuals
  useEffect(() => {
    if (item && item.id && item.id !== prevItemIdRef.current) {
      prevItemIdRef.current = item.id;
      if (item.headline || item.fullDescription || item.summary) {
        const newTitle = item.headline || '';
        const newDesc = item.fullDescription || item.summary || '';
        setSpokenTitle(newTitle);
        setSpokenDescription(newDesc);

        const script = buildNarrationScript(newTitle, newDesc, speechRate);
        setNarrationScript(script);
        setCurrentNarrationTime(0);
        setActivePhrase(script.phrases[0] || null);
        setActiveWord(script.allWords[0] || null);

        voiceNarrator.clearCache();

        // Clear previous video so new story visual is active
        setBgVideoUrl(null);
        setBgVideoName('');

        const newBg = item.imageSuggestion || item.autoPoster?.bgImageUrl || NEWS_BACKGROUNDS[0].url;
        setBgImage(newBg);

        // Immediately auto-save
        autoSaveAllData({
          id: item.id,
          spokenTitle: newTitle,
          spokenDescription: newDesc,
          bgImageUrl: newBg,
          bgVideoUrl: undefined,
          bgVideoName: '',
        });
      }
    }
  }, [item?.id]);

  // Reactive Debounced Auto-Save on ANY content or setting changes
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSaveAllData();
    }, 600);
    return () => clearTimeout(timer);
  }, [
    spokenTitle,
    spokenDescription,
    bgVideoUrl,
    bgImage,
    userHandle,
    selectedTrack,
    volume,
    kenBurnsMotion,
    fontSize,
    colorTheme,
    captionEffect,
    speechRate,
    voiceGender,
    duckMusic,
    musicMuted,
    currentLanguage,
  ]);

  // Audio Equalizer Meter Animation
  useEffect(() => {
    let animId: any;
    const updateMeter = () => {
      if (isSpeaking || isPlayingMusic) {
        setAudioMeter([
          Math.floor(Math.random() * 80) + 20,
          Math.floor(Math.random() * 95) + 15,
          Math.floor(Math.random() * 85) + 25,
          Math.floor(Math.random() * 100) + 30,
          Math.floor(Math.random() * 90) + 20,
          Math.floor(Math.random() * 75) + 15,
          Math.floor(Math.random() * 60) + 10,
        ]);
      } else {
        setAudioMeter([15, 20, 25, 30, 25, 20, 15]);
      }
      animId = requestAnimationFrame(updateMeter);
    };
    animId = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(animId);
  }, [isSpeaking, isPlayingMusic]);

  // Start Narration
  const startNarrationWithScript = async (scriptToUse: NarrationScript) => {
    // If uploaded music is playing and duckMusic is enabled, duck custom audio volume
    if (isPlayingMusic && customAudioUrl && !musicMuted && customAudioPlayerRef.current) {
      customAudioPlayerRef.current.volume = duckMusic ? 0.15 : uploadedMusicVolume;
    }

    // Ensure broadcast voice audio is prepared for the exact edited spoken text
    const isHi = currentLanguage === 'hindi' || /[\u0900-\u097F]/.test(spokenTitle + ' ' + spokenDescription);
    const targetLang = isHi ? 'hindi' : currentLanguage;
    const expectedKey = `${(spokenTitle || '').trim()}:::${(spokenDescription || '').trim()}:::${voiceGender}:::${targetLang}`;

    if (voiceNarrator.getCachedKey() !== expectedKey && spokenTitle && spokenDescription) {
      setIsPreparingVoice(true);
      try {
        await voiceNarrator.prepareBroadcastVoice(spokenTitle, spokenDescription, voiceGender, currentLanguage);
      } catch (e) {
        console.warn('Voice prep on play failed:', e);
      } finally {
        setIsPreparingVoice(false);
      }
    }

    voiceNarrator.start(
      scriptToUse,
      speechRate,
      (time, phrase, word) => {
        setCurrentNarrationTime(time);
        setActivePhrase(phrase);
        setActiveWord(word);
      },
      () => {
        setIsSpeaking(false);
        if (isPlayingMusic && customAudioUrl && !musicMuted && customAudioPlayerRef.current) {
          customAudioPlayerRef.current.volume = uploadedMusicVolume;
        }
      },
      voiceGender,
      currentLanguage
    );
    setIsSpeaking(true);
  };

  const handleToggleNarration = () => {
    if (isSpeaking) {
      voiceNarrator.pause();
      setIsSpeaking(false);
    } else {
      if (voiceNarrator.isCurrentlyPaused()) {
        voiceNarrator.resume();
        setIsSpeaking(true);
      } else {
        startNarrationWithScript(narrationScript);
      }
    }
  };

  const handleReplayNarration = () => {
    voiceNarrator.stop();
    setCurrentNarrationTime(0);
    startNarrationWithScript(narrationScript);
  };

  // Custom Uploaded Audio Toggle (All default music removed)
  const toggleMusic = () => {
    if (customAudioUrl) {
      if (!customAudioPlayerRef.current) return;
      if (isPlayingMusic) {
        customAudioPlayerRef.current.pause();
        setIsPlayingMusic(false);
      } else {
        setMusicMuted(false);
        customAudioPlayerRef.current.volume = isSpeaking && duckMusic ? 0.15 : uploadedMusicVolume;
        customAudioPlayerRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
      }
    } else {
      // If no custom audio, prompt user to pick their audio file
      audioFileInputRef.current?.click();
    }
  };

  // Custom Audio File Upload
  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    setCustomAudioUrl(audioUrl);
    setCustomAudioName(file.name);
    setMusicMuted(false);

    setTimeout(() => {
      if (customAudioPlayerRef.current) {
        customAudioPlayerRef.current.volume = isSpeaking && duckMusic ? 0.15 : uploadedMusicVolume;
        customAudioPlayerRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
      }
    }, 100);
  };

  const handleRemoveCustomAudio = () => {
    if (customAudioPlayerRef.current) {
      customAudioPlayerRef.current.pause();
    }
    setCustomAudioUrl(null);
    setCustomAudioName('');
    setIsPlayingMusic(false);
    setMusicMuted(true);
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = '';
    }
  };

  // Custom Background Image File Upload
  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setBgImage(dataUrl);
        setCustomImageName(file.name);
        // Clear active video so uploaded image immediately becomes the active reel background
        setBgVideoUrl(null);
        setBgVideoName('');
        saveReelSettingsToStorage({ bgImageUrl: dataUrl, bgVideoUrl: undefined, bgVideoName: '' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomImage = () => {
    setCustomImageName('');
    const fallbackImage = item.imageSuggestion || item.autoPoster?.bgImageUrl || NEWS_BACKGROUNDS[0].url;
    setBgImage(fallbackImage);
    saveReelSettingsToStorage({ bgImageUrl: fallbackImage });
  };

  // Video File Upload
  const handleCustomVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const videoUrl = URL.createObjectURL(file);
    setBgVideoUrl(videoUrl);
    setBgVideoName(file.name);
    saveReelSettingsToStorage({ bgVideoUrl: videoUrl, bgVideoName: file.name });
  };

  const handleSelectPresetVideo = (presetUrl: string, presetName: string) => {
    setBgVideoUrl(presetUrl);
    setBgVideoName(presetName);
    saveReelSettingsToStorage({ bgVideoUrl: presetUrl, bgVideoName: presetName });
  };

  const handleRemoveBgVideo = () => {
    setBgVideoUrl(null);
    setBgVideoName('');
    saveReelSettingsToStorage({ bgVideoUrl: undefined, bgVideoName: '' });
  };

  const handleCopyReelScript = () => {
    const script = `🎬 9:16 VERTICAL SPOKEN REEL SCRIPT:
TITLE (SPOKEN FIRST):
${spokenTitle}

FULL DETAILS (SPOKEN SECOND):
${spokenDescription}

EFFECT: ${captionEffect}
ESTIMATED DURATION: ${narrationScript.totalDuration}s
CHANNEL: ${userHandle}
#Reels #Shorts #BreakingNews #VoiceNarration`;

    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // SAVE ALL DATA AND EXPORT NEW VIDEO
  const handleSaveAndExportVideo = async (fastMode: boolean = false) => {
    await handleManualSave();
    await handleExportReelVideo(fastMode);
  };

  // EXPORT AND DOWNLOAD REAL 9:16 VIDEO REEL WITH SPOKEN CAPTIONS & AUDIO
  const handleExportReelVideo = async (fastMode: boolean = false) => {
    // 1. Auto-save all current news data, media, and voice settings first
    await autoSaveAllData();

    setIsExportingVideo(true);
    setVideoExportPct(0);
    setExportError(null);
    setVideoExportStatus(
      fastMode
        ? '⚡ Turbo Fast Exporting 9:16 Reel (rapid 5s-6s render)...'
        : 'Recording animated 9:16 Reel Video with exact preview media & 100% broadcast audio...'
    );

    // Initialize Step-by-Step Progress Modal State
    const freshSteps = INITIAL_REEL_STEPS.map((s, idx) => ({
      ...s,
      status: (idx === 0 ? 'active' : 'pending') as 'pending' | 'active' | 'completed',
    }));

    setProgressModalState({
      isVisible: true,
      percentage: 2,
      currentStepId: 1,
      statusText: 'Starting Reel video generation...',
      statusTextHi: 'न्यूज़ रील वीडियो जेनरेशन शुरू हो रहा है...',
      headline: spokenTitle || item.headline || '',
      steps: freshSteps,
      logs: [{ time: new Date().toLocaleTimeString(), text: '🎬 वीडियो एक्सपोर्ट शुरू: डेटा और सेटिंग्स सुरक्षित' }],
      isComplete: false,
      error: null,
    });

    try {
      // CRITICAL: Pre-generate and verify the voice audio matching the CURRENT edited spokenTitle and spokenDescription!
      setVideoExportStatus('Syncing & mastering edited voiceover audio (एडिट की हुई आवाज़ तैयार हो रही है)...');
      try {
        await voiceNarrator.prepareBroadcastVoice(
          spokenTitle,
          spokenDescription,
          voiceGender,
          currentLanguage
        );
      } catch (voiceSyncErr) {
        console.warn('Voice prep before export warning:', voiceSyncErr);
      }

      const blob = await exportReelVideo({
        item: {
          ...item,
          headline: spokenTitle || item.headline,
          summary: spokenDescription || item.summary,
          fullDescription: spokenDescription || item.fullDescription,
        },
        userHandle: showWatermark ? userHandle : '',
        durationSeconds: narrationScript.totalDuration,
        fastExport: fastMode,
        bgImageUrl: bgImage,
        bgVideoUrl: bgVideoUrl && bgVideoUrl.trim().length > 0 ? bgVideoUrl : undefined,
        existingVideoElement: bgVideoUrl ? previewVideoRef.current : null, // Only pass video element if video is selected!
        customAudioUrl: customAudioUrl || undefined,
        trackType: selectedTrack,
        colorTheme,
        kenBurnsMotion,
        captionEffect,
        spokenTitle,
        spokenDescription,
        speechRate,
        voiceGender,
        musicMuted: !customAudioUrl || musicMuted, // All default music removed; only play if custom audio uploaded!
        language: currentLanguage,
        onProgress: (pct, text) => {
          setVideoExportPct(pct);
          setVideoExportStatus(text);
        },
        onStepProgress: (stepInfo) => {
          setVideoExportPct(stepInfo.pct);
          setVideoExportStatus(stepInfo.detailHi || stepInfo.detail);

          setProgressModalState((prev) => {
            const nextSteps = prev.steps.map((st) => {
              if (st.id < stepInfo.step) {
                return { ...st, status: 'completed' as const };
              } else if (st.id === stepInfo.step) {
                return {
                  ...st,
                  status: (stepInfo.pct >= 100 ? 'completed' : 'active') as 'completed' | 'active',
                  detail: stepInfo.detail,
                  detailHi: stepInfo.detailHi,
                };
              } else {
                return { ...st, status: 'pending' as const };
              }
            });

            const newLog = {
              time: new Date().toLocaleTimeString(),
              text: `${stepInfo.detailHi || stepInfo.detail} (${stepInfo.pct}%)`,
              stepId: stepInfo.step,
            };

            const isFinished = stepInfo.pct >= 100;

            return {
              ...prev,
              percentage: stepInfo.pct,
              currentStepId: stepInfo.step,
              statusText: stepInfo.detail,
              statusTextHi: stepInfo.detailHi,
              steps: isFinished ? nextSteps.map((s) => ({ ...s, status: 'completed' as const })) : nextSteps,
              logs: [...prev.logs.slice(-50), newLog],
              isComplete: isFinished,
            };
          });
        },
      });

      const cleanHeadline = (spokenTitle || item.headline || 'news-reel')
        .slice(0, 30)
        .replace(/[\s/\\?%*:|"<>]/g, '-');
      const { extension } = getSupportedVideoMimeType();
      const finalFileName = `reel-${cleanHeadline}.${extension}`;
      downloadReelBlob(blob, finalFileName);

      const downloadBlobUrl = URL.createObjectURL(blob);
      setProgressModalState((prev) => ({
        ...prev,
        percentage: 100,
        isComplete: true,
        downloadUrl: downloadBlobUrl,
        blob,
        fileName: finalFileName,
        fileSizeBytes: blob.size,
        durationSec: narrationScript.totalDuration,
        statusText: 'Reel exported successfully!',
        statusTextHi: '🎉 नया रील वीडियो सफलतापूर्वक एक्सपोर्ट और डाउनलोड हो गया!',
        steps: prev.steps.map((s) => ({ ...s, status: 'completed' as const })),
        logs: [
          ...prev.logs,
          {
            time: new Date().toLocaleTimeString(),
            text: `🎉 रील तैयार! साइज़: ${(blob.size / (1024 * 1024)).toFixed(2)} MB, फ़ाइल: ${finalFileName}`,
          },
        ],
      }));

      setManualSaveFeedback('🎉 नया वीडियो सफलतापूर्वक एक्सपोर्ट और डाउनलोड हो गया! New Reel Video Exported!');
      setTimeout(() => setManualSaveFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error exporting reel video:', err);
      const errMsg = err?.message || 'Video recording failed. Please try again.';
      setExportError(errMsg);
      setProgressModalState((prev) => ({
        ...prev,
        error: errMsg,
        logs: [
          ...prev.logs,
          { time: new Date().toLocaleTimeString(), text: `⚠️ एरर: ${errMsg}` },
        ],
      }));
    } finally {
      setIsExportingVideo(false);
      setVideoExportPct(0);
      setVideoExportStatus('');
    }
  };

  const narrationProgressPct = Math.min(
    100,
    Math.round((currentNarrationTime / Math.max(1, narrationScript.totalDuration)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={audioFileInputRef}
        onChange={handleCustomAudioUpload}
        accept="audio/*"
        className="hidden"
      />
      <input
        type="file"
        ref={videoFileInputRef}
        onChange={handleCustomVideoUpload}
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
      />
      <input
        type="file"
        ref={imageFileInputRef}
        onChange={handleCustomImageUpload}
        accept="image/*"
        className="hidden"
      />
      {customAudioUrl && (
        <audio
          ref={customAudioPlayerRef}
          src={customAudioUrl}
          loop
          onEnded={() => setIsPlayingMusic(false)}
        />
      )}

      {/* TOP STATUS BAR: SAVED PREFERENCES & AUTO-SAVE INDICATOR */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-900/30 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-1 rounded bg-rose-600/30 text-rose-300 font-bold border border-rose-500/40 flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Spoken Reel Engine</span>
          </span>
          <span className="text-slate-300 font-medium">
            Channel: <strong className="text-amber-300">{userHandle}</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">
            Effect: <strong className="text-rose-400 capitalize">{captionEffect.replace('_', ' ')}</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">
            Duration: <strong className="text-sky-300">{narrationScript.totalDuration}s Voiceover</strong>
          </span>
          {bgVideoUrl && (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Video className="w-3 h-3" />
                <span>Video Loop Active</span>
              </span>
            </>
          )}
        </div>

        {/* LIVE AUTO-SAVE BADGE & MANUAL SAVE BUTTON */}
        <div className="flex items-center gap-2">
          {isAutoSaving ? (
            <span className="text-amber-300 font-bold text-xs flex items-center gap-1 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>ऑटो-सेव हो रहा है...</span>
            </span>
          ) : settingsSavedBadge ? (
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ऑटो-सेव: सुरक्षित ({lastSavedTime})</span>
            </span>
          ) : (
            <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1.5 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ऑटो-सेव चालू ({lastSavedTime})</span>
            </span>
          )}

          <button
            onClick={handleManualSave}
            disabled={isSavingDraft || isAutoSaving}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-slate-700 disabled:opacity-50"
            title="Save all headline, text, media, voice and styles data"
          >
            <Save className="w-3 h-3 text-amber-400" />
            <span>डेटा सेव करें (Save)</span>
          </button>
        </div>
      </div>

      {/* HEADER BAR: TITLE, QUICK ACTIONS, SAVE & EXPORT */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Mic className="w-5 h-5 text-rose-500" />
              <span>Spoken Voiceover Reels Studio</span>
              <span className="text-xs font-mono font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                9:16 HD
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reel speaks Title first, then Full Description with dynamic word-by-word synchronized captions and 100% clear mastered audio.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy Script */}
          <button
            onClick={handleCopyReelScript}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700/80"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
          </button>

          {/* DEDICATED SAVE ALL DATA BUTTON */}
          <button
            onClick={handleManualSave}
            disabled={isSavingDraft || isAutoSaving}
            className="px-3 py-2 bg-slate-800 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 border border-emerald-600/40 shadow-sm"
            title="Click to save all current headline, story, media & audio settings"
          >
            {isSavingDraft ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>💾 Save Data (डेटा सेव)</span>
          </button>

          {/* DEDICATED SAVE & EXPORT VIDEO BUTTON (Primary Action) */}
          <button
            onClick={() => handleSaveAndExportVideo(false)}
            disabled={isExportingVideo}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:bg-slate-800 disabled:opacity-50 text-white text-xs font-black rounded-lg transition flex items-center gap-2 shadow-lg shadow-rose-950/60 ring-1 ring-rose-400/50"
            title="Auto-saves all latest data and exports fresh 9:16 Video Reel with current news story & media"
          >
            {isExportingVideo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>
                  {videoExportPct > 0 ? `Exporting Reel ${videoExportPct}%...` : 'Recording Reel...'}
                </span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4 text-white" />
                <span>💾 Save & Export Reel (100% Audio)</span>
              </>
            )}
          </button>

          {/* Fast Turbo Export Action */}
          <button
            onClick={() => handleSaveAndExportVideo(true)}
            disabled={isExportingVideo}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-950/40"
            title="Fast 5s-6s Viral Reel Export with Auto-Save (तेज़ एक्सपोर्ट)"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>⚡ Fast Reel (5s)</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Reels Studio"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* SAVE NOTIFICATION FEEDBACK ALERT */}
      {manualSaveFeedback && (
        <div className="bg-emerald-950/70 border border-emerald-500/70 text-emerald-200 text-xs p-3 rounded-xl flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{manualSaveFeedback}</span>
          </div>
          <button
            onClick={() => setManualSaveFeedback(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ACTIVE REEL STORY & MEDIA SUMMARY STRIP */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5 px-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-inner">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 font-extrabold text-[10px] uppercase tracking-wider shrink-0 border border-rose-500/30">
            🎬 Current Story:
          </span>
          <span className="text-white font-bold truncate max-w-xs sm:max-w-md md:max-w-xl">
            {spokenTitle}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          <span className="flex items-center gap-1 text-slate-300">
            {bgVideoUrl ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Video className="w-3.5 h-3.5" />
                <span>Video Active: {bgVideoName || 'Video Loop'}</span>
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photo Background Active</span>
              </span>
            )}
          </span>
          <span>•</span>
          <span className="text-amber-300 font-bold">
            {currentLanguage === 'hindi' ? '🇮🇳 हिन्दी आवाज़' : '🇬🇧 English Voice'}
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ऑटो-सेव: सुरक्षित ({lastSavedTime})</span>
          </span>
        </div>
      </div>

      {/* ERROR ALERT IF VIDEO ENCODING FAILS */}
      {exportError && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{exportError}</span>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="text-xs text-rose-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN STUDIO GRID: 9:16 REEL PHONE VIEWPORT ON LEFT, CONTROLS ON RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: 9:16 VERTICAL PHONE MOCKUP VIEWPORT */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-[38px] p-3 bg-slate-900 border-4 border-slate-700 shadow-2xl shadow-rose-950/20 overflow-hidden group">
            {/* Phone Notch Speaker */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 pointer-events-none flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
              <span className="w-8 h-1 rounded-full bg-slate-800" />
            </div>

            {/* INNER 9:16 REEL SCREEN */}
            <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-black flex flex-col justify-between">
              {/* Dynamic Background: VIDEO or IMAGE */}
              {bgVideoUrl ? (
                <video
                  ref={previewVideoRef}
                  src={bgVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${
                    kenBurnsMotion ? 'scale-105 motion-safe:animate-pulse' : 'scale-100'
                  }`}
                  style={{ backgroundImage: `url(${bgImage})` }}
                />
              )}

              {/* Gradient Shading & Theme Wash */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    colorTheme === 'red_dark'
                      ? 'linear-gradient(180deg, rgba(5,8,15,0.7) 0%, rgba(10,15,25,0.4) 35%, rgba(15,23,42,0.85) 65%, rgba(153,27,27,0.98) 100%)'
                      : colorTheme === 'neon_blue'
                      ? 'linear-gradient(180deg, rgba(5,8,15,0.7) 0%, rgba(10,15,25,0.4) 35%, rgba(15,23,42,0.85) 65%, rgba(15,76,129,0.98) 100%)'
                      : colorTheme === 'yellow_black'
                      ? 'linear-gradient(180deg, rgba(5,8,15,0.75) 0%, rgba(10,10,10,0.4) 35%, rgba(20,20,20,0.88) 65%, rgba(0,0,0,0.98) 100%)'
                      : 'linear-gradient(180deg, rgba(5,8,15,0.7) 0%, rgba(4,47,46,0.4) 35%, rgba(2,44,34,0.85) 65%, rgba(6,78,59,0.98) 100%)',
                }}
              />

              {/* TOP HEADER: NARRATION PROGRESS & BROADCAST CHANNEL */}
              <div className="relative z-20 pt-8 px-4 space-y-2">
                {/* Voice Narration Timeline Bar */}
                <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-100 rounded-full"
                    style={{ width: `${narrationProgressPct}%` }}
                  />
                </div>

                {/* Broadcast Channel Bar & Sound Indicator */}
                <div className="flex items-center justify-between text-white text-[11px] pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold tracking-wider">{userHandle || '@NewsLiveOfficial'}</span>
                  </div>

                  {/* Voice / Music Wave Indicator Button */}
                  <button
                    onClick={handleToggleNarration}
                    className="p-1 px-2 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black flex items-center gap-1.5 text-[10px]"
                    title="Toggle Voice Narration"
                  >
                    <Mic className={`w-3 h-3 ${isSpeaking ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                    <span>{isSpeaking ? `${Math.floor(currentNarrationTime)}s` : 'Voice'}</span>
                  </button>
                </div>
              </div>

              {/* REEL RIGHT INTERACTION RAIL (Only when Mockup Mode is toggled on) */}
              {showSocialMockup && (
                <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5 text-white animate-in fade-in">
                  <div className="flex flex-col items-center gap-0.5">
                    <button className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:text-rose-400 transition">
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    </button>
                    <span className="text-[9px] font-bold">14.8K</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <button className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:text-slate-200 transition">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-bold">924</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={handleCopyReelScript}
                      className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:text-amber-400 transition"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-bold">Share</span>
                  </div>
                </div>
              )}

              {/* DYNAMIC SPOKEN CAPTION OVERLAY (10 VIRAL VISUAL EFFECTS) */}
              <div className={`transition-all ${showSocialMockup ? 'mr-10' : 'mr-1'}`}>
                <ReelDynamicCaptionOverlay
                  activePhrase={activePhrase}
                  activeWord={activeWord}
                  currentTime={currentNarrationTime}
                  effect={captionEffect}
                  titleText={spokenTitle}
                  fontSize={fontSize}
                  colorTheme={colorTheme}
                  isSpeaking={isSpeaking}
                />
              </div>

              {/* BOTTOM BREAKING TICKER TAPE */}
              <div className="relative z-20 bg-rose-600 text-white px-3 py-1.5 text-[9px] font-bold tracking-wider uppercase flex items-center justify-between overflow-hidden">
                <span className="shrink-0 flex items-center gap-1 mr-2">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>FLASH WIRE:</span>
                </span>
                <span className="truncate">{spokenTitle.slice(0, 48)}...</span>
              </div>
            </div>
          </div>

          {/* LIVE SPOKEN VOICEOVER NARRATION BAR UNDER PHONE */}
          <div className="w-full max-w-[340px] mt-3 bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Mic className={`w-3.5 h-3.5 ${isSpeaking ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                <span>
                  {isSpeaking
                    ? activePhrase?.isTitle
                      ? 'Reading Headline...'
                      : 'Reading Story Details...'
                    : 'Voice Narration'}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-300">
                {Math.floor(currentNarrationTime)}s / {narrationScript.totalDuration}s
              </span>
            </div>

            {/* Time Scrubber */}
            <input
              type="range"
              min="0"
              max={narrationScript.totalDuration || 10}
              step="0.1"
              value={currentNarrationTime}
              onChange={(e) => {
                const targetSec = parseFloat(e.target.value);
                setCurrentNarrationTime(targetSec);
                const p = narrationScript.phrases.find((ph) => targetSec >= ph.startTime && targetSec < ph.endTime);
                if (p) setActivePhrase(p);
                const w = narrationScript.allWords.find((wd) => targetSec >= wd.startTime && targetSec < wd.endTime);
                if (w) setActiveWord(w);
              }}
              className="w-full accent-rose-600 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />

            {/* Narration Controls Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleNarration}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition ${
                    isSpeaking
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isSpeaking ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isSpeaking ? 'Pause' : 'Play Voice'}</span>
                </button>

                <button
                  onClick={handleReplayNarration}
                  className="p-1 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                  title="Replay Voiceover"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Restart</span>
                </button>
              </div>

              {/* Speed Pills */}
              <div className="flex items-center gap-1">
                {[0.8, 1.0, 1.2, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSpeechRate(spd)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                      speechRate === spd
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Media Upload Bar */}
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setActiveInspectorTab('media');
                  imageFileInputRef.current?.click();
                }}
                className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5 transition"
                title="Upload custom image to video background"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>📸 Background Photo Upload करें</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveInspectorTab('media')}
                className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px]"
              >
                <span>3. Media Tab</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* QUICK PHONE ACTIONS: SAVE DATA & EXPORT VIDEO */}
          <div className="w-full max-w-[340px] mt-2.5 p-3 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>लाइव स्थिति: <strong className="text-white">डेटा सुरक्षित</strong></span>
              </span>
              <span className="font-mono text-emerald-400 text-[10px]">Auto-Saved ({lastSavedTime})</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleManualSave}
                disabled={isSavingDraft || isAutoSaving}
                className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition border border-emerald-600/40 shadow-sm"
                title="Save current headline, text, media, and voice settings"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>डेटा सेव करें</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveAndExportVideo(false)}
                disabled={isExportingVideo}
                className="py-2 px-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-md shadow-rose-950/50"
                title="Save all changes and export current news reel video"
              >
                <Film className="w-3.5 h-3.5 text-white" />
                <span>नया वीडियो एक्सपोर्ट</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: PROFESSIONAL 4-STEP REELS STUDIO CONTROLS */}
        <div className="lg:col-span-7 space-y-4">
          {/* Studio Tab Navigation Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => setActiveInspectorTab('script')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                activeInspectorTab === 'script'
                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>1. Script & Voice</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInspectorTab('captions')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                activeInspectorTab === 'captions'
                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. Captions & Style</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInspectorTab('media')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                activeInspectorTab === 'media'
                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>3. Media & Loops</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveInspectorTab('audio')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                activeInspectorTab === 'audio'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>4. Music &amp; Export</span>
              {customAudioUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* TAB 1: SCRIPT & SPOKEN VOICE */}
          {activeInspectorTab === 'script' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 animate-in fade-in">
              {/* LIVE REEL AUTO-DETECT & QUICK SWITCHER BAR */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      ⚡ लाइव रील न्यूज़ डिटेक्ट (Auto-Detect Live):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {detectFeedback ? (
                        <span className="text-emerald-400 font-bold">{detectFeedback}</span>
                      ) : (
                        feedItems && feedItems.length > 0
                          ? `${feedItems.length} लाइव खबरें उपलब्ध`
                          : 'Live stories ready'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAutoDetectLatestReel}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 shadow"
                    title="Auto-detect latest breaking news for reel"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto-Detect Reel</span>
                  </button>
                  {feedItems && feedItems.length > 0 && (
                    <select
                      onChange={(e) => {
                        const selected = feedItems.find((f) => f.id === e.target.value);
                        if (selected) {
                          if (onSelectOtherItem) onSelectOtherItem(selected);
                          applyReelItem(selected);
                        }
                      }}
                      className="flex-1 sm:flex-none bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 max-w-[200px] truncate focus:outline-none focus:border-rose-500 font-medium"
                      value={item.id}
                    >
                      <option value="" disabled>लाइव खबरें चुनें...</option>
                      {feedItems.slice(0, 20).map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.headline}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Spoken Script &amp; Voice Narration
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {narrationScript.allWords.length} words • ~{narrationScript.totalDuration}s speech
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleNarration}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ${
                      isSpeaking
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isSpeaking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? 'Pause' : 'Test Voice (सुनें)'}</span>
                  </button>
                </div>
              </div>

              {/* Language Accent Selection */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-200 font-bold block">
                    🌐 आवाज़ की भाषा (Voice Language):
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Reads written text clearly without any distortion
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('hindi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                      currentLanguage === 'hindi'
                        ? 'bg-rose-600 text-white shadow ring-1 ring-rose-400'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    🇮🇳 शुद्ध हिन्दी (Hindi)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('english')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                      currentLanguage === 'english'
                        ? 'bg-rose-600 text-white shadow ring-1 ring-rose-400'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    🇬🇧 English (अंग्रेज़ी)
                  </button>
                </div>
              </div>

              {/* Anchor Voice Gender & Speed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-slate-300 font-semibold text-[11px] block">
                    🎙️ एंकर आवाज़ (Anchor Voice):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVoiceGender('male')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition border ${
                        voiceGender === 'male'
                          ? 'bg-rose-950/70 border-rose-500 text-white shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      🎙️ पुरुष (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceGender('female')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition border ${
                        voiceGender === 'female'
                          ? 'bg-rose-950/70 border-rose-500 text-white shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      🎙️ महिला (Female)
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold text-[11px] block">
                      ⚡ बोलने की गति (Speech Speed):
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      ✓ एक्सपोर्ट में भी तेज़ होगी
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {[0.8, 1.0, 1.25, 1.5, 1.75, 2.0].map((rate) => (
                      <button
                        type="button"
                        key={rate}
                        onClick={() => setSpeechRate(rate)}
                        className={`py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                          speechRate === rate
                            ? 'bg-rose-600 border-rose-500 text-white shadow'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Inputs: Headline & Description */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] text-amber-400 font-bold uppercase mb-1 flex items-center justify-between">
                    <span>1. मुख्य शीर्षक (Headline - पहले बोलेगा):</span>
                    <span className="text-[10px] text-slate-400 font-normal">Shows in dynamic caption</span>
                  </label>
                  <input
                    type="text"
                    value={spokenTitle}
                    onChange={(e) => setSpokenTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                    placeholder="यहाँ मुख्य शीर्षक लिखें जिसे बोलना है..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-emerald-400 font-bold uppercase mb-1 flex items-center justify-between">
                    <span>2. पूरी खबर विवरण (Story Description - बाद में बोलेगा):</span>
                    <span className="text-[10px] text-slate-400 font-normal">Word-by-word highlighted</span>
                  </label>
                  <textarea
                    rows={4}
                    value={spokenDescription}
                    onChange={(e) => setSpokenDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-sans leading-relaxed"
                    placeholder="यहाँ पूरी खबर लिखें जिसे एंकर बोलेगा..."
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>लिखा गया बदलाव अपने आप सुरक्षित है (Auto-Saved: {lastSavedTime})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleManualSave}
                    disabled={isSavingDraft || isAutoSaving}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-lg transition flex items-center gap-1.5 border border-emerald-600/30"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save Text (डेटा सेव करें)</span>
                  </button>
                </div>
              </div>

              {isPreparingVoice && (
                <div className="bg-sky-950/40 border border-sky-600/40 text-sky-300 rounded-lg p-2.5 text-xs font-semibold animate-pulse flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                  <span>आवाज़ तैयार हो रही है... Syncing clear news voiceover...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAPTIONS & VISUAL STYLE */}
          {activeInspectorTab === 'captions' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    10 Animated Caption &amp; Visual Styles
                  </h3>
                </div>
                <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                  Select Visual Look
                </span>
              </div>

              {/* 10 Effects Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {REEL_CAPTION_EFFECTS.map((eff) => (
                  <button
                    key={eff.id}
                    onClick={() => setCaptionEffect(eff.id)}
                    className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                      captionEffect === eff.id
                        ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg">{eff.icon}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: eff.accentColor }}
                        />
                      </div>
                      <div className="text-xs font-bold text-white truncate">{eff.name}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{eff.tagline}</div>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-800/80">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded inline-block truncate ${eff.sampleStyleBadge}`}>
                        Preview
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Color Wash & Font Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 text-[11px]">
                    Broadcast Color Wash:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'red_dark', label: 'Crimson Breaking', color: 'bg-rose-700' },
                      { id: 'neon_blue', label: 'Neon Cyber', color: 'bg-sky-600' },
                      { id: 'emerald_gold', label: 'Emerald Wire', color: 'bg-emerald-600' },
                      { id: 'yellow_black', label: 'Studio Gold', color: 'bg-amber-500' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setColorTheme(th.id as any)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition ${
                          colorTheme === th.id
                            ? 'bg-slate-800 text-white font-bold border-rose-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${th.color}`} />
                        <span className="truncate">{th.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 text-[11px]">
                    Caption Typography Size:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'sm', label: 'Small' },
                      { id: 'md', label: 'Medium' },
                      { id: 'lg', label: 'Large' },
                      { id: 'xl', label: 'Bold' },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setFontSize(sz.id as any)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                          fontSize === sz.id
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Watermark Handle & Social Mockup */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Channel Handle:</span>
                  <input
                    type="text"
                    value={userHandle}
                    onChange={(e) => setUserHandle(e.target.value)}
                    className="w-36 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none"
                    placeholder="@NewsLiveOfficial"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWatermark(!showWatermark)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                      showWatermark
                        ? 'bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    Watermark: {showWatermark ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSocialMockup(!showSocialMockup)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                      showSocialMockup
                        ? 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {showSocialMockup ? 'Social Buttons: ON' : 'Clean Video Mode'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKGROUND MEDIA & LOOPS */}
          {activeInspectorTab === 'media' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Background Media &amp; Loops (वीडियो व फोटो बैकग्राउंड)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => imageFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                    title="Upload your custom photo/image for video background"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload Photo (फोटो अपलोड करें)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                    title="Upload your custom video loop"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Video</span>
                  </button>
                </div>
              </div>

              {/* DUAL UPLOAD CARDS: PHOTO & VIDEO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Upload Image Option */}
                <div
                  onClick={() => imageFileInputRef.current?.click()}
                  className="p-3 bg-slate-950 hover:bg-slate-900/80 border border-dashed border-rose-500/50 hover:border-rose-400 rounded-xl cursor-pointer transition flex items-center gap-3 group"
                >
                  <div className="p-2.5 bg-rose-600/20 text-rose-400 rounded-lg group-hover:scale-105 transition shrink-0">
                    <ImageIcon className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block group-hover:text-rose-300 transition">
                      📸 Upload Custom Photo / Image
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      JPG, PNG, WebP • 9:16 फ्रेम में फिट होगी
                    </span>
                  </div>
                </div>

                {/* Upload Video Option */}
                <div
                  onClick={() => videoFileInputRef.current?.click()}
                  className="p-3 bg-slate-950 hover:bg-slate-900/80 border border-dashed border-emerald-500/50 hover:border-emerald-400 rounded-xl cursor-pointer transition flex items-center gap-3 group"
                >
                  <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-lg group-hover:scale-105 transition shrink-0">
                    <Video className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block group-hover:text-emerald-300 transition">
                      🎥 Upload Custom Video Loop
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      MP4, WebM • 9:16 वर्टिकल बैकग्राउंड
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Custom Image Banner */}
              {customImageName && (
                <div className="bg-rose-950/50 border border-rose-600/50 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={bgImage}
                      alt="Custom Background"
                      className="w-10 h-10 object-cover rounded-lg border border-rose-500/50 shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-bold text-rose-300 block truncate">
                        🖼️ Custom Photo Active: {customImageName}
                      </span>
                      <span className="text-[10px] text-rose-400/80">
                        वीडियो के बैकग्राउंड में यह फोटो 100% सेट है (एक्सपोर्ट में भी रेंडर होगी)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveCustomImage}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 text-xs font-semibold transition shrink-0"
                  >
                    Remove Photo
                  </button>
                </div>
              )}

              {/* Active Video Banner */}
              {bgVideoUrl && (
                <div className="bg-emerald-950/50 border border-emerald-600/50 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileVideo className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-emerald-300 block truncate">
                        🎥 Video Active: {bgVideoName || 'Custom Video Loop'}
                      </span>
                      <span className="text-[10px] text-emerald-400/80">
                        Plays in vertical 9:16 format and encoded directly into the reel video
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveBgVideo}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 text-xs font-semibold transition shrink-0"
                  >
                    Remove Video
                  </button>
                </div>
              )}

              {/* PRESET 9:16 BROADCAST VIDEO LOOPS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Choose Broadcast Video Loop (लाइव वीडियो लूप):</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                    ✨ Preview &amp; Export Guaranteed
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_BACKGROUND_VIDEOS.map((vid) => (
                    <button
                      key={vid.id}
                      type="button"
                      onClick={() => handleSelectPresetVideo(vid.url, vid.name)}
                      className={`p-2 rounded-xl overflow-hidden border transition relative text-left group ${
                        bgVideoUrl === vid.url
                          ? 'border-emerald-500 bg-emerald-950/50 ring-2 ring-emerald-500 scale-[1.02]'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="relative h-16 rounded-lg overflow-hidden mb-1.5 bg-black">
                        <img src={vid.thumb} alt={vid.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white/90 drop-shadow" />
                        </div>
                        <span className="absolute top-1 left-1 bg-emerald-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          {vid.badge}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-white block truncate">
                        {vid.name}
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate">
                        9:16 Animated Video
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Static HD Photo Library */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Or Choose High-Impact Newsroom Wallpaper:
                  </label>
                  <button
                    type="button"
                    onClick={() => setKenBurnsMotion(!kenBurnsMotion)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                      kenBurnsMotion
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Ken Burns Zoom: {kenBurnsMotion ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                  {NEWS_BACKGROUNDS.slice(0, 24).map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        setBgImage(bg.url);
                        setBgVideoUrl(null);
                        setBgVideoName('');
                      }}
                      className={`h-14 rounded-lg overflow-hidden border transition relative ${
                        !bgVideoUrl && bgImage === bg.url
                          ? 'border-rose-500 ring-2 ring-rose-500 scale-102'
                          : 'border-slate-800 opacity-80 hover:opacity-100'
                      }`}
                      title={bg.name}
                    >
                      <img src={bg.thumb} alt={bg.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <span className="absolute bottom-1 left-1 right-1 text-[8px] font-bold text-white truncate text-left">
                        {bg.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOUND SETTINGS & 100% AUDIO VIDEO EXPORT */}
          {activeInspectorTab === 'audio' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Audio Mastering &amp; Video Export
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/60">
                  🔊 100% Volume Locked
                </span>
              </div>

              {/* 100% MASTER VOLUME CARD */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-600/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      वीडियो की आवाज़ (Video Audio Volume):
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-xs font-black shadow">
                    {Math.round(volume * 100)}% (Full Volume)
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />

                <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                  ✓ Spoken voiceover is mastered at 100% crisp loudness with dynamics compression so all words are clear in video export and playback.
                </p>
              </div>

              {/* CUSTOM REEL MUSIC & AUDIO UPLOAD (ALL DEFAULT MUSIC REMOVED) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      रील म्यूज़िक (Custom Music / Audio Upload)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/50 flex items-center gap-1">
                    <span>🚫 डिफ़ॉल्ट म्यूज़िक बंद है (Default Music Removed)</span>
                  </span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <p className="text-slate-200 leading-relaxed text-[11px]">
                    <strong className="text-emerald-400 font-bold">✓ हाँ, आप अपनी पसंद का म्यूज़िक डाल सकते हैं!</strong>{' '}
                    सभी डिफ़ॉल्ट बीट्स हटा दी गई हैं। वीडियो में केवल वही म्यूज़िक बजेगा जो आप अपने मोबाइल या कंप्यूटर से अपलोड करेंगे।
                  </p>
                </div>

                {/* UPLOAD ACTIONS */}
                {!customAudioUrl ? (
                  <div className="p-4 border-2 border-dashed border-slate-800 hover:border-rose-500/60 rounded-xl bg-slate-900/40 text-center transition space-y-2.5">
                    <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        डिवाइस से अपना म्यूज़िक / ऑडियो फ़ाइल अपलोड करें
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        MP3, WAV, M4A, AAC ऑडियो फ़ाइलें सपोर्टेड हैं (यदि म्यूज़िक नहीं डालेंगे तो केवल साफ़ आवाज़ रहेगी)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-900/30 transition transform active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>📂 म्यूज़िक फ़ाइल चुनें (Upload Music File)</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-600/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {customAudioName || 'Uploaded Custom Audio'}
                          </span>
                          <span className="text-[10px] text-emerald-400/90 font-medium">
                            ✓ अपलोड किया गया म्यूज़िक रील में चालू है
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleMusic}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                            isPlayingMusic
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isPlayingMusic ? (
                            <>
                              <Pause className="w-3 h-3" />
                              <span>रोकें (Pause)</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              <span>सुनें (Play Preview)</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveCustomAudio}
                          className="text-xs font-medium px-2 py-1 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900 flex items-center gap-1 transition"
                          title="म्यूज़िक हटाएं"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>हटाएं (Remove)</span>
                        </button>
                      </div>
                    </div>

                    {/* Uploaded music volume and ducking */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-emerald-800/40 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300">म्यूज़िक वॉल्यूम (BGM Volume):</span>
                          <span className="text-emerald-300 font-mono font-bold">
                            {Math.round(uploadedMusicVolume * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={uploadedMusicVolume}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setUploadedMusicVolume(val);
                            if (customAudioPlayerRef.current) {
                              customAudioPlayerRef.current.volume = isSpeaking && duckMusic ? 0.15 : val;
                            }
                          }}
                          className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-300 block text-[11px]">वॉयस के पीछे डकिंग (Voice Ducking):</span>
                        <button
                          type="button"
                          onClick={() => setDuckMusic(!duckMusic)}
                          className={`w-full py-1 px-2 rounded text-[11px] font-bold border transition ${
                            duckMusic
                              ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          {duckMusic ? '✓ Ducking ON (वॉयस के समय 15% धीमा)' : 'Ducking OFF (पूरा वॉल्यूम)'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => audioFileInputRef.current?.click()}
                        className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        🔄 दूसरा म्यूज़िक फ़ाइल बदलें (Replace Audio)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* PRIMARY EXPORT & SAVE ACTIONS CARD */}
              <div className="pt-2 space-y-2.5">
                {/* 1-CLICK SAVE DATA BANNER */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Save className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        💾 ऑटो-सेव व डेटा सुरक्षा (Auto-Save &amp; Persistence):
                      </span>
                      <span className="text-[10px] text-slate-400">
                        शीर्षक, खबर, आवाज़ व बैकग्राउंड वीडियो/फोटो सब अपने आप सुरक्षित होते हैं ({lastSavedTime})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualSave}
                    disabled={isSavingDraft || isAutoSaving}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 text-xs font-bold rounded-lg transition border border-emerald-600/40 flex items-center gap-1.5 shadow-sm"
                  >
                    {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>Save Data (डेटा सेव करें)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* FAST TURBO EXPORT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleSaveAndExportVideo(true)}
                    disabled={isExportingVideo}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
                    title="Render in ~5 seconds with Auto-Save for quick social media sharing"
                  >
                    {isExportingVideo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{videoExportPct > 0 ? `Exporting ${videoExportPct}%...` : 'Rendering...'}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white" />
                        <span>⚡ Fast 5s Reel (तेज़ 5 सेकंड एक्सपोर्ट)</span>
                      </>
                    )}
                  </button>

                  {/* FULL SPOKEN REEL EXPORT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleSaveAndExportVideo(false)}
                    disabled={isExportingVideo}
                    className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition ring-1 ring-rose-400/40"
                    title="Auto-saves all data and renders complete 9:16 video reel with 100% voiceover"
                  >
                    {isExportingVideo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{videoExportPct > 0 ? `Exporting ${videoExportPct}%...` : 'Recording Reel...'}</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-4 h-4 text-white" />
                        <span>💾 Save &amp; Export New Video (100% Voice)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Exact Preview Match: जो प्रीव्यू में है वही नया वीडियो एक्सपोर्ट होगा</span>
                  </span>
                  <span className="font-mono text-amber-300">100% Loudness</span>
                </div>

                {videoExportStatus && (
                  <p className="text-center text-[11px] text-amber-300 font-mono mt-1.5 animate-pulse">
                    {videoExportStatus}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP-BY-STEP PROGRESS BAR MODAL (सब कुछ एक साथ नहीं, क्रमबद्ध स्टेप बाय स्टेप) */}
      <StepProgressBarModal
        progressState={progressModalState}
        onClose={() => setProgressModalState((prev) => ({ ...prev, isVisible: false }))}
        onDownload={() => {
          if (progressModalState.blob && progressModalState.fileName) {
            downloadReelBlob(progressModalState.blob, progressModalState.fileName);
          }
        }}
        onPreview={() => {
          if (progressModalState.downloadUrl) {
            window.open(progressModalState.downloadUrl, '_blank');
          }
        }}
        onRetry={() => handleExportReelVideo(false)}
      />
    </div>
  );
};
