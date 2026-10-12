export interface NewsVerificationInfo {
  isVerified: boolean;
  credibilityScore: number;
  status: string;
  matchedSourcesCount: number;
  sources: { title: string; publisher: string; link: string; date?: string }[];
  factCheckSummary: string;
}

export interface TrendingNewsItem {
  id: string;
  category: string;
  headline: string;
  summary: string;
  badge: string;
  trendingScore: number;
  keywords: string[];
  imageSuggestion?: string;
  publishedTimeAgo?: string;
  formattedDateTime?: string;
  pubDate?: string;
  sourceName?: string;
  sourceWebsite?: string;
  link?: string;
  fullDetails?: string;
  fullDescription?: string;
  country?: string;
  isSaved?: boolean;
  isCustomStoryItem?: boolean;
  verification?: NewsVerificationInfo;
  autoPoster?: {
    category: string;
    badge: string;
    colorTheme: 'red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire';
    bgImageUrl: string;
    highlightStat: string;
  };
}

export interface PosterConfig {
  badge: string;
  mainHeadline: string;
  subHeadline: string;
  highlightStat: string;
  colorTheme: 'red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire';
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5';
  bgImageUrl: string;
  channelName: string;
  userHandle: string;
  handleCorner: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  watermark: boolean;
  dateBadge: string;
}

export interface GeneratedStory {
  headline: string;
  headlineEn?: string;
  summary: string;
  fullArticle: string;
  keyHighlights: string[];
  viralTags: string[];
  facebookPost: string;
  instagramCaption: string;
  sourceWebsite?: string;
  originalLink?: string;
  poster: {
    badge: string;
    mainHeadline: string;
    subHeadline: string;
    highlightStat: string;
    colorTheme: 'red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire';
    bgKeyword?: string;
    imagePrompt?: string;
  };
}

export interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram';
  name: string;
  handle: string;
  avatar: string;
  followers: number;
  isConnected: boolean;
  pageId?: string;
  accessToken?: string;
}

export interface PublishedPost {
  id: string;
  topic: string;
  headline: string;
  platforms: ('facebook' | 'instagram')[];
  posterUrl: string;
  videoUrl?: string;
  isReel?: boolean;
  durationSecs?: number;
  facebookContent?: string;
  instagramContent?: string;
  publishedAt: string;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  status: 'published' | 'scheduled' | 'failed';
  metaPostUrl?: string;
  instaPostUrl?: string;
  isPublishedToMeta?: boolean;
  metaPublishStatus?: 'live_on_instagram' | 'meta_error' | 'local_agent_queue';
  metaError?: string;
  mediaId?: string;
}

export interface AiAgentConfig {
  isEnabled: boolean;
  intervalMinutes: number; // e.g. 15 default
  voiceLanguage: string; // 'Hindi' | 'English' | 'Hinglish'
  speechRate: number;
  theme: 'red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire';
  autoHashtags: boolean;
  soundAlerts: boolean;
  categoryFilter: string;
  nextRunAt?: string;
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  hl: string;
  gl: string;
  ceid: string;
}

export interface ReelSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  body: string;
  tag: string;
}

export interface ReelConfig {
  musicTrack: 'breaking_pulse' | 'cyber_ticker' | 'investigation' | 'primetime_fanfare';
  musicEnabled: boolean;
  volume: number;
  currentSlideIndex: number;
  autoPlay: boolean;
  slideDuration: number;
  bgImageUrl: string;
  kenBurnsMotion: boolean;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  textPosition: 'center' | 'lower' | 'top';
  colorTheme: 'red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire';
  channelHandle: string;
  showWatermark: boolean;
}

