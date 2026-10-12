import React, { useState } from 'react';
import { GeneratedStory } from '../types';
import { FileText, Copy, Check, Facebook, Instagram, Bookmark, Sparkles, Hash, Tag, Globe, ExternalLink } from 'lucide-react';

interface StoryEditorProps {
  story: GeneratedStory | null;
  onUpdateStory: (updated: GeneratedStory) => void;
  isGenerating: boolean;
  onRegenerateTone?: (tone: string) => void;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
  story,
  onUpdateStory,
  isGenerating,
  onRegenerateTone,
}) => {
  const [activeTab, setActiveTab] = useState<'full' | 'facebook' | 'instagram'>('full');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!story) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <FileText className="w-7 h-7" />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">News Desk is Ready</h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Select any real-time story from the Google News feed above to open its comprehensive journalistic breakdown and social media copy.
        </p>
      </div>
    );
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getTagsString = () => {
    if (story.viralTags && story.viralTags.length > 0) {
      return story.viralTags.join(' ');
    }
    return '#BreakingNews #TopStories #WorldNews #DailyBrief #TrendingNow';
  };

  const handleCopyWithTags = (mainContent: string, key: string) => {
    const combined = `${mainContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 Source Website: ${story.sourceWebsite || 'Google News Verified Coverage'}
🔗 Original Story Link: ${story.originalLink || 'https://news.google.com'}
📌 Verified Tags: ${getTagsString()}`;

    handleCopy(combined, key);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-white">Full In-Depth News Report & Social Copy</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive Journalistic Breakdown · Source Attribution · One-Click Copy with Viral Tags
          </p>
        </div>

        {/* Format Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('full')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'full'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Full Article Breakdown
          </button>
          <button
            onClick={() => setActiveTab('facebook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'facebook'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Facebook className="w-3.5 h-3.5" /> Facebook Post
          </button>
          <button
            onClick={() => setActiveTab('instagram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'instagram'
                ? 'bg-pink-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Instagram className="w-3.5 h-3.5" /> Instagram Caption
          </button>
        </div>
      </div>

      {/* Main Headline Display */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Verified Broadcast Headline
            </span>
            {story.sourceWebsite && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                📍 {story.sourceWebsite}
              </span>
            )}
          </div>
          <button
            onClick={() => handleCopy(story.headline, 'headline')}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
          >
            {copiedKey === 'headline' ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy Headline
              </>
            )}
          </button>
        </div>
        <textarea
          rows={2}
          value={story.headline}
          onChange={(e) => onUpdateStory({ ...story, headline: e.target.value })}
          className="w-full bg-transparent text-sm font-bold text-white leading-relaxed focus:outline-none resize-none"
        />
      </div>

      {/* Verified Tags Strip */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" /> Trending Journalistic Hashtags:
          </span>
          <button
            onClick={() => handleCopy(getTagsString(), 'tags_only')}
            className="text-[11px] text-rose-300 hover:text-white bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1 font-semibold transition"
          >
            {copiedKey === 'tags_only' ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> Tags Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy All Tags
              </>
            )}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(story.viralTags && story.viralTags.length > 0
            ? story.viralTags
            : ['#BreakingNews', '#TopStories', '#WorldNews', '#DailyBrief', '#TrendingNow']
          ).map((t, idx) => (
            <span
              key={idx}
              className="text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 font-mono"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Key Takeaways */}
      {story.keyHighlights && story.keyHighlights.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
            ⚡ Key Facts & Timeline Takeaways:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {story.keyHighlights.map((hl, idx) => (
              <div
                key={idx}
                className="text-xs text-amber-200/90 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40"
              >
                • {hl}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT WITH ONE-CLICK COPY WITH TAGS & SOURCE ATTRIBUTION */}
      {activeTab === 'full' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Full Journalistic Report (What Happened, Context & Official Dispatches):
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(story.fullArticle, 'article_plain')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                {copiedKey === 'article_plain' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Text Only
              </button>
              <button
                onClick={() => handleCopyWithTags(story.fullArticle, 'article_with_tags')}
                className="text-xs text-white bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 flex items-center gap-1.5 font-bold px-3 py-1 rounded-lg shadow"
              >
                {copiedKey === 'article_with_tags' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied with Tags & Source!
                  </>
                ) : (
                  <>
                    <Tag className="w-3.5 h-3.5" /> Copy with Source & Tags
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            rows={12}
            value={story.fullArticle}
            onChange={(e) => onUpdateStory({ ...story, fullArticle: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
          />

          {/* Source Attribution Box at the Bottom (Requested by user) */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>
                Source Publisher:{' '}
                <strong className="text-white">{story.sourceWebsite || 'Google News Verified Coverage'}</strong>
              </span>
            </div>
            {story.originalLink && (
              <a
                href={story.originalLink}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1 text-[11px] font-bold"
              >
                View Original Story <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {activeTab === 'facebook' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Facebook className="w-4 h-4 text-blue-400" />
              <label className="text-xs font-semibold text-slate-300">
                Facebook Optimized Post Format:
              </label>
            </div>
            <button
              onClick={() => handleCopyWithTags(story.facebookPost, 'fb_with_tags')}
              className="text-xs text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1.5 font-bold px-3 py-1 rounded-lg shadow"
            >
              {copiedKey === 'fb_with_tags' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" /> FB Post Copied with Tags!
                </>
              ) : (
                <>
                  <Tag className="w-3.5 h-3.5" /> Copy with Source & Tags
                </>
              )}
            </button>
          </div>
          <textarea
            rows={12}
            value={story.facebookPost}
            onChange={(e) => onUpdateStory({ ...story, facebookPost: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {activeTab === 'instagram' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Instagram className="w-4 h-4 text-pink-400" />
              <label className="text-xs font-semibold text-slate-300">
                Instagram Caption & Viral Tag Layout:
              </label>
            </div>
            <button
              onClick={() => handleCopyWithTags(story.instagramCaption, 'ig_with_tags')}
              className="text-xs text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 flex items-center gap-1.5 font-bold px-3 py-1 rounded-lg shadow"
            >
              {copiedKey === 'ig_with_tags' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" /> Instagram Caption Copied!
                </>
              ) : (
                <>
                  <Tag className="w-3.5 h-3.5" /> Copy with Source & Tags
                </>
              )}
            </button>
          </div>
          <textarea
            rows={12}
            value={story.instagramCaption}
            onChange={(e) => onUpdateStory({ ...story, instagramCaption: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-pink-500"
          />
        </div>
      )}
    </div>
  );
};
