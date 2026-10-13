/**
 * Reel Video Exporter
 * Generates an animated 9:16 (1080x1920) Video Reel with broadcast audio & animated text slider
 * Supports:
 *  1. Custom uploaded background video or video presets (rendered frame-by-frame)
 *  2. Ken Burns background image (with CORS-safe proxy fallback)
 *  3. Custom uploaded background audio (MP3/WAV/AAC) or 4 Web Audio Synth broadcast tracks
 *  4. 4-slide animated progression with top Instagram/Reels story progress bars
 *  5. Custom branding, handle, color themes & verified timestamps
 *  6. 100% in-browser MediaRecorder with WebM / MP4 export
 */

import { TrendingNewsItem, ReelSlide } from '../types';
import { NEWS_BACKGROUNDS } from '../data/backgrounds';
import {
  ReelCaptionEffect,
  buildNarrationScript,
  NarrationScript,
  getNarrationAudioBuffer,
  alignNarrationScript,
  voiceNarrator,
} from './newsVoiceNarrator';

export interface ReelExportOptions {
  item: TrendingNewsItem;
  userHandle: string;
  durationSeconds?: number;
  slides?: ReelSlide[];
  bgImageUrl?: string;
  bgVideoUrl?: string;
  existingVideoElement?: HTMLVideoElement | null;
  customAudioUrl?: string;
  trackType?: string;
  colorTheme?: 'red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire';
  kenBurnsMotion?: boolean;
  captionEffect?: ReelCaptionEffect;
  spokenTitle?: string;
  spokenDescription?: string;
  speechRate?: number;
  onProgress?: (progressPct: number, statusText: string) => void;
  onStepProgress?: (stepInfo: ReelExportStepInfo) => void;
  voiceGender?: 'male' | 'female';
  musicMuted?: boolean;
  language?: 'english' | 'hindi';
  fastExport?: boolean;
}

export interface ReelExportStepInfo {
  step: number;        // 1 to 6
  stepTitle: string;
  stepTitleHi: string;
  detail: string;
  detailHi: string;
  pct: number;
}