export interface ScheduledPost {
  id: string;
  newsId?: string;
  headline: string;
  summary: string;
  topic: string;
  category: string;
  country: string;
  language: string; // 'Hindi' | 'English' | 'Hinglish'
  speechRate: number; // e.g. 0.8, 1.0, 1.2, 1.5
  theme: 'red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire';
  bgImageUrl: string; // news-related image background (used for video & cover)
  coverImageUrl?: string; // image used as Instagram video cover
  videoUrl?: string; // pre-rendered video URL
  videoBase64?: string;
  caption: string;
  hashtags: string[];
  scheduledTime: string; // ISO date string
  dayLabel?: string; // 'Day 1' | 'Day 2' | 'Today' | 'Tomorrow'
  timeSlot?: string; // '09:00 AM', '01:00 PM', etc.
  status: 'pending' | 'pre_rendering' | 'pre_rendered' | 'publishing' | 'published' | 'failed';
  preRenderedAt?: string;
  publishedAt?: string;
  metaError?: string;
  instaPostUrl?: string;
  verification?: {
    isVerified: boolean;
    credibilityScore: number;
    factCheckSummary: string;
    sourceWebsite?: string;
  };
}

export interface ScheduleSettings {
  isEnabled: boolean;
  postsPerDay: number; // e.g. 3, 5, 8
  daysCount: number; // e.g. 2 for "do din me bana saku"
  timeSlots: string[]; // e.g. ['09:00', '13:00', '17:00', '21:00']
  language: string; // 'Hindi' default
  country: string; // 'IN' default
  speechRate: number; // 1.2 default
  theme: 'red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire';
  preRenderMinutesBefore: number; // 30, 25, or 10 min
  isLoopActive: boolean; // recurring loop
}

export interface ReelProgressStep {
  id: number;
  title: string;
  titleHi: string;
  detail: string;
  detailHi: string;
  status: 'pending' | 'active' | 'completed';
}

export interface ReelProgressState {
  isVisible: boolean;
  isMinimized?: boolean;
  percentage: number;
  currentStepId: number;
  statusText: string;
  statusTextHi?: string;
  headline?: string;
  steps: ReelProgressStep[];
  logs: { time: string; text: string; stepId?: number }[];
  isComplete: boolean;
  downloadUrl?: string;
  fileName?: string;
  blob?: Blob;
  fileSizeBytes?: number;
  durationSec?: number;
  error?: string | null;
  actionType?: 'reel' | 'story';
}

export const INITIAL_STORY_STEPS: ReelProgressStep[] = [
  {
    id: 1,
    title: 'Live Wire & Source Fact-Checking',
    titleHi: 'लाइव वायर कनेक्शन और फैक्ट-चेक',
    detail: 'Connecting to real-time Google News wire and validating sources',
    detailHi: 'सत्यापित गूगल न्यूज स्रोत और डेटा प्राप्त किया जा रहा है',
    status: 'pending',
  },
  {
    id: 2,
    title: 'AI Editorial Headline & Angle',
    titleHi: 'संपादकीय हेडलाइन और न्यूज़ एंगल',
    detail: 'Synthesizing viral headline, news hook & factual context',
    detailHi: 'प्रभावशाली हेडलाइन, मुख्य बिंदु और संदर्भ तैयार किया जा रहा है',
    status: 'pending',
  },
  {
    id: 3,
    title: 'HD Poster Layout & Theming',
    titleHi: 'हाई-डेफिनिशन पोस्टर और दृश्य डिज़ाइन',
    detail: 'Assembling broadcast badge, background artwork & typography',
    detailHi: 'न्यूज़रूम बैज, थीम कलर्स और वाटरमार्क लेआउट कॉन्फ़िगर हो रहा है',
    status: 'pending',
  },
  {
    id: 4,
    title: 'Social Captions & Viral Hashtags',
    titleHi: 'सोशल मीडिया कैप्शन और वायरल टैग्स',
    detail: 'Formatting multi-platform post descriptions and verified tags',
    detailHi: 'इंस्टाग्राम व फेसबुक के लिए अनुकूलित कैप्शन्स व हैशटैग्स तैयार',
    status: 'pending',
  },
  {
    id: 5,
    title: 'Broadcast Package Ready',
    titleHi: 'स्टूडियो पैकेज और फाइनल तैयारी',
    detail: 'Finalizing live studio assets, reels bridge & publishing package',
    detailHi: 'स्टूडियो और रील तैयार करने के लिए पैकेज लोड किया जा रहा है',
    status: 'pending',
  },
];
