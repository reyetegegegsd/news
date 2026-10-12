import React, { useRef, useEffect, useState } from 'react';
import { PosterConfig, TrendingNewsItem } from '../types';
import { NEWS_BACKGROUNDS, NewsBackground } from '../data/backgrounds';
import {
  Download,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Type,
  Palette,
  Upload,
  User,
  LayoutGrid,
  Maximize2,
  Check,
  Search,
  Filter,
  AlertCircle,
  Radio,
  Zap,
  Save,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface PosterStudioProps {
  config: PosterConfig;
  onChange: (config: PosterConfig) => void;
  onPosterRendered?: (dataUrl: string) => void;
  feedItems?: TrendingNewsItem[];
  onAutoDetectNews?: (item: TrendingNewsItem) => void;
}

const BG_CATEGORIES = [
  { id: 'all', label: 'All Library (55+)' },
  { id: 'studio', label: 'Newsroom & Studio' },
  { id: 'crime', label: 'Emergency & Law' },
  { id: 'tech', label: 'Technology & Cyber' },
  { id: 'politics', label: 'Government & Capitol' },
  { id: 'sports', label: 'Sports Arena' },
  { id: 'business', label: 'Markets & Economy' },
  { id: 'entertainment', label: 'Culture & Cinema' },
  { id: 'world', label: 'Global & Science' },
];

export const PosterStudio: React.FC<PosterStudioProps> = ({
  config,
  onChange,
  onPosterRendered,
  feedItems = [],
  onAutoDetectNews,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'visual' | 'theme'>('text');
  const [bgCategory, setBgCategory] = useState<string>('all');
  const [bgSearch, setBgSearch] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [renderedUrl, setRenderedUrl] = useState<string>('');
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [detectFeedback, setDetectFeedback] = useState<string | null>(null);

  // Auto-Save States for Poster Studio
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [manualSaveFeedback, setManualSaveFeedback] = useState<string | null>(null);

  // Debounced Auto-Save to localStorage
  useEffect(() => {
    setIsAutoSaving(true);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('viralnews_poster_config', JSON.stringify(config));
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.warn('Failed to auto-save poster config:', e);
      } finally {
        setIsAutoSaving(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [config]);

  // Manual 1-Click Save Data Button
  const handleManualSavePoster = () => {
    try {
      localStorage.setItem('viralnews_poster_config', JSON.stringify(config));
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setManualSaveFeedback('✅ पोस्टर डेटा सुरक्षित हो गया! Poster Data Saved.');
      setTimeout(() => setManualSaveFeedback(null), 3000);
    } catch (e) {
      console.warn('Failed to save poster data:', e);
    }
  };

  const applyNewsItem = (item: TrendingNewsItem) => {
    onChange({
      ...config,
      badge: item.badge || '🚨 BREAKING NEWS',
      mainHeadline: item.headline,
      subHeadline: item.summary,
      bgImageUrl: item.imageSuggestion || item.autoPoster?.bgImageUrl || config.bgImageUrl,
      colorTheme: item.autoPoster?.colorTheme || config.colorTheme || 'red_dark',
      highlightStat: item.autoPoster?.highlightStat || '100% VERIFIED REPORT',
    });
    setDetectFeedback(`ताज़ा खबर सेट: ${item.headline.slice(0, 36)}...`);
    setTimeout(() => setDetectFeedback(null), 3500);
    if (onAutoDetectNews) {
      onAutoDetectNews(item);
    }
  };

  const handleAutoDetectLatest = async () => {
    if (feedItems && feedItems.length > 0) {
      applyNewsItem(feedItems[0]);
      return;
    }
    try {
      const res = await fetch('/api/news/trending?category=all&country=IN&limit=5');
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        applyNewsItem(data.news[0]);
      }
    } catch (e) {
      console.error('Failed to auto-detect live news:', e);
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [config]);

  const getCanvasDimensions = (aspectRatio: '1:1' | '9:16' | '16:9' | '4:5') => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 1080, height: 1920 };
      case '16:9':
        return { width: 1920, height: 1080 };
      case '4:5':
        return { width: 1080, height: 1350 };
      case '1:1':
      default:
        return { width: 1080, height: 1080 };
    }
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsRendering(true);
    const { width, height } = getCanvasDimensions(config.aspectRatio);
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = config.bgImageUrl || NEWS_BACKGROUNDS[0].url;

    img.onload = () => {
      drawPoster(ctx, img, width, height, config);
      const url = canvas.toDataURL('image/png');
      setRenderedUrl(url);
      if (onPosterRendered) {
        onPosterRendered(url);
      }
      setIsRendering(false);
    };

    img.onerror = () => {
      drawPoster(ctx, null, width, height, config);
      const url = canvas.toDataURL('image/png');
      setRenderedUrl(url);
      if (onPosterRendered) {
        onPosterRendered(url);
      }
      setIsRendering(false);
    };
  };

  const drawPoster = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | null,
    width: number,
    height: number,
    cfg: PosterConfig
  ) => {
    // 1. Draw Background Image (Cover Fit)
    if (img) {
      const imgAspect = img.width / img.height;
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
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. High-Contrast Broadcast Gradient Overlay
    const theme = cfg.colorTheme;
    const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);

    if (theme === 'red_dark') {
      overlayGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      overlayGrad.addColorStop(0.35, 'rgba(15, 23, 42, 0.78)');
      overlayGrad.addColorStop(1, 'rgba(127, 29, 29, 0.98)');
    } else if (theme === 'neon_blue') {
      overlayGrad.addColorStop(0, 'rgba(10, 15, 30, 0.4)');
      overlayGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.78)');
      overlayGrad.addColorStop(1, 'rgba(15, 76, 129, 0.98)');
    } else if (theme === 'yellow_black') {
      overlayGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      overlayGrad.addColorStop(0.35, 'rgba(10, 10, 10, 0.85)');
      overlayGrad.addColorStop(1, 'rgba(20, 20, 20, 0.99)');
    } else if (theme === 'emerald_gold') {
      overlayGrad.addColorStop(0, 'rgba(6, 78, 59, 0.4)');
      overlayGrad.addColorStop(0.45, 'rgba(4, 47, 46, 0.82)');
      overlayGrad.addColorStop(1, 'rgba(2, 44, 34, 0.99)');
    } else {
      overlayGrad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      overlayGrad.addColorStop(0.45, 'rgba(112, 26, 117, 0.82)');
      overlayGrad.addColorStop(1, 'rgba(76, 5, 25, 0.99)');
    }

    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Top Broadcast Bar
    const topBar = ctx.createLinearGradient(0, 0, width, 0);
    topBar.addColorStop(0, '#ef4444');
    topBar.addColorStop(0.5, '#eab308');
    topBar.addColorStop(1, '#3b82f6');
    ctx.fillStyle = topBar;
    ctx.fillRect(0, 0, width, 14);

    const paddingX = Math.round(width * 0.07);
    const headerY = Math.round(height * 0.06);

    // 3. Channel Branding Pill
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    roundRect(ctx, paddingX, headerY, 260, 48, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(`⚡ ${cfg.channelName.toUpperCase()}`, paddingX + 20, headerY + 32);

    // Date / Live Indicator Badge
    ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
    roundRect(ctx, width - paddingX - 160, headerY, 160, 48, 24);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`🔴 ${cfg.dateBadge || 'LIVE REPORT'}`, width - paddingX - 148, headerY + 31);
    ctx.restore();

    // 4. USERNAME SHOW IN CORNER (Requested by user)
    if (cfg.userHandle) {
      drawCornerUsername(ctx, width, height, paddingX, cfg);
    }

    // 5. Middle Content: Breaking News Badge
    let contentStartY = height * 0.36;
    if (cfg.aspectRatio === '9:16') contentStartY = height * 0.44;
    if (cfg.aspectRatio === '4:5') contentStartY = height * 0.38;
    if (cfg.aspectRatio === '16:9') contentStartY = height * 0.30;

    ctx.save();
    let badgeColor = '#ef4444';
    if (theme === 'yellow_black') badgeColor = '#eab308';
    if (theme === 'neon_blue') badgeColor = '#06b6d4';
    if (theme === 'emerald_gold') badgeColor = '#10b981';

    ctx.fillStyle = badgeColor;
    const badgeText = cfg.badge ? cfg.badge.toUpperCase() : 'BREAKING NEWS';
    ctx.font = '900 28px system-ui, -apple-system, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 50;
    roundRect(ctx, paddingX, contentStartY, badgeWidth, 54, 8);
    ctx.fill();

    ctx.fillStyle = theme === 'yellow_black' ? '#000000' : '#ffffff';
    ctx.fillText(badgeText, paddingX + 25, contentStartY + 37);
    ctx.restore();

    // 6. Main Headline (Multi-line wrap)
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.88)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;

    let headlineFontSize = 48;
    if (cfg.aspectRatio === '9:16') headlineFontSize = 54;
    if (cfg.aspectRatio === '16:9') headlineFontSize = 44;
    if (cfg.aspectRatio === '4:5') headlineFontSize = 50;

    ctx.font = `800 ${headlineFontSize}px system-ui, -apple-system, sans-serif`;

    const maxTextWidth = width - paddingX * 2;
    const isHeadlineEmpty = !cfg.mainHeadline || cfg.mainHeadline.trim().length === 0;
    const displayHeadline = isHeadlineEmpty ? 'यहाँ अपनी ब्रेकिंग न्यूज़ हेडलाइन लिखें...' : cfg.mainHeadline;
    if (isHeadlineEmpty) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    }
    const headlineLines = wrapText(ctx, displayHeadline, maxTextWidth);

    let lineY = contentStartY + 95;
    const lineHeight = headlineFontSize * 1.25;

    headlineLines.slice(0, 5).forEach((line) => {
      ctx.fillText(line, paddingX, lineY);
      lineY += lineHeight;
    });
    ctx.restore();

    // 7. Sub-headline / Key Fact
    if (cfg.subHeadline) {
      ctx.save();
      ctx.fillStyle = theme === 'yellow_black' ? '#fde047' : '#93c5fd';
      const subFontSize = cfg.aspectRatio === '16:9' ? 24 : 28;
      ctx.font = `600 ${subFontSize}px system-ui, sans-serif`;

      const subLines = wrapText(ctx, cfg.subHeadline, maxTextWidth);
      lineY += 15;
      subLines.slice(0, 2).forEach((sLine) => {
        ctx.fillText(`• ${sLine}`, paddingX, lineY);
        lineY += subFontSize * 1.35;
      });
      ctx.restore();
    }

    // 8. Highlight Stat Strip
    if (cfg.highlightStat) {
      ctx.save();
      lineY += 15;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      const statW = Math.min(maxTextWidth, 440);
      roundRect(ctx, paddingX, lineY, statW, 46, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(`📌 ${cfg.highlightStat}`, paddingX + 20, lineY + 30);
      ctx.restore();
    }

    // 9. Bottom Footer
    const footerY = height - Math.round(height * 0.075);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingX, footerY - 18);
    ctx.lineTo(width - paddingX, footerY - 18);
    ctx.stroke();

    ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
    ctx.font = '500 20px system-ui, sans-serif';
    ctx.fillText('Follow for 24/7 Verified Coverage • Live Broadcast Feed', paddingX, footerY + 12);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('GLOBAL WIRE', width - paddingX - 150, footerY + 12);
    ctx.restore();
  };

  const drawCornerUsername = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    paddingX: number,
    cfg: PosterConfig
  ) => {
    ctx.save();
    const handleText = cfg.userHandle.startsWith('@') ? cfg.userHandle : `@${cfg.userHandle}`;
    ctx.font = 'bold 20px system-ui, sans-serif';
    const textWidth = ctx.measureText(handleText).width + 50;
    const badgeHeight = 42;

    let posX = paddingX;
    let posY = 120;

    switch (cfg.handleCorner) {
      case 'top_left':
        posX = paddingX;
        posY = 120;
        break;
      case 'top_right':
        posX = width - paddingX - textWidth;
        posY = 120;
        break;
      case 'bottom_left':
        posX = paddingX;
        posY = height - 130;
        break;
      case 'bottom_right':
      default:
        posX = width - paddingX - textWidth;
        posY = height - 130;
        break;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2;
    roundRect(ctx, posX, posY, textWidth, badgeHeight, 21);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(handleText, posX + 16, posY + 28);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('✓', posX + textWidth - 26, posY + 28);

    ctx.restore();
  };

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
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

  const handleDownloadCurrent = () => {
    if (!renderedUrl) return;
    const a = document.createElement('a');
    a.href = renderedUrl;
    a.download = `GlobalNews-Poster-${config.aspectRatio.replace(':', 'x')}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllSizes = async () => {
    setBatchDownloading(true);
    const sizes: ('1:1' | '9:16' | '16:9' | '4:5')[] = ['1:1', '9:16', '16:9', '4:5'];

    for (const size of sizes) {
      const tempCanvas = document.createElement('canvas');
      const { width, height } = getCanvasDimensions(size);
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = config.bgImageUrl || NEWS_BACKGROUNDS[0].url;

        await new Promise((resolve) => {
          img.onload = () => {
            drawPoster(tempCtx, img, width, height, { ...config, aspectRatio: size });
            const url = tempCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `GlobalNews-${size.replace(':', 'x')}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(resolve, 300);
          };
          img.onerror = () => {
            drawPoster(tempCtx, null, width, height, { ...config, aspectRatio: size });
            const url = tempCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `GlobalNews-${size.replace(':', 'x')}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(resolve, 300);
          };
        });
      }
    }
    setBatchDownloading(false);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({ ...config, bgImageUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredBackgrounds = NEWS_BACKGROUNDS.filter((bg) => {
    const matchesCat = bgCategory === 'all' || bg.category === bgCategory;
    const matchesSearch =
      !bgSearch.trim() ||
      bg.name.toLowerCase().includes(bgSearch.toLowerCase()) ||
      bg.category.toLowerCase().includes(bgSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-white">Broadcast News Poster Studio</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            55+ Media Backgrounds · Corner Username Display · High-Res Downloads (1:1, 9:16, 16:9, 4:5)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Auto-Save Status Badge & Manual Save Button */}
          {isAutoSaving ? (
            <span className="text-amber-300 font-bold text-xs flex items-center gap-1 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>ऑटो-सेव...</span>
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>✓ ऑटो-सेव: सुरक्षित ({lastSavedTime})</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleManualSavePoster}
            className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 border border-emerald-600/40 shadow-xs"
            title="Save current poster data to storage"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>डेटा सेव करें (Save)</span>
          </button>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['1:1', '9:16', '16:9', '4:5'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => onChange({ ...config, aspectRatio: ratio })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  config.aspectRatio === ratio
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {ratio === '1:1'
                  ? '1:1 Square'
                  : ratio === '9:16'
                  ? '9:16 Story'
                  : ratio === '16:9'
                  ? '16:9 Banner'
                  : '4:5 Portrait'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Canvas Preview */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 relative">
          <div
            className="w-full max-w-[430px] flex items-center justify-center overflow-hidden rounded-lg shadow-2xl relative"
            style={{
              aspectRatio:
                config.aspectRatio === '9:16'
                  ? '9/16'
                  : config.aspectRatio === '16:9'
                  ? '16/9'
                  : config.aspectRatio === '4:5'
                  ? '4/5'
                  : '1/1',
              maxHeight: '520px',
            }}
          >
            <canvas ref={canvasRef} className="w-full h-full object-contain rounded-lg" />
            {isRendering && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-2 text-rose-400 text-sm font-semibold">
                <RefreshCw className="w-5 h-5 animate-spin" /> Rendering Broadcast Poster...
              </div>
            )}
          </div>

          {/* Download Buttons Bar & Save Data */}
          <div className="w-full max-w-[430px] mt-4 space-y-2">
            {manualSaveFeedback && (
              <div className="bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-center py-1.5 px-3 rounded-lg text-xs font-bold animate-in fade-in">
                {manualSaveFeedback}
              </div>
            )}

            <button
              type="button"
              onClick={handleManualSavePoster}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-emerald-950/80 text-emerald-300 hover:text-emerald-200 text-xs font-bold rounded-lg border border-emerald-600/40 transition shadow-xs"
              title="Save all poster headlines, colors, and layout"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>💾 पोस्टर डेटा सेव करें (Save Poster Data)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadCurrent}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Download ({config.aspectRatio})</span>
              </button>

              <button
                onClick={handleDownloadAllSizes}
                disabled={batchDownloading}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 transition-colors"
              >
                {batchDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Saving Sizes...</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 text-slate-400" />
                    <span>Download All 4 Sizes</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400">
              * Supports 1080x1080 (Square), 1080x1920 (Story), 1920x1080 (Banner), 1080x1350 (Portrait)
            </p>
          </div>
        </div>

        {/* Right Column: Customizer Tabs & 55+ Backgrounds */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'text'
                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Type className="w-3.5 h-3.5" /> <span>1. Headline & Branding</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'visual'
                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> <span>2. Background Photos (55+)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('theme')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'theme'
                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Palette className="w-3.5 h-3.5" /> <span>3. Color Themes</span>
            </button>
          </div>

          {/* TAB 1: 55+ News Backgrounds + Upload */}
          {activeTab === 'visual' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-dashed border-rose-500/40 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-rose-400" /> Upload Your Own Custom Media Photo:
                  </div>
                  <p className="text-[10px] text-slate-400">JPG, PNG, or WebP high-resolution photo</p>
                </div>
                <label className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow">
                  Browse File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Backgrounds Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={bgSearch}
                  onChange={(e) => setBgSearch(e.target.value)}
                  placeholder="Search 55+ backgrounds (e.g., Stadium, Parliament, Studio, Wall Street)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {BG_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setBgCategory(c.id)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      bgCategory === c.id
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Backgrounds Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredBackgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => onChange({ ...config, bgImageUrl: bg.url })}
                    className={`relative rounded-xl overflow-hidden h-20 border text-left p-1.5 flex flex-col justify-end transition group ${
                      config.bgImageUrl === bg.url
                        ? 'border-rose-500 ring-2 ring-rose-500/40'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={bg.thumb}
                      alt={bg.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <span className="relative text-[9px] font-bold text-white z-10 line-clamp-1">
                      {bg.name}
                    </span>
                    {config.bgImageUrl === bg.url && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold z-10">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: HEADLINES, CONTENT & AUTO-DETECT */}
          {activeTab === 'text' && (
            <div className="flex flex-col gap-3">
              {/* LIVE NEWS AUTO-DETECT & QUICK SWITCHER BAR */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      ⚡ लाइव न्यूज़ डिटेक्ट (Auto-Detect Live):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {detectFeedback ? (
                        <span className="text-emerald-400 font-bold">{detectFeedback}</span>
                      ) : (
                        feedItems && feedItems.length > 0
                          ? `${feedItems.length} लाइव खबरें उपलब्ध`
                          : 'Live feed available'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAutoDetectLatest}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 shadow"
                    title="Auto-detect latest breaking news into poster"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto-Detect News</span>
                  </button>
                  {feedItems && feedItems.length > 0 && (
                    <select
                      onChange={(e) => {
                        const selected = feedItems.find((f) => f.id === e.target.value);
                        if (selected) applyNewsItem(selected);
                      }}
                      className="flex-1 sm:flex-none bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 max-w-[200px] truncate focus:outline-none focus:border-rose-500 font-medium"
                      defaultValue=""
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

              {/* USERNAME INPUT & CORNER POSITION */}
              <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Channel Handle / Username (Shown in Poster Corner):
                  </label>
                  <span className="text-[10px] text-slate-400">Verified Badge</span>
                </div>
                <input
                  type="text"
                  value={config.userHandle || ''}
                  onChange={(e) => onChange({ ...config, userHandle: e.target.value })}
                  placeholder="Enter your handle (e.g. @GlobalNewsLive)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                />

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Select Poster Corner Position:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'top_left', label: '↖️ Top-Left' },
                      { id: 'top_right', label: '↗️ Top-Right' },
                      { id: 'bottom_left', label: '↙️ Bot-Left' },
                      { id: 'bottom_right', label: '↘️ Bot-Right' },
                    ].map((corner) => (
                      <button
                        key={corner.id}
                        onClick={() => onChange({ ...config, handleCorner: corner.id as any })}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition ${
                          config.handleCorner === corner.id
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {corner.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Breaking Ribbon Badge Text:
                </label>
                <input
                  type="text"
                  value={config.badge}
                  onChange={(e) => onChange({ ...config, badge: e.target.value })}
                  placeholder="e.g., 🚨 BREAKING NEWS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Primary Headline (Large Bold Typography):
                </label>
                <textarea
                  rows={2}
                  value={config.mainHeadline}
                  onChange={(e) => onChange({ ...config, mainHeadline: e.target.value })}
                  placeholder="Enter primary bold headline..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sub-Headline / Core Takeaway:
                </label>
                <input
                  type="text"
                  value={config.subHeadline}
                  onChange={(e) => onChange({ ...config, subHeadline: e.target.value })}
                  placeholder="Enter takeaway summary..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Channel Brand / Channel Name:
                  </label>
                  <input
                    type="text"
                    value={config.channelName}
                    onChange={(e) => onChange({ ...config, channelName: e.target.value })}
                    placeholder="GLOBAL NEWS 24"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Highlight Stat / Verified Tag:
                  </label>
                  <input
                    type="text"
                    value={config.highlightStat}
                    onChange={(e) => onChange({ ...config, highlightStat: e.target.value })}
                    placeholder="100% VERIFIED REPORT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Theme Selector */}
          {activeTab === 'theme' && (
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-medium text-slate-300">
                Broadcast Graphics Color Theme:
              </label>

              {[
                { id: 'red_dark', name: '🔴 Breaking Crimson (Reuters / BBC Anchor Style)', desc: 'Dark crimson gradient with high-contrast bold white' },
                { id: 'neon_blue', name: '⚡ Cyber Tech Cyan (Bloomberg / Wired Style)', desc: 'Electric cyan and deep navy contrast' },
                { id: 'yellow_black', name: '🟡 High-Impact Gold (Sports & Breaking Alert)', desc: 'Intense golden yellow and deep obsidian black' },
                { id: 'emerald_gold', name: '🟢 Financial Markets (Wall Street / FT Style)', desc: 'Rich emerald green and sovereign gold accents' },
                { id: 'magenta_fire', name: '🟣 Cinema & Entertainment (Variety / Glamour)', desc: 'Deep magenta violet and energetic neon contrast' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChange({ ...config, colorTheme: t.id as any })}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border text-left transition ${
                    config.colorTheme === t.id
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">{t.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
                  </div>
                  {config.colorTheme === t.id && (
                    <span className="text-rose-400 text-xs font-bold">✓ Selected</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
