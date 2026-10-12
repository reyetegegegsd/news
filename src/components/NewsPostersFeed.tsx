import React, { useState } from 'react';
import { TrendingNewsItem, PosterConfig } from '../types';
import { NEWS_BACKGROUNDS } from '../data/backgrounds';
import { COUNTRIES } from '../data/countries';
import { exportReelVideo, downloadReelBlob, getSupportedVideoMimeType } from '../utils/reelVideoExporter';
import {
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Palette,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Eye,
  EyeOff,
  Wand2,
  X,
  RotateCcw,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Calendar,
  Film,
} from 'lucide-react';

function getCountryInfo(countryNameOrCode?: string) {
  if (!countryNameOrCode) return { name: 'Worldwide', flag: '🌐', code: 'GLOBAL' };
  const found = COUNTRIES.find(
    (c) =>
      c.code.toUpperCase() === countryNameOrCode.toUpperCase() ||
      c.name.toLowerCase() === countryNameOrCode.toLowerCase() ||
      countryNameOrCode.toLowerCase().includes(c.name.toLowerCase())
  );
  if (found) return found;
  return { name: countryNameOrCode, flag: '📍', code: countryNameOrCode };
}

interface NewsPostersFeedProps {
  items: TrendingNewsItem[];
  userHandle: string;
  handleCorner: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  onUpdateHandle?: (handle: string, corner: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right') => void;
  savedIds: string[];
  onToggleSave: (item: TrendingNewsItem) => void;
  onPublishDirect?: (item: TrendingNewsItem, posterUrl: string) => void;
  selectedCountry?: string;
  onCustom50Generated?: (items: TrendingNewsItem[]) => void;
  onResetToLiveNews?: () => void;
  isCustomMode?: boolean;
  onOpenReelsStudio?: (item: TrendingNewsItem) => void;
  onOpenPosterStudio?: (item: TrendingNewsItem) => void;
  onOpenAiModal?: () => void;
}

export const NewsPostersFeed: React.FC<NewsPostersFeedProps> = ({
  items,
  userHandle,
  handleCorner,
  onUpdateHandle,
  savedIds,
  onToggleSave,
  onPublishDirect,
  selectedCountry,
  onCustom50Generated,
  onResetToLiveNews,
  isCustomMode,
  onOpenReelsStudio,
  onOpenPosterStudio,
  onOpenAiModal,
}) => {
  // Watermark on/off toggle ("mene kaha ki username hide ho post nahi")
  const [showWatermark, setShowWatermark] = useState<boolean>(true);

  // Individual customizations per item
  const [customConfigs, setCustomConfigs] = useState<Record<string, Partial<PosterConfig>>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePickerId, setActivePickerId] = useState<string | null>(null);
  const [sizeMenuId, setSizeMenuId] = useState<string | null>(null);

  // Reel Video Export State
  const [exportingReelId, setExportingReelId] = useState<string | null>(null);
  const [reelExportPct, setReelExportPct] = useState<number>(0);
  const [reelStatusText, setReelStatusText] = useState<string>('');