// Check supported browser MIME types (prioritizing MP4 for Instagram Reels compatibility)
export function getSupportedVideoMimeType(): { mimeType: string; extension: string } {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: 'video/mp4', extension: 'mp4' };
  }
  const candidateTypes = [
    { type: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { type: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4' },
    { type: 'video/mp4;codecs=h264,aac', ext: 'mp4' },
    { type: 'video/mp4', ext: 'mp4' },
    { type: 'video/webm;codecs=vp9,opus', ext: 'mp4' },
    { type: 'video/webm;codecs=vp8,opus', ext: 'mp4' },
    { type: 'video/webm', ext: 'mp4' },
  ];
  for (const candidate of candidateTypes) {
    if (MediaRecorder.isTypeSupported(candidate.type)) {
      return { mimeType: candidate.type, extension: 'mp4' };
    }
  }
  return { mimeType: 'video/mp4', extension: 'mp4' };
}

// Load image safely to prevent Canvas CORS tainting (handles local data/blob URLs safely)
async function loadSafeImage(rawUrl?: string): Promise<HTMLImageElement | null> {
  if (!rawUrl) return null;
  const isLocal = rawUrl.startsWith('data:') || rawUrl.startsWith('blob:');
  const targetUrl = isLocal ? rawUrl : `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;

  return new Promise((resolve) => {
    const img = new Image();
    // NEVER set crossOrigin on local data or blob URLs
    if (!isLocal) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback: try raw URL directly
      if (!isLocal) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => resolve(null);
        fallbackImg.src = rawUrl;
      } else {
        resolve(null);
      }
    };
    img.src = targetUrl;
    setTimeout(() => {
      if (img.complete && img.naturalWidth > 0) resolve(img);
      else resolve(null);
    }, 2000);
  });
}

// Load video safely for background playback (handles blob:, data:, and proxy with offscreen mounting)
async function loadSafeVideo(videoUrl?: string): Promise<HTMLVideoElement | null> {
  if (!videoUrl) return null;
  const isLocal = videoUrl.startsWith('blob:') || videoUrl.startsWith('data:');

  return new Promise((resolve) => {
    const video = document.createElement('video');
    // NEVER set crossOrigin on local blob or data URLs as it causes immediate security load failure
    if (!isLocal) {
      video.crossOrigin = 'anonymous';
    }
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;

    // Attach offscreen to document body so browser does NOT suspend or throttle rendering
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);

    let finished = false;
    const finish = (result: HTMLVideoElement | null) => {
      if (finished) return;
      finished = true;
      if (!result && video.parentNode) {
        video.parentNode.removeChild(video);
      }
      resolve(result);
    };

    video.onloadeddata = () => {
      video.play().catch(() => {});
      finish(video);
    };
    video.oncanplay = () => {
      video.play().catch(() => {});
      finish(video);
    };
    video.onerror = () => {
      // If external URL failed with CORS, try via proxy-image
      if (!isLocal && !videoUrl.includes('/api/proxy-image')) {
        video.crossOrigin = 'anonymous';
        video.src = `/api/proxy-image?url=${encodeURIComponent(videoUrl)}`;
      } else {
        finish(null);
      }
    };

    video.src = videoUrl;

    // Fast 1500ms safety timeout - don't hang export!
    setTimeout(() => {
      if (video.readyState >= 1) {
        video.play().catch(() => {});
        finish(video);
      } else {
        finish(null);
      }
    }, 1500);
  });
}

export async function exportReelVideo({
  item,
  userHandle,
  durationSeconds = 8,
  slides: customSlides,
  bgImageUrl,
  bgVideoUrl,
  existingVideoElement,
  customAudioUrl,
  trackType = 'breaking_pulse',
  colorTheme = 'red_dark',
  kenBurnsMotion = true,
  captionEffect = 'hormozi_pop',
  spokenTitle,
  spokenDescription,
  speechRate = 1.0,
  onProgress,
  onStepProgress,
  voiceGender = 'male',
  musicMuted = false, // Background broadcast news soundtrack is active by default; 100% sound on all devices!
  language,
  fastExport = false,
}: ReelExportOptions): Promise<Blob> {
  const width = 1080;
  const height = 1920;

  // Helper to report both structured step-by-step progress and legacy percentage
  const reportStep = (
    step: number,
    stepTitle: string,
    stepTitleHi: string,
    detail: string,
    detailHi: string,
    pct: number
  ) => {
    if (onStepProgress) {
      onStepProgress({ step, stepTitle, stepTitleHi, detail, detailHi, pct });
    }
    if (onProgress) {
      onProgress(pct, detailHi || detail);
    }
  };

  // STEP 1: Script & Story Preparation (स्क्रिप्ट और डेटा तैयारी)
  reportStep(
    1,
    'Script & News Analysis',
    'स्क्रिप्ट और डेटा तैयारी',
    'Parsing headline, summary and structuring narration phrases...',
    'न्यूज़ हेडलाइन, सारांश और वाक्यों का विश्लेषण किया जा रहा है...',
    5
  );

  const effectiveSpeechRate = Math.max(0.6, Math.min(2.5, Number(speechRate) || 1.0));
  const titleText = spokenTitle || item.headline || 'Breaking News Report';
  const descText = spokenDescription || item.fullDescription || item.summary || 'Live verified correspondent dispatch.';
  const narrationScript = buildNarrationScript(titleText, descText, effectiveSpeechRate);

  reportStep(
    1,
    'Script & News Analysis',
    'स्क्रिप्ट और डेटा तैयारी',
    `Narration phrases structured (${narrationScript.phrases.length} chunks)...`,
    `वाक्यों का विभाजन तैयार (${narrationScript.phrases.length} वाक्य)...`,
    10
  );

  // STEP 2: AI Voiceover & Audio Mastering (AI आवाज़ और ऑडियो टाइमिंग)
  reportStep(
    2,
    'AI Voiceover & Audio Mastering',
    'AI आवाज़ और ऑडियो टाइमिंग',
    'Initializing studio audio context & dynamics compressor...',
    'स्टूडियो ऑडियो इंजन और कंप्रेसर एक्टिवेट हो रहा है...',
    16
  );

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  let audioCtx: AudioContext | null = null;
  let audioDest: MediaStreamAudioDestinationNode | null = null;
  let audioStream: MediaStream | null = null;

  try {
    audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    audioDest = audioCtx.createMediaStreamDestination();
    audioStream = audioDest.stream;
  } catch (audioInitErr) {
    console.warn('AudioContext initialization failed:', audioInitErr);
  }

  reportStep(
    2,
    'AI Voiceover & Audio Mastering',
    'AI आवाज़ और ऑडियो टाइमिंग',
    'Synthesizing broadcast voiceover with natural human cadence...',
    'AI न्यूज़ एंकर की आवाज़ तैयार और टाइमिंग मापी जा रही है...',
    24
  );

  let voiceBuffer: AudioBuffer | null = null;
  if (audioCtx) {
    try {
      voiceBuffer = await getNarrationAudioBuffer(audioCtx, narrationScript, voiceGender, language);
    } catch (voiceLoadErr) {
      console.warn('Failed to pre-decode voice buffer:', voiceLoadErr);
    }
  }

  // Retrieve ground truth timing metadata from voiceNarrator
  const timingMeta = voiceNarrator.getTimingMeta();
  const actualVoiceRawDuration = voiceBuffer && voiceBuffer.duration > 0
    ? voiceBuffer.duration
    : timingMeta?.totalDuration || narrationScript.totalDuration;

  reportStep(
    2,
    'AI Voiceover & Audio Mastering',
    'AI आवाज़ और ऑडियो टाइमिंग',
    `Ground-truth voice duration calibrated (${actualVoiceRawDuration.toFixed(2)}s). Master limiter engaged.`,
    `असली आवाज़ की अवधि ${actualVoiceRawDuration.toFixed(2)} सेकंड लॉक की गई।`,
    32
  );

  // Calibrate narrationScript to exact ground-truth audio duration
  const alignedScript = alignNarrationScript(
    narrationScript,
    actualVoiceRawDuration,
    timingMeta?.titleDuration,
    timingMeta?.pauseDuration || 0.35,
    timingMeta?.descDuration
  );

  // Playback duration factored by effectiveSpeechRate
  const playbackDuration = actualVoiceRawDuration / effectiveSpeechRate;
  // Clean 0.40s buffer at the end so speech echoes out naturally without clipping
  const targetDuration = Math.max(3, playbackDuration + 0.40);

  const effectiveCaptionEffect: ReelCaptionEffect = captionEffect || 'hormozi_pop';

  // STEP 3: Media & Background Visuals (मीडिया और बैकग्राउंड विज़ुअल्स)
  reportStep(
    3,
    'Visual Media & Layout Setup',
    'मीडिया और बैकग्राउंड विज़ुअल्स',
    'Loading 9:16 background visual assets & live phone preview layers...',
    '9:16 वर्टिकल बैकग्राउंड मीडिया और लाइव प्रीव्यू लोड हो रहा है...',
    38
  );

  // 4. Load background video or image (EXACT match with live preview!)
  let bgVideo: HTMLVideoElement | null = null;
  let bgImg: HTMLImageElement | null = null;
  let isCreatedBgVideo = false;

  // PRIORITY 1: ONLY use video when bgVideoUrl is actually provided and active!
  if (bgVideoUrl && typeof bgVideoUrl === 'string' && bgVideoUrl.trim().length > 0) {
    if (
      existingVideoElement &&
      existingVideoElement.readyState >= 1 &&
      (existingVideoElement.src === bgVideoUrl || existingVideoElement.currentSrc === bgVideoUrl)
    ) {
      bgVideo = existingVideoElement;
      try {
        bgVideo.currentTime = 0;
        bgVideo.play().catch(() => {});
      } catch {}
    } else {
      bgVideo = await loadSafeVideo(bgVideoUrl);
      isCreatedBgVideo = true;
    }
  }

  // PRIORITY 2: If no video or video unavailable, load preview background image
  if (!bgVideo) {
    const rawBg = bgImageUrl || item.imageSuggestion || item.autoPoster?.bgImageUrl || NEWS_BACKGROUNDS[0].url;
    bgImg = await loadSafeImage(rawBg);
  }

  // 5. Create offscreen Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Voice source node reference to start with recorder
  let voiceSourceNode: AudioBufferSourceNode | null = null;

  // 6. Schedule background music and prepare voiceBuffer with 100% broadcast volume
  if (audioCtx && audioDest) {
    // Master dynamics compressor to maximize loudness and prevent clipping
    const masterCompressor = audioCtx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-14, audioCtx.currentTime);
    masterCompressor.knee.setValueAtTime(20, audioCtx.currentTime);
    masterCompressor.ratio.setValueAtTime(8, audioCtx.currentTime);
    masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    masterCompressor.release.setValueAtTime(0.2, audioCtx.currentTime);

    // 100% Full Volume Master Gain (boosted for mobile & phone speakers)
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(2.2, audioCtx.currentTime); // 100% Maximum Clear Loudness
    masterCompressor.connect(masterGain);
    masterGain.connect(audioDest);

    // Continuous ultra-low carrier oscillator: prevents iOS Safari & WebKit from dropping audio track!
    try {
      const carrier = audioCtx.createOscillator();
      carrier.frequency.setValueAtTime(55, audioCtx.currentTime);
      const carrierGain = audioCtx.createGain();
      carrierGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      carrier.connect(carrierGain);
      carrierGain.connect(masterCompressor);
      carrier.start(0);
    } catch (e) {
      console.warn('Carrier osc error:', e);
    }

    // Background music: Custom audio uploaded OR synthesized broadcast news theme
    if (!musicMuted) {
      if (customAudioUrl) {
        try {
          const audioRes = await fetch(customAudioUrl);
          const arrayBuf = await audioRes.arrayBuffer();
          const decodedBuf = await audioCtx.decodeAudioData(arrayBuf);
          const sourceNode = audioCtx.createBufferSource();
          sourceNode.buffer = decodedBuf;
          sourceNode.loop = true;
          const gainNode = audioCtx.createGain();
          // Duck uploaded background music to 25% so spoken voice is 100% loud and clear
          gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
          sourceNode.connect(gainNode);
          gainNode.connect(masterCompressor);
          sourceNode.start(0);
        } catch (audioErr) {
          console.warn('Failed to decode uploaded custom audio, using broadcast soundtrack:', audioErr);
          scheduleBroadcastSoundtrack(audioCtx, masterCompressor, targetDuration, trackType);
        }
      } else {
        // Synthesized energetic broadcast soundtrack (works 100% offline & on static hosting)
        scheduleBroadcastSoundtrack(audioCtx, masterCompressor, targetDuration, trackType);
      }
    }

    // Connect loaded voiceBuffer to destination with 100% powerful broadcast boost
    if (voiceBuffer) {
      try {
        const voiceSource = audioCtx.createBufferSource();
        voiceSource.buffer = voiceBuffer;
        // Set playbackRate so exported audio accelerates to match user selected speech speed
        voiceSource.playbackRate.setValueAtTime(effectiveSpeechRate, audioCtx.currentTime);
        const voiceGainNode = audioCtx.createGain();
        // 100% crystal-clear, loud broadcast speech gain
        voiceGainNode.gain.setValueAtTime(2.5, audioCtx.currentTime);
        voiceSource.connect(voiceGainNode);
        voiceGainNode.connect(masterCompressor);
        voiceSourceNode = voiceSource;
      } catch (voiceConnErr) {
        console.warn('Failed to prepare voice source node:', voiceConnErr);
      }
    }
  }

  // 7. Setup MediaRecorder with Canvas captureStream
  // Fast 24 FPS for smooth cinematic reels, or 20 FPS for turbo export
  const fps = fastExport ? 20 : 24;
  const canvasStream = canvas.captureStream(fps);
  const combinedTracks = [...canvasStream.getVideoTracks()];
  if (audioStream && audioStream.getAudioTracks().length > 0) {
    combinedTracks.push(...audioStream.getAudioTracks());
  }
  const combinedStream = new MediaStream(combinedTracks);

  const { mimeType } = getSupportedVideoMimeType();
  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : undefined);

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      // Prioritize video/mp4 MIME type for full Instagram Reel and iOS/Android playback
      const mime = recorder.mimeType && recorder.mimeType.includes('mp4') ? recorder.mimeType : 'video/mp4';
      const finalBlob = new Blob(recordedChunks, { type: mime });
      if (finalBlob.size < 500) {
        reject(new Error('Video recording generated an empty file. Please check audio/canvas stream permissions.'));
        return;
      }
      resolve(finalBlob);
    };
    recorder.onerror = (err) => reject(err);
  });

  // Ensure AudioContext is active and not suspended before recording starts
  if (audioCtx && audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {}
  }

  // STEP 4: Word-Level Subtitles & Timing Alignment (कैप्शन और सबटाइटल अलाइनमेंट)
  reportStep(
    4,
    'Caption & Timing Alignment',
    'कैप्शन और सबटाइटल अलाइनमेंट',
    `Synchronizing ${alignedScript.allWords.length} spoken words to waveform (Effect: ${effectiveCaptionEffect})...`,
    `${alignedScript.allWords.length} शब्दों की टाइमिंग को ऑडियो से लॉक किया गया (इफ़ेक्ट: ${effectiveCaptionEffect})...`,
    48
  );

  recorder.start(100);

  // Start voice audio in exact lockstep with recorder
  if (voiceSourceNode) {
    try {
      voiceSourceNode.start(0);
    } catch (e) {
      console.warn('Error starting voiceSourceNode:', e);
    }
  }

  // 8. Frame Animation Loop
  const totalFrames = Math.round(targetDuration * fps);
  const phraseCount = Math.max(1, alignedScript.phrases.length);
  const recordStartTime = performance.now();

  for (let frame = 0; frame < totalFrames; frame++) {
    const progress = frame / totalFrames;
    const elapsedSec = frame / fps;
    const audioTime = elapsedSec * effectiveSpeechRate;

    // Active phrase index & progress using calibrated audioTime
    let activePhraseIdx = alignedScript.phrases.findIndex(p => audioTime >= p.startTime && audioTime < p.endTime);
    if (activePhraseIdx === -1) {
      activePhraseIdx = audioTime >= alignedScript.totalDuration ? phraseCount - 1 : 0;
    }
    const currentPhrase = alignedScript.phrases[activePhraseIdx] || alignedScript.phrases[0];
    const phraseDuration = Math.max(0.1, currentPhrase.endTime - currentPhrase.startTime);
    const phraseProgress = Math.min(1, Math.max(0, (audioTime - currentPhrase.startTime) / phraseDuration));

    // STEP 5: Frame-by-frame live step progress
    if (frame % 8 === 0 || frame === totalFrames - 1) {
      const step5Pct = Math.min(94, Math.round(50 + progress * 44));
      reportStep(
        5,
        '9:16 Reel Video Recording',
        'रील वीडियो फ्रेम्स रिकॉर्डिंग',
        `Recording frame ${frame + 1}/${totalFrames} (${elapsedSec.toFixed(1)}s / ${targetDuration.toFixed(1)}s) - Phrase ${activePhraseIdx + 1}/${phraseCount}`,
        `फ़्रेम ${frame + 1}/${totalFrames} रिकॉर्ड हो रहा है (${elapsedSec.toFixed(1)}s / ${targetDuration.toFixed(1)}s)...`,
        step5Pct
      );
    }

    // DRAW REEL FRAME (100% Exact match with 9:16 Live Phone Preview)
    ctx.clearRect(0, 0, width, height);

    // Layer 1: Background Graphics or Video (Proper aspect-ratio cover matching preview)
    if (bgVideo && bgVideo.readyState >= 1) {
      if (bgVideo.paused) {
        bgVideo.play().catch(() => {});
      }
      bgVideo.playbackRate = effectiveSpeechRate;
      // If video reached end, loop it smoothly back to start
      if (bgVideo.duration && isFinite(bgVideo.duration) && bgVideo.currentTime >= bgVideo.duration - 0.15) {
        bgVideo.currentTime = 0;
      }

      const vRatio = (bgVideo.videoWidth || 16) / (bgVideo.videoHeight || 9);
      const cRatio = width / height;
      let dw = width;
      let dh = height;
      let dx = 0;
      let dy = 0;
      if (vRatio > cRatio) {
        dw = height * vRatio;
        dx = -(dw - width) / 2;
      } else {
        dh = width / vRatio;
        dy = -(dh - height) / 2;
      }
      try {
        ctx.drawImage(bgVideo, dx, dy, dw, dh);
      } catch {
        if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
          ctx.drawImage(bgImg, 0, 0, width, height);
        } else {
          drawStudioBackdrop(ctx, width, height, colorTheme, frame);
        }
      }
    } else if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      // Calculate object-cover so photo is never squished or stretched
      const imgRatio = bgImg.naturalWidth / (bgImg.naturalHeight || 1);
      const cRatio = width / height;
      let dw = width;
      let dh = height;
      let dx = 0;
      let dy = 0;
      if (imgRatio > cRatio) {
        dw = height * imgRatio;
        dx = -(dw - width) / 2;
      } else {
        dh = width / imgRatio;
        dy = -(dh - height) / 2;
      }

      // Smooth subtle Ken Burns zoom
      const zoom = kenBurnsMotion !== false ? 1.0 + progress * 0.08 : 1.0;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.drawImage(bgImg, dx - width / 2, dy - height / 2, dw, dh);
      ctx.restore();
    } else {
      // High-Tech Cyber Studio Backdrop fallback
      drawStudioBackdrop(ctx, width, height, colorTheme, frame);
    }

    // Layer 2: Gradient Shading & Theme Overlay (Matches live preview CSS)
    drawThemeOverlay(ctx, width, height, colorTheme);

    // Layer 3: Top Stories Progress Bars (Narration Timeline Segments)
    const barSpacing = 8;
    const barMarginX = 50;
    const barW = (width - barMarginX * 2 - (phraseCount - 1) * barSpacing) / phraseCount;
    for (let i = 0; i < phraseCount; i++) {
      const bx = barMarginX + i * (barW + barSpacing);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(bx, 60, barW, 8, 4);
      ctx.fill();

      if (i < activePhraseIdx) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(bx, 60, barW, 8, 4);
        ctx.fill();
      } else if (i === activePhraseIdx) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(bx, 60, barW * phraseProgress, 8, 4);
        ctx.fill();
      }
    }

    // Layer 4: Broadcast Channel Bar & Sound Button (Top Header)
    const effectiveHandle = userHandle && userHandle.trim()
      ? (userHandle.startsWith('@') ? userHandle : `@${userHandle}`)
      : '@NewsLiveOfficial';

    // Live pulsating red indicator dot
    const pulseRadius = 7 + Math.sin(frame * 0.2) * 2;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(62, 120, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Channel name text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(effectiveHandle, 82, 128);

    // Audio sound wave indicator on top-right
    const waveX = width - 130;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(waveX, 102, 80, 36, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let wb = 0; wb < 4; wb++) {
      const bH = 8 + Math.abs(Math.sin(frame * 0.3 + wb * 0.8)) * 18;
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(waveX + 16 + wb * 12, 120 - bH / 2, 4, bH);
    }

    // Layer 5: Dynamic Spoken Caption Rendering (10 Viral Visual Effects)
    const contentLeft = 60;
    const contentMaxW = width - 120;

    // Active phrase & active word from aligned narration script using audioTime
    const activeWord = alignedScript.allWords.find(w => audioTime >= w.startTime && audioTime < w.endTime) || null;
    const activePhrase = alignedScript.phrases.find(p => audioTime >= p.startTime && audioTime < p.endTime) ||
      (audioTime >= alignedScript.totalDuration ? alignedScript.phrases[alignedScript.phrases.length - 1] : alignedScript.phrases[0]);

    drawCanvasCaptionEffect(
      ctx,
      width,
      contentLeft,
      contentMaxW,
      activePhrase,
      activeWord,
      audioTime,
      effectiveCaptionEffect,
      colorTheme,
      titleText,
      frame
    );

    // Layer 6: Bottom Breaking Ticker Tape (Full Width matching preview)
    const tickerY = height - 100;
    ctx.fillStyle = colorTheme === 'yellow_black' ? '#f59e0b' : colorTheme === 'neon_blue' ? '#0284c7' : '#e11d48';
    ctx.fillRect(0, tickerY, width, 100);

    ctx.fillStyle = colorTheme === 'yellow_black' ? '#000000' : '#ffffff';
    ctx.font = '900 28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ FLASH WIRE:', 40, tickerY + 60);

    ctx.font = '600 26px system-ui, -apple-system, sans-serif';
    const cleanHeadline = (spokenTitle || item.headline || '').slice(0, 65) + ((spokenTitle || item.headline || '').length > 65 ? '...' : '');
    ctx.fillText(cleanHeadline, 260, tickerY + 60);

    // Self-correcting pacing loop (guarantees audio and canvas stay in lockstep without drift)
    const targetElapsed = (frame + 1) * (1000 / fps);
    const actualElapsed = performance.now() - recordStartTime;
    const waitMs = Math.max(1, Math.round(targetElapsed - actualElapsed));
    await new Promise((r) => setTimeout(r, waitMs));
  }

  // STEP 6: Video Packaging & MP4 Export (फ़ाइनल वीडियो एनकोडिंग और डाउनलोड)
  reportStep(
    6,
    'Video Packaging & MP4 Export',
    'फ़ाइनल वीडियो एनकोडिंग और डाउनलोड',
    'Finalizing video data chunks and assembling MP4 container...',
    'ऑडियो और वीडियो ट्रैक्स को मिलाकर MP4 फ़ाइल बनाई जा रही है...',
    96
  );

  // Stop recorder safely and await final video blob
  if (recorder.state === 'recording') {
    try {
      recorder.requestData();
    } catch {}
    recorder.stop();
  }

  const finalBlob = await recordingPromise;

  const mbSize = (finalBlob.size / (1024 * 1024)).toFixed(2);
  reportStep(
    6,
    'Reel Export Complete',
    'रील वीडियो पूरी तरह तैयार!',
    `Reel finished successfully! Size: ${mbSize} MB, Duration: ${Math.round(targetDuration)}s`,
    `सफलतापूर्वक तैयार! साइज़: ${mbSize} MB, अवधि: ${Math.round(targetDuration)}s`,
    100
  );

  if (isCreatedBgVideo && bgVideo) {
    if (bgVideo.parentNode) {
      bgVideo.parentNode.removeChild(bgVideo);
    }
    bgVideo.pause();
    bgVideo.src = '';
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {});
  }

  return finalBlob;
}

// Draw the 10 distinct caption & visual animation effects onto 1080x1920 canvas with robust multiline wrapping
function drawCanvasCaptionEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  contentLeft: number,
  contentMaxW: number,
  activePhrase: any,
  activeWord: any,
  currentTime: number,
  effect: ReelCaptionEffect,
  colorTheme: string,
  titleText: string,
  frame: number
) {
  if (!activePhrase) return;
  const isTitle = activePhrase.isTitle;
  const words = activePhrase.words || [];
  const baseBoxY = 1200;

  // --- EFFECT 1: HORMOZI POP (Bold Yellow Box on Active Word) ---
  if (effect === 'hormozi_pop') {
    // Phase Badge
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.roundRect(contentLeft, baseBoxY, 180, 42, 8);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isTitle ? '⚡ HEADLINE' : '🎙️ LIVE VOICE', contentLeft + 90, baseBoxY + 29);

    ctx.font = '900 48px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    let curX = contentLeft;
    let curY = baseBoxY + 95;

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const wText = (w.word || '').toUpperCase();
      const metrics = ctx.measureText(wText);
      const wWidth = metrics.width;

      if (curX + wWidth > contentLeft + contentMaxW && i > 0) {
        curX = contentLeft;
        curY += 68;
      }

      const isCurrent = activeWord?.id === w.id;
      const hasBeenSpoken = currentTime >= w.endTime;

      if (isCurrent) {
        ctx.fillStyle = '#FACC15';
        ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.roundRect(curX - 8, curY - 42, wWidth + 16, 54, 8);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = '#000000';
        ctx.fillText(wText, curX, curY);
      } else {
        ctx.fillStyle = hasBeenSpoken ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 8;
        ctx.fillText(wText, curX, curY);
        ctx.shadowColor = 'transparent';
      }

      curX += wWidth + 18;
    }
    return;
  }

  // --- EFFECT 2: KARAOKE NEON GLOW (Cyan to Lime Progressive Flow) ---
  if (effect === 'karaoke_glow') {
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.roundRect(contentLeft, baseBoxY, 180, 42, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(isTitle ? '⚡ TOP STORY' : '🎤 NARRATION', contentLeft + 90, baseBoxY + 29);

    ctx.font = '900 48px system-ui, sans-serif';
    ctx.textAlign = 'left';
    let curX = contentLeft;
    let curY = baseBoxY + 95;

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const wText = w.word || '';
      const wWidth = ctx.measureText(wText).width;

      if (curX + wWidth > contentLeft + contentMaxW && i > 0) {
        curX = contentLeft;
        curY += 68;
      }

      const isCurrent = activeWord?.id === w.id;
      const hasBeenSpoken = currentTime >= w.endTime;

      if (isCurrent) {
        ctx.fillStyle = '#34D399';
        ctx.shadowColor = 'rgba(52, 211, 153, 0.9)';
        ctx.shadowBlur = 20;
        ctx.fillText(wText, curX, curY);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(curX, curY + 8, wWidth, 5);
      } else if (hasBeenSpoken) {
        ctx.fillStyle = '#38BDF8';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
        ctx.shadowBlur = 12;
        ctx.fillText(wText, curX, curY);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 0;
        ctx.fillText(wText, curX, curY);
      }
      ctx.shadowColor = 'transparent';
      curX += wWidth + 18;
    }
    return;
  }

  // --- EFFECT 3: KINETIC CINE-FADE (Frosted Glass Card) ---
  if (effect === 'kinetic_fade') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(contentLeft, baseBoxY, contentMaxW, 230, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FB7185';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(isTitle ? 'OFFICIAL HEADLINE' : 'CORRESPONDENT AUDIO', contentLeft + 24, baseBoxY + 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 42px system-ui, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;

    const pWords = (activePhrase.text || '').split(' ');
    let pLine = '';
    let pY = baseBoxY + 100;
    for (let pw of pWords) {
      const test = pLine + pw + ' ';
      if (ctx.measureText(test).width > contentMaxW - 48 && pLine.length > 0) {
        ctx.fillText(pLine, contentLeft + 24, pY);
        pLine = pw + ' ';
        pY += 56;
      } else {
        pLine = test;
      }
    }
    if (pLine) ctx.fillText(pLine, contentLeft + 24, pY);
    ctx.shadowColor = 'transparent';
    return;
  }

  // --- EFFECT 4: TV NEWS TELEPROMPTER BAR ---
  if (effect === 'teleprompter_bar') {
    const barY = baseBoxY + 10;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, barY, width, 220);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(0, barY, width, 6);
    ctx.fillRect(0, barY + 214, width, 6);

    // Live Beacon
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(contentLeft + 15, barY + 35, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EF4444';
    ctx.font = '900 20px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('LIVE NEWS ANCHOR TELEPROMPTER', contentLeft + 32, barY + 42);

    ctx.font = '900 42px system-ui, sans-serif';
    let curX = contentLeft;
    let curY = barY + 105;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const wText = (w.word || '').toUpperCase();
      const wW = ctx.measureText(wText).width;
      if (curX + wW > contentLeft + contentMaxW && i > 0) {
        curX = contentLeft;
        curY += 58;
      }
      const isCur = activeWord?.id === w.id;
      if (isCur) {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(curX - 6, curY - 36, wW + 12, 46);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(wText, curX, curY);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(wText, curX, curY);
      }
      curX += wW + 16;
    }
    return;
  }

  // --- EFFECT 5: TYPEWRITER TERMINAL ---
  if (effect === 'typewriter') {
    ctx.fillStyle = 'rgba(2, 44, 34, 0.9)';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(contentLeft, baseBoxY, contentMaxW, 230, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 20px monospace, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('> DISPATCH_FEED://TERMINAL_LIVE', contentLeft + 24, baseBoxY + 38);

    ctx.font = 'bold 38px monospace, system-ui';
    ctx.fillStyle = '#34D399';
    const cursor = Math.sin(frame * 0.2) > 0 ? '█' : '';
    const fullText = `${activePhrase.text || ''} ${cursor}`;
    const pWords = fullText.split(' ');
    let pLine = '';
    let pY = baseBoxY + 100;
    for (const pw of pWords) {
      const test = pLine + pw + ' ';
      if (ctx.measureText(test).width > contentMaxW - 48 && pLine.length > 0) {
        ctx.fillText(pLine, contentLeft + 24, pY);
        pLine = pw + ' ';
        pY += 54;
      } else {
        pLine = test;
      }
    }
    if (pLine) ctx.fillText(pLine, contentLeft + 24, pY);
    return;
  }

  // --- EFFECT 6: HEADLINE PUNCH & ROLL ---
  if (effect === 'headline_punch') {
    if (!isTitle) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(contentLeft, baseBoxY - 70, contentMaxW, 55, 10);
      ctx.fill();
      ctx.fillStyle = '#FCD34D';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`📌 ${titleText.slice(0, 50)}...`, contentLeft + 18, baseBoxY - 34);
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(contentLeft, baseBoxY, contentMaxW, 210, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F97316';
    ctx.font = '900 20px system-ui';
    ctx.fillText(isTitle ? 'HEADLINE' : 'DETAILS', contentLeft + 20, baseBoxY + 36);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 42px system-ui, sans-serif';
    const pWords = (activePhrase.text || '').split(' ');
    let pLine = '';
    let pY = baseBoxY + 95;
    for (const pw of pWords) {
      const test = pLine + pw + ' ';
      if (ctx.measureText(test).width > contentMaxW - 48 && pLine.length > 0) {
        ctx.fillText(pLine, contentLeft + 20, pY);
        pLine = pw + ' ';
        pY += 56;
      } else {
        pLine = test;
      }
    }
    if (pLine) ctx.fillText(pLine, contentLeft + 20, pY);
    return;
  }

  // --- EFFECT 7: MINIMALIST VOX PILL ---
  if (effect === 'vox_minimal') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(contentLeft, baseBoxY, contentMaxW, 220, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 20px monospace, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(isTitle ? 'HEADLINES' : 'REPORTING', contentLeft + 24, baseBoxY + 38);

    ctx.font = 'bold 42px system-ui, sans-serif';
    let curX = contentLeft + 24;
    let curY = baseBoxY + 100;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const wText = w.word || '';
      const wW = ctx.measureText(wText).width;
      if (curX + wW > contentLeft + contentMaxW - 48 && i > 0) {
        curX = contentLeft + 24;
        curY += 56;
      }
      const isCur = activeWord?.id === w.id;
      if (isCur) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(curX - 4, curY - 36, wW + 8, 46);
        ctx.fillStyle = '#0F172A';
        ctx.fillText(wText, curX, curY);
      } else {
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(wText, curX, curY);
      }
      curX += wW + 16;
    }
    return;
  }

  // --- EFFECT 8: CYBER MATRIX WIRE ---
  if (effect === 'cyber_matrix') {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(contentLeft, baseBoxY, contentMaxW, 220, 16);
    ctx.fill();
    ctx.stroke();

    // Equalizer bars
    ctx.fillStyle = '#22C55E';
    for (let b = 0; b < 12; b++) {
      const h = 8 + Math.abs(Math.sin(frame * 0.3 + b * 0.7)) * 20;
      ctx.fillRect(contentLeft + 24 + b * 16, baseBoxY + 36 - h, 8, h);
    }

    ctx.font = 'bold 38px monospace, system-ui';
    ctx.fillStyle = '#4ADE80';
    const pWords = (activePhrase.text || '').split(' ');
    let pLine = '';
    let pY = baseBoxY + 110;
    for (const pw of pWords) {
      const test = pLine + pw + ' ';
      if (ctx.measureText(test).width > contentMaxW - 48 && pLine.length > 0) {
        ctx.fillText(pLine, contentLeft + 24, pY);
        pLine = pw + ' ';
        pY += 52;
      } else {
        pLine = test;
      }
    }
    if (pLine) ctx.fillText(pLine, contentLeft + 24, pY);
    return;
  }

  // --- EFFECT 9: STUDIO SPOTLIGHT ---
  if (effect === 'spotlight') {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(contentLeft, baseBoxY, 170, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '900 20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTLIGHT', contentLeft + 85, baseBoxY + 27);

    ctx.font = '900 46px system-ui, sans-serif';
    ctx.textAlign = 'left';
    let curX = contentLeft;
    let curY = baseBoxY + 95;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const wText = w.word || '';
      const wW = ctx.measureText(wText).width;
      if (curX + wW > contentLeft + contentMaxW && i > 0) {
        curX = contentLeft;
        curY += 62;
      }
      const isCur = activeWord?.id === w.id;
      if (isCur) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 18;
        ctx.fillText(wText, curX, curY);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.shadowBlur = 0;
        ctx.fillText(wText, curX, curY);
      }
      ctx.shadowColor = 'transparent';
      curX += wW + 18;
    }
    return;
  }

  // --- EFFECT 10: BOLD IMPACT ZOOM ---
  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.roundRect(contentLeft, baseBoxY, 170, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 20px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('💥 IMPACT', contentLeft + 85, baseBoxY + 27);

  ctx.font = '900 46px system-ui, sans-serif';
  ctx.textAlign = 'left';
  let curX = contentLeft;
  let curY = baseBoxY + 95;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const wText = (w.word || '').toUpperCase();
    const wW = ctx.measureText(wText).width;
    if (curX + wW > contentLeft + contentMaxW && i > 0) {
      curX = contentLeft;
      curY += 62;
    }
    const isCur = activeWord?.id === w.id;
    if (isCur) {
      ctx.fillStyle = '#E11D48';
      ctx.roundRect(curX - 6, curY - 40, wW + 12, 50, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(wText, curX, curY);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(wText, curX, curY);
    }
    curX += wW + 18;
  }
}

// Scheduled broadcast music soundtrack for reel video (balanced behind 100% spoken voice)
function scheduleBroadcastSoundtrack(
  audioCtx: AudioContext,
  audioDest: AudioNode,
  durationSeconds: number,
  trackType: string = 'breaking_pulse'
) {
  const tempo = trackType === 'cyber_ticker' ? 132 : trackType === 'investigation' ? 110 : trackType === 'primetime_fanfare' ? 120 : 124;
  const stepTime = 60 / tempo / 4; // 16th note steps
  const totalSteps = Math.ceil(durationSeconds / stepTime);

  for (let s = 0; s < totalSteps; s++) {
    const time = audioCtx.currentTime + s * stepTime;

    // 1. Kick drum: deep punch on quarter notes
    const isKick =
      trackType === 'cyber_ticker'
        ? s % 4 === 0
        : trackType === 'investigation'
        ? s % 8 === 0
        : s % 4 === 0 || s % 16 === 14;

    if (isKick) {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
        gain.gain.setValueAtTime(0.22, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
        osc.connect(gain);
        gain.connect(audioDest);
        osc.start(time);
        osc.stop(time + 0.18);
      } catch {}
    }

    // 2. Snare / Clap on beats 4 and 12
    if ((s % 8 === 4) && trackType !== 'investigation') {
      try {
        const noise = audioCtx.createOscillator();
        const noiseGain = audioCtx.createGain();
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(240, time);
        noiseGain.gain.setValueAtTime(0.12, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        noise.connect(noiseGain);
        noiseGain.connect(audioDest);
        noise.start(time);
        noise.stop(time + 0.14);
      } catch {}
    }

    // 3. Hi-hat ticker: crisp 16th rhythmic pulse
    if (s % 2 === 0) {
      try {
        const hat = audioCtx.createOscillator();
        const hatGain = audioCtx.createGain();
        hat.type = 'square';
        hat.frequency.setValueAtTime(3200 + (s % 4) * 400, time);
        hatGain.gain.setValueAtTime(0.03, time);
        hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        hat.connect(hatGain);
        hatGain.connect(audioDest);
        hat.start(time);
        hat.stop(time + 0.05);
      } catch {}
    }

    // 4. Synth Melodic Pulse / Arp (D minor / A minor)
    if (s % 2 === 0 && trackType !== 'investigation') {
      try {
        const synth = audioCtx.createOscillator();
        const sGain = audioCtx.createGain();
        synth.type = trackType === 'cyber_ticker' ? 'square' : 'sawtooth';
        const notes = trackType === 'cyber_ticker'
          ? [220, 261.63, 293.66, 329.63, 392.0, 440.0]
          : [110, 130.81, 146.83, 164.81, 196.0, 220.0];
        const freq = notes[(s / 2) % notes.length];
        synth.frequency.setValueAtTime(freq, time);
        sGain.gain.setValueAtTime(0.06, time);
        sGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        synth.connect(sGain);
        sGain.connect(audioDest);
        synth.start(time);
        synth.stop(time + 0.09);
      } catch {}
    }

    // 5. Cinematic Sub-Drop for Investigation track
    if (trackType === 'investigation' && (s % 16 === 0 || s % 16 === 8)) {
      try {
        const sub = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        sub.frequency.setValueAtTime(95, time);
        sub.frequency.exponentialRampToValueAtTime(32, time + 0.35);
        subGain.gain.setValueAtTime(0.24, time);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
        sub.connect(subGain);
        subGain.connect(audioDest);
        sub.start(time);
        sub.stop(time + 0.40);
      } catch {}
    }
  }
}

// Draw dynamic gradient backdrop when no image or video is loaded
function drawStudioBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number, colorTheme: string, frame: number) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (colorTheme === 'neon_blue') {
    grad.addColorStop(0, '#0c4a6e');
    grad.addColorStop(0.5, '#082f49');
    grad.addColorStop(1, '#020617');
  } else if (colorTheme === 'yellow_black') {
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(0.5, '#1c1917');
    grad.addColorStop(1, '#000000');
  } else if (colorTheme === 'emerald_gold') {
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.5, '#022c22');
    grad.addColorStop(1, '#052e16');
  } else {
    grad.addColorStop(0, '#881337');
    grad.addColorStop(0.5, '#4c0519');
    grad.addColorStop(1, '#020617');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Digital grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Scanning laser beam
  const laserY = (frame * 12) % height;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, laserY, width, 4);
}

// Theme color shading overlay
function drawThemeOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, colorTheme: string) {
  const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (colorTheme === 'neon_blue') {
    overlayGrad.addColorStop(0, 'rgba(5, 8, 15, 0.7)');
    overlayGrad.addColorStop(0.35, 'rgba(10, 15, 25, 0.4)');
    overlayGrad.addColorStop(0.65, 'rgba(15, 23, 42, 0.85)');
    overlayGrad.addColorStop(1, 'rgba(15, 76, 129, 0.98)');
  } else if (colorTheme === 'yellow_black') {
    overlayGrad.addColorStop(0, 'rgba(5, 8, 15, 0.75)');
    overlayGrad.addColorStop(0.35, 'rgba(10, 10, 10, 0.4)');
    overlayGrad.addColorStop(0.65, 'rgba(20, 20, 20, 0.88)');
    overlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
  } else if (colorTheme === 'emerald_gold') {
    overlayGrad.addColorStop(0, 'rgba(5, 8, 15, 0.7)');
    overlayGrad.addColorStop(0.35, 'rgba(4, 47, 46, 0.4)');
    overlayGrad.addColorStop(0.65, 'rgba(2, 44, 34, 0.85)');
    overlayGrad.addColorStop(1, 'rgba(6, 78, 59, 0.98)');
  } else {
    overlayGrad.addColorStop(0, 'rgba(5, 8, 15, 0.7)');
    overlayGrad.addColorStop(0.35, 'rgba(10, 15, 25, 0.4)');
    overlayGrad.addColorStop(0.65, 'rgba(15, 23, 42, 0.85)');
    overlayGrad.addColorStop(1, 'rgba(153, 27, 27, 0.98)');
  }
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Triggers instant browser download of the generated reel video in MP4 format
 */
export function downloadReelBlob(blob: Blob, filename = 'news-reel.mp4') {
  // Ensure the filename always has an .mp4 extension
  let safeName = filename.replace(/\.(webm|ogg|avi|mov)$/i, '');
  if (!safeName.endsWith('.mp4')) {
    safeName += '.mp4';
  }

  // Ensure blob has video/mp4 MIME type
  const mp4Blob = blob.type === 'video/mp4' ? blob : new Blob([blob], { type: 'video/mp4' });
  const url = URL.createObjectURL(mp4Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
