import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  Film,
  Video,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Save,
  ExternalLink,
  Instagram,
  Zap,
  Settings2,
  ShieldCheck,
  Download,
  X,
  Layers,
  Sparkles,
  Sliders,
  ChevronDown,
  Check,
  Send,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { ScheduledPost, ScheduleSettings, TrendingNewsItem } from '../types';
import { exportReelVideo } from '../utils/reelVideoExporter';
import { generateClientVerifiedNews } from '../utils/clientNewsGenerator';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userHandle: string;
  currentCountry?: string;
  onOpenReelInStudio?: (item: any) => void;
  onTriggerPublishSlot?: (slot: ScheduledPost) => Promise<boolean>;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  userHandle,
  currentCountry = 'IN',
  onOpenReelInStudio,
  onTriggerPublishSlot,
}) => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [settings, setSettings] = useState<ScheduleSettings>({
    isEnabled: true,
    postsPerDay: 4,
    daysCount: 2,
    timeSlots: ['09:00', '13:00', '17:00', '21:00'],
    language: 'Hindi',
    country: currentCountry || 'IN',
    speechRate: 1.2,
    theme: 'red_dark',
    preRenderMinutesBefore: 30,
    isLoopActive: true,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [preRenderingId, setPreRenderingId] = useState<string | null>(null);
  const [preRenderProgress, setPreRenderProgress] = useState<{ [id: string]: { pct: number; text: string } }>({});
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit slot modal state
  const [editingSlot, setEditingSlot] = useState<ScheduledPost | null>(null);
  const [editForm, setEditForm] = useState<{
    headline: string;
    summary: string;
    timeSlot: string;
    scheduledTime: string;
    speechRate: number;
    bgImageUrl: string;
    caption: string;
  }>({
    headline: '',
    summary: '',
    timeSlot: '',
    scheduledTime: '',
    speechRate: 1.2,
    bgImageUrl: '',
    caption: '',
  });

  // Video preview player state
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Active filter tab: 'all' | 'day1' | 'day2'
  const [activeDayFilter, setActiveDayFilter] = useState<string>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load schedule data on open
  useEffect(() => {
    if (isOpen) {
      fetchSchedule();
    }
  }, [isOpen]);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.posts)) setPosts(data.posts);
          if (data.settings) setSettings(data.settings);
          return;
        }
      }
    } catch {}

    // Fallback to localStorage for static hosting
    try {
      const localPosts = localStorage.getItem('viralnews_schedule_posts');
      if (localPosts) setPosts(JSON.parse(localPosts));
      const localSettings = localStorage.getItem('viralnews_schedule_settings');
      if (localSettings) setSettings(JSON.parse(localSettings));
    } catch {}
    setIsLoading(false);
  };

  // Update schedule settings
  const handleUpdateSettings = async (partial: Partial<ScheduleSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    try {
      localStorage.setItem('viralnews_schedule_settings', JSON.stringify(updated));
    } catch {}

    try {
      await fetch('/api/schedule/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      showToast('Settings auto-saved successfully!');
    } catch {
      showToast('Settings saved locally!');
    }
  };

  // 1. Generate Multi-Day Schedule (Do Din Ka Schedule)
  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daysCount: settings.daysCount || 2,
          postsPerDay: settings.postsPerDay || 4,
          language: settings.language || 'Hindi',
          country: settings.country || currentCountry || 'IN',
          speechRate: settings.speechRate || 1.2,
          theme: settings.theme || 'red_dark',
          preRenderMinutesBefore: settings.preRenderMinutesBefore || 30,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.posts)) {
          setPosts(data.posts);
          if (data.settings) setSettings(data.settings);
          try {
            localStorage.setItem('viralnews_schedule_posts', JSON.stringify(data.posts));
          } catch {}
          showToast(`🎉 ${data.daysCount}-Day Schedule Generated! (${data.count} Verified Video Slots Ready)`);
          return;
        }
      }
    } catch {}

    // Client fallback: generate multi-day slots instantly in browser
    try {
      const totalSlots = (settings.daysCount || 2) * (settings.postsPerDay || 4);
      const clientNews = generateClientVerifiedNews(
        settings.language || 'Hindi',
        settings.country || currentCountry || 'India',
        '',
        'Today',
        totalSlots
      );

      const generatedSlots: ScheduledPost[] = clientNews.news.slice(0, totalSlots).map((item, idx) => {
        const postsPerDay = settings.postsPerDay || 4;
        const dayOffset = Math.floor(idx / postsPerDay);
        const slotIdx = idx % postsPerDay;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const dateStr = targetDate.toISOString().split('T')[0];

        // Slot schedule times (e.g. 09:00, 13:00, 17:00, 21:00)
        const times = ['09:00', '13:00', '17:00', '21:00', '23:30'];
        const targetTime = times[slotIdx % times.length];

        return {
          id: `slot-${Date.now()}-${idx}`,
          targetDate: dateStr,
          targetTime,
          status: 'scheduled',
          headline: item.headline,
          summary: item.summary,
          topic: item.headline,
          theme: (settings.theme as any) || 'red_dark',
          badge: item.badge,
          coverImageUrl: item.autoPoster?.bgImageUrl || item.imageSuggestion || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1080&auto=format&fit=crop&q=85',
          language: settings.language || 'Hindi',
          preRenderMinutesBefore: settings.preRenderMinutesBefore || 30,
          publishedPlatforms: [],
          fullStory: item.fullDescription || item.summary,
        };
      });

      setPosts(generatedSlots);
      try {
        localStorage.setItem('viralnews_schedule_posts', JSON.stringify(generatedSlots));
      } catch {}
      showToast(`🎉 ${settings.daysCount || 2}-Day Schedule Generated! (${generatedSlots.length} Video Slots Ready)`);
    } catch (e) {
      console.error(e);
      showToast('Error generating schedule slots');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Pre-Render a slot (Export 30/25/10 mins before so MP4 is 100% ready!)
  const handlePreRenderSlot = async (slot: ScheduledPost) => {
    setPreRenderingId(slot.id);
    showToast(`🎬 Pre-rendering 9:16 Video for slot: ${slot.timeSlot}...`);

    try {
      // Use exportReelVideo to record full real news video with subtitles & narration
      const videoBlob = await exportReelVideo({
        item: {
          id: slot.newsId || slot.id,
          headline: slot.headline,
          summary: slot.summary,
          category: slot.category || 'general',
          badge: slot.topic || '🚨 BREAKING NEWS',
          trendingScore: 99,
          keywords: slot.hashtags,
          imageSuggestion: slot.bgImageUrl,
          country: slot.country,
        },
        userHandle: userHandle,
        fastExport: true,
        musicMuted: true,
        language: slot.language.toLowerCase().includes('hindi') ? 'hindi' : 'english',
        speechRate: slot.speechRate || 1.2,
        colorTheme: slot.theme || 'red_dark',
        spokenTitle: slot.headline,
        spokenDescription: slot.summary,
        bgImageUrl: slot.bgImageUrl,
        onProgress: (pct, text) => {
          setPreRenderProgress((prev) => ({
            ...prev,
            [slot.id]: { pct, text },
          }));
        },
      });

      // Convert to base64
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
      });

      // Send to server pre-render endpoint
      const res = await fetch(`/api/schedule/pre-render/${slot.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoBase64,
        }),
      });

      const data = await res.json();
      if (data.success && data.post) {
        setPosts((prev) => prev.map((p) => (p.id === slot.id ? data.post : p)));
        showToast(`✅ Video pre-rendered & ready in advance for ${slot.timeSlot}!`);
      }
    } catch (e) {
      console.error('Pre-render error:', e);
      showToast('Pre-rendering failed for slot');
    } finally {
      setPreRenderingId(null);
    }
  };

  // 3. Publish a slot immediately
  const handlePublishSlot = async (slot: ScheduledPost) => {
    setPublishingId(slot.id);
    showToast(`🚀 Uploading slot (${slot.timeSlot}) to Instagram...`);
    try {
      // If video hasn't been pre-rendered yet, pre-render it on the fly first
      let base64ToSend = slot.videoBase64;
      if (!slot.videoUrl && !base64ToSend) {
        const videoBlob = await exportReelVideo({
          item: {
            id: slot.newsId || slot.id,
            headline: slot.headline,
            summary: slot.summary,
            category: slot.category || 'general',
            badge: slot.topic || '🚨 BREAKING NEWS',
            trendingScore: 99,
            keywords: slot.hashtags,
            imageSuggestion: slot.bgImageUrl,
            country: slot.country,
          },
          userHandle,
          fastExport: true,
          musicMuted: true,
          language: slot.language.toLowerCase().includes('hindi') ? 'hindi' : 'english',
          speechRate: slot.speechRate || 1.2,
          colorTheme: slot.theme || 'red_dark',
          spokenTitle: slot.headline,
          spokenDescription: slot.summary,
          bgImageUrl: slot.bgImageUrl,
        });

        base64ToSend = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(videoBlob);
        });

        // Save pre-render first
        await fetch(`/api/schedule/pre-render/${slot.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoBase64: base64ToSend }),
        });
      }

      const res = await fetch(`/api/schedule/publish-slot/${slot.id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts((prev) => prev.map((p) => (p.id === slot.id ? data.post : p)));
        if (data.publishedToMeta) {
          showToast(`🎉 Real Instagram Reel Live with news cover image! (${slot.timeSlot})`);
        } else {
          showToast(`🎉 Scheduled Reel recorded & processed (${slot.timeSlot})`);
        }
      }
    } catch (e) {
      console.error('Publish slot error:', e);
      showToast('Publishing slot failed');
    } finally {
      setPublishingId(null);
    }
  };

  // 4. Delete slot
  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled slot?')) return;
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setPosts(data.posts);
        showToast('Slot deleted from schedule');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Open Edit slot
  const handleOpenEdit = (slot: ScheduledPost) => {
    setEditingSlot(slot);
    setEditForm({
      headline: slot.headline,
      summary: slot.summary,
      timeSlot: slot.timeSlot || '12:00 PM',
      scheduledTime: slot.scheduledTime,
      speechRate: slot.speechRate || 1.2,
      bgImageUrl: slot.bgImageUrl,
      caption: slot.caption,
    });
  };

  // 6. Save Edit slot
  const handleSaveEdit = async () => {
    if (!editingSlot) return;
    try {
      const res = await fetch(`/api/schedule/${editingSlot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts((prev) => prev.map((p) => (p.id === editingSlot.id ? data.post : p)));
        setEditingSlot(null);
        showToast('Slot updated successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 7. Background Auto Pre-Renderer (runs in browser when modal or app is active)
  useEffect(() => {
    if (!settings.isEnabled || posts.length === 0) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const preRenderThresholdMs = (settings.preRenderMinutesBefore || 30) * 60 * 1000;

      // Find first slot that is <= preRenderThreshold away and still pending
      const candidateToPreRender = posts.find((p) => {
        const targetTime = new Date(p.scheduledTime).getTime();
        const diff = targetTime - now;
        return diff > 0 && diff <= preRenderThresholdMs && p.status === 'pending';
      });

      if (candidateToPreRender && !preRenderingId) {
        console.log(`[Auto-PreRender] Starting advance export for slot: ${candidateToPreRender.timeSlot}`);
        handlePreRenderSlot(candidateToPreRender);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [settings.isEnabled, settings.preRenderMinutesBefore, posts, preRenderingId]);

  if (!isOpen) return null;

  // Filter posts by selected day tab
  const displayedPosts = posts.filter((p) => {
    if (activeDayFilter === 'day1') return p.dayLabel?.includes('Day 1') || p.dayLabel?.includes('Today');
    if (activeDayFilter === 'day2') return p.dayLabel?.includes('Day 2') || p.dayLabel?.includes('Tomorrow');
    return true;
  });

  // Calculate next upcoming slot
  const nextUpcoming = posts.find((p) => new Date(p.scheduledTime).getTime() > Date.now() && p.status !== 'published');
  const nextDiffMinutes = nextUpcoming
    ? Math.max(0, Math.round((new Date(nextUpcoming.scheduledTime).getTime() - Date.now()) / 60000))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-rose-600 to-pink-500 text-white rounded-xl shadow-md">
              <Calendar className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Multi-Day News Reel Auto-Scheduler
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Autonomous 2-Day Scheduler
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI Verified News Wire • 9:16 Video Reels • 30/25/10m Advance MP4 Export • Instagram Cover Image Auto-Upload
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Switch */}
            <button
              onClick={() => handleUpdateSettings({ isEnabled: !settings.isEnabled })}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                settings.isEnabled
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${settings.isEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{settings.isEnabled ? 'Scheduler Active' : 'Scheduler Paused'}</span>
            </button>

            {/* Loop Mode Switch */}
            <button
              onClick={() => handleUpdateSettings({ isLoopActive: !settings.isLoopActive })}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                settings.isLoopActive
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title="Schedule auto-repeats every cycle"
            >
              <span>🔄 Loop Mode: {settings.isLoopActive ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Next Upload Status & Generate CTA Bar */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {nextUpcoming ? (
              <div className="flex items-center gap-2 bg-pink-950/40 border border-pink-900/50 px-3 py-1.5 rounded-xl text-pink-300 font-mono">
                <Clock className="w-4 h-4 text-pink-400 animate-pulse" />
                <span>
                  Next Reel: <strong className="text-white">{nextUpcoming.timeSlot}</strong> ({nextDiffMinutes}m remaining)
                </span>
                <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                  {nextUpcoming.status === 'pre_rendered' ? '🎬 MP4 Pre-Rendered Ready' : `Pre-renders ${settings.preRenderMinutesBefore}m before`}
                </span>
              </div>
            ) : (
              <span className="text-slate-400">
                No scheduled slots pending. Generate a new multi-day schedule to get started!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateSchedule}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 hover:from-amber-500 hover:to-pink-500 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Fetching &amp; Verifying Latest Breaking News with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>⚡ Generate 2-Day Schedule ({settings.postsPerDay * (settings.daysCount || 2)} Verified Reels)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            {/* 1. Days Count */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Days to Plan</label>
              <select
                value={settings.daysCount}
                onChange={(e) => handleUpdateSettings({ daysCount: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-xs outline-none focus:border-pink-500"
              >
                <option value={2}>📅 2 Days (Today + Tomorrow)</option>
                <option value={3}>📅 3 Days</option>
                <option value={7}>📅 7 Days (Full Week)</option>
              </select>
            </div>

            {/* 2. Posts Per Day */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Posts Per Day</label>
              <select
                value={settings.postsPerDay}
                onChange={(e) => handleUpdateSettings({ postsPerDay: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-xs outline-none focus:border-pink-500"
              >
                <option value={2}>2 Reels / Day (Morning, Evening)</option>
                <option value={3}>3 Reels / Day (9 AM, 2 PM, 8 PM)</option>
                <option value={4}>⭐ 4 Reels / Day (9 AM, 1 PM, 5 PM, 9 PM)</option>
                <option value={5}>5 Reels / Day (High Frequency)</option>
                <option value={6}>6 Reels / Day (Turbo Broadcast)</option>
                <option value={8}>8 Reels / Day (Viral Wire)</option>
              </select>
            </div>

            {/* 3. Language */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Target Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleUpdateSettings({ language: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-xs outline-none focus:border-pink-500"
              >
                <option value="Hindi">🇮🇳 Hindi (Voice &amp; Captions)</option>
                <option value="English">🌐 English (Global Broadcast)</option>
                <option value="Hinglish">🇮🇳 Hinglish (Bilingual)</option>
              </select>
            </div>

            {/* 4. Video & Speech Speed */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Video & Voice Speed</label>
              <select
                value={settings.speechRate}
                onChange={(e) => handleUpdateSettings({ speechRate: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-bold text-xs outline-none focus:border-pink-500"
              >
                <option value={0.8}>0.8x (Slow & Calm Speed)</option>
                <option value={1.0}>1.0x (Normal Clear Speed)</option>
                <option value={1.2}>⭐ 1.2x (News Anchor Punchy)</option>
                <option value={1.35}>1.35x (Fast Viral Reel)</option>
                <option value={1.5}>1.5x (Super Turbo Breaking)</option>
              </select>
            </div>

            {/* 5. Pre-Render Buffer */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Advance Pre-Export Buffer</label>
              <select
                value={settings.preRenderMinutesBefore}
                onChange={(e) => handleUpdateSettings({ preRenderMinutesBefore: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-pink-300 font-bold text-xs outline-none focus:border-pink-500"
              >
                <option value={30}>⭐ 30 Mins Before Upload (MP4)</option>
                <option value={25}>⚡ 25 Mins Before Upload (MP4)</option>
                <option value={15}>🕒 15 Mins Before Upload (MP4)</option>
                <option value={10}>⚡ 10 Mins Before Upload (MP4)</option>
              </select>
            </div>

            {/* 6. Theme Style */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Reel Visual Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleUpdateSettings({ theme: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-xs outline-none focus:border-pink-500"
              >
                <option value="red_dark">🔴 Red Breaking Primetime</option>
                <option value="neon_blue">🔵 Neon Cyber Broadcast</option>
                <option value="yellow_black">🟡 Yellow Warning Wire</option>
                <option value="emerald_gold">🟢 Emerald Global Wire</option>
                <option value="magenta_fire">🟣 Magenta Viral Pulse</option>
              </select>
            </div>
          </div>
        </div>

        {/* Day Filter Tabs */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveDayFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeDayFilter === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Slots ({posts.length})
            </button>
            <button
              onClick={() => setActiveDayFilter('day1')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeDayFilter === 'day1'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📅 Day 1 (Today)
            </button>
            <button
              onClick={() => setActiveDayFilter('day2')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeDayFilter === 'day2'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📅 Day 2 (Tomorrow)
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>
              Pre-rendered Ready:{' '}
              <strong className="text-emerald-400 font-bold">
                {posts.filter((p) => p.status === 'pre_rendered').length}
              </strong>
            </span>
            <span>
              Published:{' '}
              <strong className="text-pink-400 font-bold">
                {posts.filter((p) => p.status === 'published').length}
              </strong>
            </span>
          </div>
        </div>

        {/* Schedule List Timeline Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="text-center py-20 text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-pink-400" />
              <span>Loading schedule timeline...</span>
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="text-center py-20 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-8 space-y-3">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No Scheduled Reels Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click <strong>"⚡ Generate 2-Day Schedule"</strong> above! The AI will automatically curate verified news for today and tomorrow and schedule automated reel uploads.
              </p>
              <button
                onClick={handleGenerateSchedule}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg"
              >
                Generate 2-Day Schedule Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedPosts.map((slot, index) => {
                const isPreRendered = slot.status === 'pre_rendered';
                const isPublished = slot.status === 'published';
                const isFailed = slot.status === 'failed';
                const isProcessingThis = preRenderingId === slot.id || publishingId === slot.id;

                return (
                  <div
                    key={slot.id}
                    className={`bg-slate-950 border rounded-2xl p-4 transition-all space-y-3 flex flex-col justify-between ${
                      isPublished
                        ? 'border-emerald-800/60 bg-emerald-950/10'
                        : isPreRendered
                        ? 'border-pink-800/60 bg-pink-950/10'
                        : isFailed
                        ? 'border-rose-800/60'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Slot Header: Day & Time & Status Badge */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                            {slot.dayLabel || 'Day Slot'}
                          </span>
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{slot.timeSlot}</span>
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isPublished ? (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Live Uploaded</span>
                            </span>
                          ) : isPreRendered ? (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded border border-pink-500/30 animate-pulse">
                              <Film className="w-3 h-3 text-pink-400" />
                              <span>🎬 MP4 Pre-Rendered Ready</span>
                            </span>
                          ) : isFailed ? (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                              <span>⏳ Scheduled ({settings.preRenderMinutesBefore}m pre-render)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main News Card Content */}
                      <div className="flex gap-3 items-start">
                        {/* Cover Image & Background Visual */}
                        <div className="relative w-24 h-28 rounded-xl overflow-hidden bg-black shrink-0 border border-slate-800 group shadow-md">
                          <img
                            src={slot.bgImageUrl}
                            alt="News background"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute top-1 left-1 bg-black/80 text-[8px] font-bold text-pink-300 px-1 py-0.5 rounded flex items-center gap-0.5 border border-pink-500/30">
                            <span>📸 IG Cover</span>
                          </div>

                          {slot.videoUrl && (
                            <button
                              onClick={() => setPreviewVideoUrl(slot.videoUrl!)}
                              className="absolute inset-0 bg-black/50 hover:bg-black/30 flex items-center justify-center transition cursor-pointer"
                              title="Play Pre-Rendered Reel"
                            >
                              <Play className="w-7 h-7 text-white fill-white" />
                            </button>
                          )}
                        </div>

                        {/* Text Details */}
                        <div className="min-w-0 space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-rose-500/20 text-rose-300">
                              {slot.topic || '🚨 BREAKING'}
                            </span>
                            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                              ⚡ {slot.speechRate || 1.2}x Speed
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {slot.language}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-relaxed">
                            {slot.headline}
                          </h4>

                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
                            {slot.summary}
                          </p>

                          {slot.verification && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>{slot.verification.credibilityScore}% Verified • {slot.verification.sourceWebsite}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hashtags snippet */}
                      <div className="p-2 bg-slate-900/60 rounded-lg text-[10px] text-slate-400 font-mono line-clamp-1 border border-slate-800/80">
                        {slot.hashtags.join(' ')}
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        {/* Pre-render button */}
                        {!isPublished && (
                          <button
                            onClick={() => handlePreRenderSlot(slot)}
                            disabled={isProcessingThis}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                              isPreRendered
                                ? 'bg-pink-950/60 text-pink-300 border border-pink-800/60 hover:bg-pink-900/60'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                            title="Export & Pre-render video now"
                          >
                            {preRenderingId === slot.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                                <span>
                                  {preRenderProgress[slot.id]?.pct !== undefined
                                    ? `Exporting ${preRenderProgress[slot.id].pct}%...`
                                    : 'Exporting...'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Film className="w-3.5 h-3.5 text-pink-400" />
                                <span>{isPreRendered ? 'Re-Export MP4' : 'Pre-Render Now'}</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Play Video button */}
                        {slot.videoUrl && (
                          <button
                            onClick={() => setPreviewVideoUrl(slot.videoUrl!)}
                            className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-rose-300" />
                            <span>Play Video</span>
                          </button>
                        )}

                        {/* Edit Slot Button */}
                        <button
                          onClick={() => handleOpenEdit(slot)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Edit Headline, Speed or Cover Image"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Instant Publish Slot Button */}
                        {!isPublished && (
                          <button
                            onClick={() => handlePublishSlot(slot)}
                            disabled={isProcessingThis}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow transition cursor-pointer"
                            title="Upload to Instagram Right Now"
                          >
                            {publishingId === slot.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Posting...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Upload Now</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete Slot Button */}
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                          title="Delete slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 px-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              Background pre-render buffer: MP4 exports <strong>{settings.preRenderMinutesBefore} minutes prior</strong> to scheduled upload
            </span>
          </div>

          <div>
            <span>Cover image: <strong>News related visual auto-assigned</strong></span>
          </div>
        </div>

        {/* Edit Slot Sub-Modal */}
        {editingSlot && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-pink-400" />
                  <span>Edit Schedule Slot ({editingSlot.timeSlot})</span>
                </h4>
                <button onClick={() => setEditingSlot(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Headline / Reel Title</label>
                  <input
                    type="text"
                    value={editForm.headline}
                    onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Summary / Story Script</label>
                  <textarea
                    rows={3}
                    value={editForm.summary}
                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-pink-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Time Slot Display</label>
                    <input
                      type="text"
                      value={editForm.timeSlot}
                      onChange={(e) => setEditForm({ ...editForm, timeSlot: e.target.value })}
                      placeholder="01:00 PM"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Video & Voice Speed</label>
                    <select
                      value={editForm.speechRate}
                      onChange={(e) => setEditForm({ ...editForm, speechRate: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-pink-500"
                    >
                      <option value={0.8}>0.8x (Slow)</option>
                      <option value={1.0}>1.0x (Normal)</option>
                      <option value={1.2}>1.2x (Punchy News)</option>
                      <option value={1.35}>1.35x (Fast Viral)</option>
                      <option value={1.5}>1.5x (Super Turbo)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">News Background & Cover Image URL</label>
                  <input
                    type="text"
                    value={editForm.bgImageUrl}
                    onChange={(e) => setEditForm({ ...editForm, bgImageUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Instagram Caption</label>
                  <textarea
                    rows={3}
                    value={editForm.caption}
                    onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-[11px] outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Player Modal */}
        {previewVideoUrl && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-sm w-full space-y-3 relative shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-pink-400" />
                  <span>Pre-Rendered News Reel Video</span>
                </h4>
                <button
                  onClick={() => setPreviewVideoUrl(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[70vh] flex items-center justify-center border border-slate-800">
                <video
                  src={previewVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <a
                  href={previewVideoUrl}
                  download="scheduled-news-reel.mp4"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-pink-400" />
                  <span>Download MP4</span>
                </a>
                <button
                  onClick={() => setPreviewVideoUrl(null)}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