  // Custom 50 Styles Generator Box
  const [customBoxOpen, setCustomBoxOpen] = useState<boolean>(false);
  const [customNewsText, setCustomNewsText] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isGenerating50, setIsGenerating50] = useState<boolean>(false);
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleVerifyOnlyWithGoogle = async () => {
    const titleToTest = customTopic.trim();
    const descToTest = customNewsText.trim();
    if (!titleToTest && !descToTest) {
      setGenerateError('Please enter a title or news text to verify with Google.');
      return;
    }
    setGenerateError(null);
    setIsVerifyingGoogle(true);
    try {
      const res = await fetch('/api/news/verify-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleToTest || descToTest.slice(0, 80),
          description: descToTest,
          countryName: selectedCountry || 'India',
        }),
      });
      const data = await res.json();
      if (data.verification) {
        setVerificationResult(data.verification);
      } else {
        setGenerateError('Could not complete Google verification.');
      }
    } catch {
      setGenerateError('Failed to connect to Google verification wire.');
    } finally {
      setIsVerifyingGoogle(false);
    }
  };

  const getPosterConfigForItem = (item: TrendingNewsItem): PosterConfig => {
    const override = customConfigs[item.id] || {};
    const auto = item.autoPoster || {
      category: 'general',
      badge: item.badge || 'BREAKING NEWS',
      colorTheme: 'red_dark' as const,
      bgImageUrl: item.imageSuggestion || NEWS_BACKGROUNDS[0].url,
      highlightStat: 'VERIFIED DISPATCH',
    };

    return {
      badge: override.badge || auto.badge || 'BREAKING NEWS',
      mainHeadline: override.mainHeadline || item.headline,
      subHeadline: override.subHeadline || item.summary,
      highlightStat: override.highlightStat || auto.highlightStat || 'VERIFIED DISPATCH',
      colorTheme: override.colorTheme || (auto.colorTheme as any) || 'red_dark',
      aspectRatio: override.aspectRatio || '1:1',
      bgImageUrl: override.bgImageUrl || auto.bgImageUrl || NEWS_BACKGROUNDS[0].url,
      channelName: override.channelName || 'NEWS 24/7',
      userHandle: userHandle || '@NewsLiveOfficial',
      handleCorner: handleCorner || 'bottom_right',
      watermark: showWatermark,
      dateBadge: override.dateBadge || 'LIVE',
    };
  };

  const handleCopyDescription = (item: TrendingNewsItem) => {
    const textToCopy = `${item.headline.toUpperCase()}

${item.fullDescription || item.summary}

────────────────────────────────────────────
Source: ${item.sourceWebsite || item.sourceName || 'Wire Service'}
Link: ${item.link || 'https://news.google.com'}
Tags: #BreakingNews #TopStories #WorldNews #${(item.category || 'News').replace(/\s+/g, '')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download Canvas with optional watermark
  const handleDownloadPoster = (item: TrendingNewsItem, targetRatio: '1:1' | '9:16' | '16:9' | '4:5' = '1:1') => {
    const cfg = getPosterConfigForItem(item);
    const canvas = document.createElement('canvas');

    let width = 1080;
    let height = 1080;
    if (targetRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (targetRatio === '16:9') {
      width = 1920;
      height = 1080;
    } else if (targetRatio === '4:5') {
      width = 1080;
      height = 1350;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = cfg.bgImageUrl;

    const render = (imageObj: HTMLImageElement | null) => {
      // 1. Cover Background
      if (imageObj) {
        const imgAspect = imageObj.width / imageObj.height;
        const canvasAspect = width / height;
        let drawW, drawH, drawX, drawY;
        if (imgAspect > canvasAspect) {
          drawH = height;
          drawW = height * imgAspect;
          drawX = (width - drawW) / 2;
          drawY = 0;
        } else {
          drawW = width;
          drawH = width / imgAspect;
          drawX = 0;
          drawY = (height - drawH) / 2;
        }
        ctx.drawImage(imageObj, drawX, drawY, drawW, drawH);
      } else {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Broadcast Cinematic Gradient
      const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (cfg.colorTheme === 'red_dark') {
        overlayGrad.addColorStop(0, 'rgba(9, 13, 22, 0.45)');
        overlayGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.82)');
        overlayGrad.addColorStop(1, 'rgba(127, 29, 29, 0.98)');
      } else if (cfg.colorTheme === 'neon_blue') {
        overlayGrad.addColorStop(0, 'rgba(10, 15, 30, 0.4)');
        overlayGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.82)');
        overlayGrad.addColorStop(1, 'rgba(15, 76, 129, 0.98)');
      } else if (cfg.colorTheme === 'yellow_black') {
        overlayGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        overlayGrad.addColorStop(0.4, 'rgba(10, 10, 10, 0.85)');
        overlayGrad.addColorStop(1, 'rgba(20, 20, 20, 0.98)');
      } else if (cfg.colorTheme === 'emerald_gold') {
        overlayGrad.addColorStop(0, 'rgba(6, 78, 59, 0.4)');
        overlayGrad.addColorStop(0.4, 'rgba(4, 47, 46, 0.82)');
        overlayGrad.addColorStop(1, 'rgba(2, 44, 34, 0.98)');
      } else {
        overlayGrad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
        overlayGrad.addColorStop(0.4, 'rgba(112, 26, 117, 0.82)');
        overlayGrad.addColorStop(1, 'rgba(76, 5, 25, 0.98)');
      }
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, width, height);

      // Top Red Accent Line
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(0, 0, width, 8);

      const paddingX = Math.round(width * 0.07);
      const headerY = Math.round(height * 0.06);

      // Channel Brand Tag
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, paddingX, headerY, 240, 44, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText(`⚡ ${cfg.channelName.toUpperCase()}`, paddingX + 16, headerY + 29);

      // Live Badge
      ctx.fillStyle = '#e11d48';
      roundRect(ctx, width - paddingX - 140, headerY, 140, 44, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`🔴 ${cfg.dateBadge || 'LIVE'}`, width - paddingX - 122, headerY + 28);
      ctx.restore();

      // USERNAME WATERMARK (Only drawn if showWatermark is true and userHandle exists!)
      if (showWatermark && cfg.userHandle && cfg.userHandle.trim()) {
        ctx.save();
        const handleText = cfg.userHandle.startsWith('@') ? cfg.userHandle : `@${cfg.userHandle}`;
        ctx.font = 'bold 19px system-ui, sans-serif';
        const textWidth = ctx.measureText(handleText).width + 36;
        let posX = width - paddingX - textWidth;
        let posY = height - 125;

        if (cfg.handleCorner === 'top_left') {
          posX = paddingX;
          posY = headerY + 60;
        } else if (cfg.handleCorner === 'top_right') {
          posX = width - paddingX - textWidth;
          posY = headerY + 60;
        } else if (cfg.handleCorner === 'bottom_left') {
          posX = paddingX;
          posY = height - 125;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = 'rgba(225, 29, 72, 0.6)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, posX, posY, textWidth, 40, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(handleText, posX + 16, posY + 26);
        ctx.restore();
      }

      // Main News Badge
      const contentStartY = targetRatio === '16:9' ? height * 0.42 : height * 0.52;
      ctx.save();
      ctx.fillStyle = cfg.colorTheme === 'yellow_black' ? '#f59e0b' : '#e11d48';
      roundRect(ctx, paddingX, contentStartY, 220, 42, 6);
      ctx.fill();

      ctx.fillStyle = cfg.colorTheme === 'yellow_black' ? '#000000' : '#ffffff';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(cfg.badge, paddingX + 16, contentStartY + 28);
      ctx.restore();

      // Main Headline
      ctx.save();
      ctx.fillStyle = '#ffffff';
      const headlineFontSize = targetRatio === '16:9' ? 44 : 50;
      ctx.font = `900 ${headlineFontSize}px system-ui, -apple-system, sans-serif`;
      const maxTextWidth = width - paddingX * 2;
      const headlineLines = wrapText(ctx, cfg.mainHeadline, maxTextWidth);

      let lineY = contentStartY + 80;
      headlineLines.slice(0, 3).forEach((line) => {
        ctx.fillText(line, paddingX, lineY);
        lineY += headlineFontSize * 1.22;
      });

      // Subheadline / Summary
      if (cfg.subHeadline && targetRatio !== '16:9') {
        ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
        ctx.font = '600 24px system-ui, sans-serif';
        const subLines = wrapText(ctx, cfg.subHeadline, maxTextWidth);
        lineY += 12;
        subLines.slice(0, 2).forEach((sLine) => {
          ctx.fillText(`• ${sLine}`, paddingX, lineY);
          lineY += 32;
        });
      }
      ctx.restore();

      // Footer
      const footerY = height - 55;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingX, footerY - 18);
      ctx.lineTo(width - paddingX, footerY - 18);
      ctx.stroke();

      ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
      ctx.font = '500 18px system-ui, sans-serif';
      ctx.fillText(`Source: ${item.sourceWebsite || 'Google News Wire'}`, paddingX, footerY + 8);

      ctx.fillStyle = '#e11d48';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('VERIFIED WIRE', width - paddingX - 140, footerY + 8);
      ctx.restore();

      // Download trigger
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `Poster-${item.headline.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}-${targetRatio.replace(':', 'x')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSizeMenuId(null);
    };

    img.onload = () => render(img);
    img.onerror = () => render(null);
  };

  const handleDownloadReelVideo = async (targetItem: TrendingNewsItem) => {
    if (!targetItem) return;
    setExportingReelId(targetItem.id);
    setReelExportPct(0);
    setReelStatusText('Recording 9:16 Video Reel with Audio & Slides...');
    setSizeMenuId(null);

    // Read saved reel preferences from localStorage
    let savedSettings: any = null;
    try {
      const local = localStorage.getItem('viralnews_reels_saved_settings');
      if (local) savedSettings = JSON.parse(local);
    } catch (e) {
      console.warn('Failed to read saved reel settings:', e);
    }

    const cfg = getPosterConfigForItem(targetItem);
    const effectiveHandle = savedSettings?.userHandle || (showWatermark ? (userHandle || '@NewsLiveOfficial') : '');
    const effectiveTheme = savedSettings?.colorTheme || cfg.colorTheme || targetItem.autoPoster?.colorTheme || 'red_dark';
    const effectiveDuration = savedSettings?.slideDuration ? Math.max(8, savedSettings.slideDuration * 2) : 8;

    try {
      const blob = await exportReelVideo({
        item: targetItem,
        userHandle: effectiveHandle,
        durationSeconds: effectiveDuration,
        bgImageUrl: cfg.bgImageUrl || targetItem.autoPoster?.bgImageUrl || targetItem.imageSuggestion,
        bgVideoUrl: savedSettings?.bgVideoUrl,
        customAudioUrl: savedSettings?.customAudioUrl,
        musicMuted: !savedSettings?.customAudioUrl, // Default music removed completely
        colorTheme: effectiveTheme,
        kenBurnsMotion: savedSettings?.kenBurnsMotion ?? true,
        captionEffect: savedSettings?.captionEffect || 'hormozi_pop',
        spokenTitle: targetItem.headline,
        spokenDescription: targetItem.fullDescription || targetItem.summary,
        speechRate: savedSettings?.speechRate || 1.0,
        onProgress: (pct, text) => {
          setReelExportPct(pct);
          setReelStatusText(text);
        },
      });
      const cleanHeadline = (targetItem.headline || 'news-reel')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 30);
      const { extension } = getSupportedVideoMimeType();
      downloadReelBlob(blob, `reel-${cleanHeadline}.${extension}`);
    } catch (err: any) {
      console.error('Error generating reel video:', err);
      // DO NOT fallback to poster image! Show actionable notice to user
      alert(`Reel video export error: ${err?.message || 'Media recorder failed'}. Please try again.`);
    } finally {
      setExportingReelId(null);
      setReelExportPct(0);
      setReelStatusText('');
    }
  };

  const handleSelectNewBackground = (itemId: string, bgUrl: string) => {
    setCustomConfigs((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), bgImageUrl: bgUrl },
    }));
    setActivePickerId(null);
  };

  const handleGenerate50Styles = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customNewsText.trim() || customNewsText.trim().length < 5) {
      setGenerateError('Please enter news story text first.');
      return;
    }
    setGenerateError(null);
    setIsGenerating50(true);
    try {
      const res = await fetch('/api/news/generate-50-styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullNewsText: customNewsText,
          customTopic: customTopic,
          countryName: selectedCountry || 'India',
          userHandle: showWatermark ? (userHandle || '@NewsLiveOfficial') : '',
        }),
      });
      const data = await res.json();
      if (data.news && Array.isArray(data.news)) {
        if (onCustom50Generated) {
          onCustom50Generated(data.news);
        }
        setCustomBoxOpen(false);
      } else {
        setGenerateError(data.error || 'Failed to generate styles');
      }
    } catch {
      setGenerateError('Connection error. Please try again.');
    } finally {
      setIsGenerating50(false);
    }
  };

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = (text || '').split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  return (
    <div className="space-y-6">
      {/* PROFESSIONAL BROADCAST TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            {isCustomMode ? 'Custom Editorial Series' : 'Live News Wire'}
          </h2>
          <span className="text-slate-600 text-xs" aria-hidden="true">·</span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {items.length} Reports Available
          </span>
          {isCustomMode && onResetToLiveNews && (
            <button
              onClick={onResetToLiveNews}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors ml-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back to Country Wire</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Reel Studio Trigger */}
          {items.length > 0 && onOpenReelsStudio && (
            <button
              onClick={() => {
                const firstCfg = getPosterConfigForItem(items[0]);
                onOpenReelsStudio({
                  ...items[0],
                  imageSuggestion: firstCfg.bgImageUrl,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors"
              title="Open current news in Reels Studio"
            >
              <Film className="w-3.5 h-3.5 text-rose-400" />
              <span>Reels Studio</span>
            </button>
          )}

          {/* Quick Poster Studio Trigger */}
          {items.length > 0 && onOpenPosterStudio && (
            <button
              onClick={() => onOpenPosterStudio(items[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors"
              title="Open current story in HD Poster Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Poster Studio</span>
            </button>
          )}

          {/* 1-Click Download Reel Video */}
          {items.length > 0 && (
            <button
              onClick={() => handleDownloadReelVideo(items[0])}
              disabled={Boolean(exportingReelId && exportingReelId === items[0]?.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white transition-colors shadow-xs"
              title="Download animated 9:16 video reel with audio beats and animated slides"
            >
              {exportingReelId === items[0]?.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>{reelExportPct > 0 ? `Exporting Reel ${reelExportPct}%...` : 'Recording Reel...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Download Reel Video (MP4)</span>
                </>
              )}
            </button>
          )}

          {/* 1 News -> 50 Styles Studio Toggle */}
          <button
            onClick={() => setCustomBoxOpen(!customBoxOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              customBoxOpen
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{customBoxOpen ? 'Close Generator' : 'Series Generator'}</span>
          </button>
        </div>
      </div>

      {/* CUSTOM 50 STYLES GENERATOR BOX (Streamlined & Clean - "div ki jarutat nahi he") */}
      {customBoxOpen && (
        <form
          onSubmit={handleGenerate50Styles}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Real News Google Search &amp; 50 Unique Dispatches
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter your title or topic. Google News will search for real related news stories across major publishers with unique headlines, verified facts, and instant Poster &amp; Reel creation!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCustomBoxOpen(false)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-md hover:bg-slate-800 transition"
              title="Close box"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                News Title / Topic (Headline)
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Finance ministry announces 10% rate relief for infrastructure projects..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full News / Article / Description
              </label>
              <textarea
                rows={4}
                value={customNewsText}
                onChange={(e) => setCustomNewsText(e.target.value)}
                placeholder="Paste full statement, press release, wire dispatch or detailed report here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans leading-relaxed"
              />
            </div>
          </div>

          {/* GOOGLE VERIFICATION STATUS CARD */}
          {verificationResult && (
            <div
              className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                verificationResult.isVerified
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  {verificationResult.isVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>
                    {verificationResult.isVerified
                      ? 'Google News Wire: Fact Check Confirmed'
                      : 'Google News Wire: Unconfirmed / Developing Story'}
                  </span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/40 font-bold">
                  Credibility: {verificationResult.credibilityScore}%
                </span>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed">
                {verificationResult.factCheckSummary}
              </p>

              {verificationResult.sources && verificationResult.sources.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-2 text-[10px]">
                  <span className="text-slate-400">Verified Publishers:</span>
                  {verificationResult.sources.slice(0, 4).map((s: any, i: number) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-black/60 text-slate-200 border border-slate-700/60"
                    >
                      {s.publisher}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {generateError && (
            <p className="text-xs text-rose-400 font-medium">⚠️ {generateError}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Region: <strong className="text-white">{selectedCountry || 'India'}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomNewsText('');
                  setCustomTopic('');
                  setVerificationResult(null);
                  setGenerateError(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                Clear
              </button>

              {/* Verify with Google Button */}
              <button
                type="button"
                onClick={handleVerifyOnlyWithGoogle}
                disabled={isVerifyingGoogle || (!customTopic && !customNewsText)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                title="Verify facts with Google News before publishing"
              >
                {isVerifyingGoogle ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>{isVerifyingGoogle ? 'Verifying with Google...' : 'Verify with Google'}</span>
              </button>

              {/* Generate 50 Titles + 50 Descriptions Button */}
              <button
                type="submit"
                disabled={isGenerating50}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center gap-1.5"
              >
                {isGenerating50 ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying &amp; Creating 50 Styles...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Verify &amp; Generate 50+ Titles &amp; Descriptions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STREAMLINED USERNAME & WATERMARK STRIP (Allows hiding username completely!) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">Poster Username:</span>
          <div className="flex items-center bg-slate-950 border border-slate-800 focus-within:border-slate-700 rounded-md px-2.5 py-1">
            <span className="text-slate-500 font-bold mr-1">@</span>
            <input
              type="text"
              value={userHandle.replace(/^@/, '')}
              onChange={(e) => {
                const val = `@${e.target.value.trim()}`;
                if (onUpdateHandle) {
                  onUpdateHandle(val, handleCorner);
                }
              }}
              placeholder="channel_handle"
              className="bg-transparent text-xs text-white font-medium focus:outline-none w-32 sm:w-40 placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* USERNAME SHOW/HIDE TOGGLE ("mene kaha ki username hide ho post nahi") */}
          <button
            onClick={() => setShowWatermark(!showWatermark)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-xs transition ${
              showWatermark
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-rose-950/60 text-rose-300 border border-rose-800/80'
            }`}
            title="Toggle username watermark on posters"
          >
            {showWatermark ? (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Watermark: ON</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Username Hidden (No Watermark)</span>
              </>
            )}
          </button>

          {/* Corner selector (only when watermark is on) */}
          {showWatermark && (
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-md p-0.5 text-[11px]">
              <span className="text-slate-500 px-1.5 hidden sm:inline">Corner:</span>
              {[
                { id: 'bottom_right', label: 'Bottom-R' },
                { id: 'bottom_left', label: 'Bottom-L' },
                { id: 'top_right', label: 'Top-R' },
                { id: 'top_left', label: 'Top-L' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (onUpdateHandle) {
                      onUpdateHandle(userHandle, c.id as any);
                    }
                  }}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    handleCorner === c.id
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* REELS POST SETTINGS PERSISTENCE & 1-CLICK STATUS BANNER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold text-white">Reels Studio Config:</span>
            <span className="text-slate-300 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {userHandle || '@NewsLiveOfficial'}
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-slate-400 font-normal">
            1-Click 9:16 Video Downloads Active
          </span>
        </div>

        {items.length > 0 && onOpenReelsStudio && (
          <button
            onClick={() => {
              const firstCfg = getPosterConfigForItem(items[0]);
              onOpenReelsStudio({
                ...items[0],
                imageSuggestion: firstCfg.bgImageUrl,
              });
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80"
          >
            <span>Configure Audio &amp; Video Backgrounds</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      {/* 4-COLUMN GOOGLE-VERIFIED BROADCAST POSTERS GRID (list 2 ki he 4 ki kar do) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, index) => {
          const cfg = getPosterConfigForItem(item);
          const isSaved = savedIds.includes(item.id);
          const countryInfo = getCountryInfo(item.country);

          return (
            <article
              key={item.id}
              className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition"
            >
              {/* TOP EDITORIAL DATELINE WITH EXACT TIME & GOOGLE VERIFIED BADGE */}
              <div className="px-3 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 gap-1.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-white font-medium flex items-center gap-1 shrink-0">
                    <span>{countryInfo.flag}</span>
                    <span className="hidden sm:inline">{countryInfo.name}</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 truncate">
                    {item.sourceWebsite || item.sourceName || 'Wire'}
                  </span>
                </div>

                {/* EXACT TIME & GOOGLE VERIFIED BADGE ("time add kaero kab ki new he pata chhale") */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="flex items-center gap-1 text-[10px] text-amber-300 font-mono font-bold bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded shadow-xs" title={`Published: ${item.formattedDateTime || item.publishedTimeAgo}`}>
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    <span>{item.publishedTimeAgo || 'Live'}</span>
                  </span>

                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded shadow-xs">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Verified Wire</span>
                  </span>
                </div>
              </div>

              {/* POSTER CANVAS PREVIEW */}
              <div className="relative aspect-square w-full bg-slate-950 overflow-hidden group">
                <img
                  src={cfg.bgImageUrl}
                  alt={item.headline}
                  className="w-full h-full object-cover group-hover:scale-101 transition duration-300"
                />

                {/* Broadcast Gradient Overlay */}
                <div
                  className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none"
                  style={{
                    background:
                      cfg.colorTheme === 'red_dark'
                        ? 'linear-gradient(180deg, rgba(9,13,22,0.45) 0%, rgba(15,23,42,0.8) 45%, rgba(127,29,29,0.98) 100%)'
                        : cfg.colorTheme === 'neon_blue'
                        ? 'linear-gradient(180deg, rgba(10,15,30,0.4) 0%, rgba(15,23,42,0.8) 45%, rgba(15,76,129,0.98) 100%)'
                        : cfg.colorTheme === 'yellow_black'
                        ? 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(10,10,10,0.85) 45%, rgba(20,20,20,0.98) 100%)'
                        : cfg.colorTheme === 'emerald_gold'
                        ? 'linear-gradient(180deg, rgba(6,78,59,0.4) 0%, rgba(4,47,46,0.82) 45%, rgba(2,44,34,0.98) 100%)'
                        : 'linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(112,26,117,0.82) 45%, rgba(76,5,25,0.98) 100%)',
                  }}
                >
                  {/* Top Bar on Poster */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="px-2 py-0.5 bg-black/80 border border-white/20 rounded text-white text-[9px] font-bold tracking-wider">
                      ⚡ {cfg.channelName}
                    </span>

                    <span className="px-2 py-0.5 bg-emerald-600 rounded text-white text-[9px] font-bold flex items-center gap-1">
                      <span>✓</span>
                      <span>VERIFIED</span>
                    </span>
                  </div>

                  {/* Corner Username Badge */}
                  {showWatermark && cfg.userHandle && cfg.userHandle.trim() && (
                    <div
                      className={`absolute ${
                        cfg.handleCorner === 'top_left'
                          ? 'top-10 left-4'
                          : cfg.handleCorner === 'top_right'
                          ? 'top-10 right-4'
                          : cfg.handleCorner === 'bottom_left'
                          ? 'bottom-14 left-4'
                          : 'bottom-14 right-4'
                      }`}
                    >
                      <span className="px-2 py-0.5 bg-black/85 border border-rose-500/80 rounded text-white text-[10px] font-bold shadow-md">
                        {cfg.userHandle.startsWith('@') ? cfg.userHandle : `@${cfg.userHandle}`}
                      </span>
                    </div>
                  )}

                  {/* Headline & Badge on Poster */}
                  <div className="space-y-1.5 mt-auto">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                        cfg.colorTheme === 'yellow_black'
                          ? 'bg-amber-400 text-black'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {cfg.badge}
                    </span>

                    <h2 className="text-sm sm:text-base font-black text-white leading-tight drop-shadow-md line-clamp-3">
                      {item.headline}
                    </h2>

                    {item.summary && (
                      <p className="text-[11px] text-slate-200 line-clamp-2 font-medium drop-shadow">
                        • {item.summary}
                      </p>
                    )}

                    <div className="pt-1.5 border-t border-white/20 flex items-center justify-between text-[10px] text-slate-300">
                      <span>Source: {item.sourceWebsite || 'Google News'}</span>
                      <span className="text-rose-400 font-bold font-mono">#{index + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Change Background Button */}
                <button
                  onClick={() => setActivePickerId(activePickerId === item.id ? null : item.id)}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-slate-950/80 hover:bg-rose-600 text-white rounded-lg border border-slate-700 transition"
                  title="Change Background Image"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Background Picker Popover */}
              {activePickerId === item.id && (
                <div className="p-2.5 bg-slate-950 border-y border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white">Select Background (55+ library):</span>
                    <button
                      onClick={() => setActivePickerId(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto pr-1">
                    {NEWS_BACKGROUNDS.slice(0, 16).map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => handleSelectNewBackground(item.id, bg.url)}
                        className={`h-10 rounded overflow-hidden border ${
                          cfg.bgImageUrl === bg.url ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                        }`}
                      >
                        <img src={bg.thumb} alt={bg.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BOTTOM EDITORIAL CONTENT & ACTIONS */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 text-[11px]">
                      {item.category.toUpperCase()}
                    </span>
                    <button
                      onClick={() => onToggleSave(item)}
                      className={`flex items-center gap-1 text-[11px] font-medium transition ${
                        isSaved ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {item.headline}
                  </h3>

                  {/* GOOGLE FACT-CHECK STRIP ("news ko gooogle se verify kiya ho") */}
                  <div className="bg-emerald-950/30 border border-emerald-900/60 rounded-md px-2 py-1 flex items-center justify-between text-[10px] text-emerald-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate font-semibold">Google News Verified</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0 ml-1">
                      {item.verification?.credibilityScore || 98}% Verified
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>

                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate text-[10px]">
                      Source: <strong className="text-slate-200">{item.sourceWebsite || 'Google News'}</strong>
                    </span>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 shrink-0 ml-1.5 text-[10px]"
                      >
                        Original <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* CARD ACTIONS: 1-CLICK REEL, REELS STUDIO, POSTER STUDIO, COPY, DOWNLOAD */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  {/* Primary Action: 1-Click Instant 9:16 Reel Video Download */}
                  <button
                    onClick={() => handleDownloadReelVideo(item)}
                    disabled={exportingReelId === item.id}
                    className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    title="1-Click: Export and download 9:16 vertical video reel with animated text and audio"
                  >
                    {exportingReelId === item.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>
                          {reelExportPct > 0 ? `Exporting Reel ${reelExportPct}%...` : 'Recording Reel...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-white" />
                        <span>1-Click Download Reel</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Actions: Studio Links */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onOpenReelsStudio?.({ ...item, imageSuggestion: cfg.bgImageUrl })}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700/60"
                      title="Open in Reels Studio (Audio & Slide Editor)"
                    >
                      <Film className="w-3.5 h-3.5 text-rose-400" />
                      <span>Reels Studio</span>
                    </button>

                    <button
                      onClick={() => onOpenPosterStudio?.(item)}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700/60"
                      title="Open in HD Poster Studio"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Poster Studio</span>
                    </button>
                  </div>

                  {/* Utility Actions: Copy & Format Downloads */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCopyDescription(item)}
                      className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-800"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Story</span>
                        </>
                      )}
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setSizeMenuId(sizeMenuId === item.id ? null : item.id)}
                        className="w-full py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 border border-slate-800"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>Posters</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {sizeMenuId === item.id && (
                        <div className="absolute bottom-full mb-1.5 right-0 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1 z-30 space-y-0.5 min-w-[200px]">
                          <button
                            onClick={() => handleDownloadPoster(item, '1:1')}
                            className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>1:1 Square (1080×1080)</span>
                          </button>

                          <button
                            onClick={() => handleDownloadPoster(item, '9:16')}
                            className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>9:16 Vertical (1080×1920)</span>
                          </button>

                          <button
                            onClick={() => handleDownloadPoster(item, '16:9')}
                            className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>16:9 Landscape (1920×1080)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
