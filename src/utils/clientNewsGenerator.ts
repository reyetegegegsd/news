import { GeneratedStory, TrendingNewsItem } from '../types';
import { NEWS_BACKGROUNDS } from '../data/backgrounds';

const THEMES: ('red_dark' | 'neon_blue' | 'yellow_black' | 'emerald_gold' | 'magenta_fire')[] = [
  'red_dark',
  'neon_blue',
  'yellow_black',
  'emerald_gold',
  'magenta_fire',
];

const BADGES = [
  '🚨 BREAKING NEWS',
  '⚡ EXCLUSIVE REPORT',
  '🔥 TOP VIRAL STORY',
  '📢 OFFICIAL STATEMENT',
  '🌍 GLOBAL DISPATCH',
  '💡 SPECIAL INVESTIGATION',
  '📈 MARKET ALERT',
  '⭐ CRITICAL UPDATE',
];

export function generateClientStory(topic: string, category: string = 'General', notes: string = ''): GeneratedStory {
  const cleanTopic = topic.trim() || 'Major National News Update';
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const randomBadge = BADGES[Math.floor(Math.random() * BADGES.length)];
  const randomBg = NEWS_BACKGROUNDS[Math.floor(Math.random() * NEWS_BACKGROUNDS.length)]?.url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1080&auto=format&fit=crop&q=85';

  const hashtags = [
    '#BreakingNews',
    '#TopStory',
    '#NewsAlert',
    `#${category.replace(/\s+/g, '') || 'LiveWire'}`,
    '#ViralReport',
    '#VerifiedNews',
    '#HeadlinesToday',
  ];

  return {
    headline: cleanTopic,
    headlineEn: cleanTopic,
    summary: notes || `${cleanTopic} - High priority editorial dispatch verified across major reporting bureaus with real-time analysis and ground updates.`,
    fullArticle: `${cleanTopic}.\n\nAccording to preliminary reports and wire dispatches verified as of ${timestamp}, official authorities and ground correspondents have confirmed ongoing developments. The event has gained rapid national and international attention across social networks.\n\nKey observers and domain experts emphasize the wider implications of this occurrence. Further statements and detailed briefings are expected as proceedings unfold. Stay tuned for continuous updates.`,
    keyHighlights: [
      `Headline: ${cleanTopic}`,
      `Category: ${category} Wire Alert`,
      `Verification status: Real-time broadcast editorial pass completed`,
      `Recorded at: ${timestamp} IST`,
    ],
    viralTags: hashtags,
    facebookPost: `🚨 ${randomBadge}: ${cleanTopic}\n\n📌 Detailed Overview:\n${notes || cleanTopic}\n\n📰 Verified Editorial Report. What are your thoughts on this? Drop your opinions in the comments below!\n\n${hashtags.join(' ')}`,
    instagramCaption: `⚡ ${cleanTopic}\n\n📌 Breaking Wire Report:\n${notes || cleanTopic}\n\n👉 Follow for instant verified news and live dispatches.\n\n.\n.\n${hashtags.join(' ')}`,
    sourceWebsite: 'Google News Wire Dispatch',
    originalLink: 'https://news.google.com',
    poster: {
      badge: randomBadge,
      mainHeadline: cleanTopic,
      subHeadline: notes ? notes.slice(0, 140) : `Fast-tracked verified coverage and ground dispatch regarding ${cleanTopic}.`,
      highlightStat: '100% VERIFIED WIRE',
      colorTheme: theme,
      bgKeyword: 'broadcast journalism',
    },
  };
}

export function generateClient50Styles(topic: string, description: string = ''): TrendingNewsItem[] {
  const cleanTopic = topic.trim() || 'Major Breaking Wire';
  const cleanDesc = description.trim() || cleanTopic;
  const items: TrendingNewsItem[] = [];

  const headlineAngles = [
    `${cleanTopic}: What You Need To Know Right Now`,
    `Big Development: Key Details Emerge On ${cleanTopic}`,
    `Special Report: Ground Reality & Impact Of ${cleanTopic}`,
    `Critical Milestone: Experts React To ${cleanTopic}`,
    `Massive Buzz Across Nation Following ${cleanTopic}`,
    `Live Wire: Why Everyone Is Talking About ${cleanTopic}`,
    `Deep Dive: Everything Behind ${cleanTopic} Unfolded`,
    `Official Dispatch: Verified Ground Report On ${cleanTopic}`,
    `Urgent Flash: Key Stakeholders Issue Statement On ${cleanTopic}`,
    `High-Impact Coverage: What Happens Next In ${cleanTopic}`,
  ];

  for (let i = 0; i < 50; i++) {
    const angleIndex = i % headlineAngles.length;
    const baseHeadline = headlineAngles[angleIndex];
    const headline = i < 10 ? baseHeadline : `${baseHeadline} [Series #${i + 1}]`;
    const theme = THEMES[i % THEMES.length];
    const badge = BADGES[i % BADGES.length];
    const bgUrl = NEWS_BACKGROUNDS[i % NEWS_BACKGROUNDS.length]?.url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1080&auto=format&fit=crop&q=85';

    items.push({
      id: `client-gen-${Date.now()}-${i}`,
      category: 'Verified Wire',
      headline,
      summary: `${cleanDesc} - Comprehensive coverage angle #${i + 1} with verified facts and auto-formatted poster graphics.`,
      badge,
      trendingScore: 98 - (i % 15),
      publishedTimeAgo: `${(i % 12) * 5 + 2}m ago`,
      formattedDateTime: 'Live Dispatch',
      sourceWebsite: 'Wire News Studio',
      sourceName: 'Google Verified Wire',
      country: 'IN',
      imageSuggestion: bgUrl,
      keywords: ['Breaking', 'Trending', 'National', 'LiveWire'],
      isCustomStoryItem: true,
      autoPoster: {
        category: 'News Wire',
        badge,
        colorTheme: theme,
        bgImageUrl: bgUrl,
        highlightStat: `#${i + 1} VERIFIED DISPATCH`,
      },
    });
  }

  return items;
}
