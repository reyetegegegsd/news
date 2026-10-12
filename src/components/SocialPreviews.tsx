import React, { useState } from 'react';
import { GeneratedStory, SocialAccount } from '../types';
import { Facebook, Instagram, Heart, MessageCircle, Send, Bookmark, ThumbsUp, MessageSquare, Share2, MoreHorizontal, Globe, Check, Loader2, Sparkles, ExternalLink } from 'lucide-react';

interface SocialPreviewsProps {
  story: GeneratedStory;
  posterDataUrl: string;
  accounts: SocialAccount[];
  onPublish: (platforms: ('facebook' | 'instagram')[]) => Promise<void>;
  isPublishing: boolean;
  lastPublishedResult?: any;
}

export const SocialPreviews: React.FC<SocialPreviewsProps> = ({
  story,
  posterDataUrl,
  accounts,
  onPublish,
  isPublishing,
  lastPublishedResult,
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<('facebook' | 'instagram')[]>([
    'facebook',
    'instagram',
  ]);
  const [activePreview, setActivePreview] = useState<'facebook' | 'instagram'>('facebook');

  const fbAccount = accounts.find((a) => a.platform === 'facebook');
  const igAccount = accounts.find((a) => a.platform === 'instagram');

  const togglePlatform = (p: 'facebook' | 'instagram') => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((x) => x !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleDirectPublish = () => {
    onPublish(selectedPlatforms);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-lg">
              <Share2 className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-white">Social Media Direct Publisher & Live Previews</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Preview realistic Facebook & Instagram feed layouts and dispatch in one click
          </p>
        </div>

        {/* Preview Device Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActivePreview('facebook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activePreview === 'facebook'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Facebook className="w-3.5 h-3.5" /> Facebook Feed Preview
          </button>
          <button
            onClick={() => setActivePreview('instagram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activePreview === 'instagram'
                ? 'bg-pink-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Instagram className="w-3.5 h-3.5" /> Instagram Post Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Device Feed Mockup */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          {activePreview === 'facebook' ? (
            /* FACEBOOK FEED POST MOCKUP */
            <div className="w-full max-w-[420px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              {/* FB Post Header */}
              <div className="p-3 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/30">
                    GN
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white">
                        {fbAccount?.name || 'Global News Wire Official'}
                      </span>
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">
                        ✓
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>Just now</span> • <Globe className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
              </div>

              {/* FB Post Text */}
              <div className="p-3 text-xs text-slate-200 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                {story.facebookPost}
              </div>

              {/* Poster Image */}
              <div className="w-full bg-black flex items-center justify-center max-h-[360px] overflow-hidden">
                {posterDataUrl ? (
                  <img
                    src={posterDataUrl}
                    alt="Poster Preview"
                    className="w-full h-auto object-contain max-h-[360px]"
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">Rendering Poster...</div>
                )}
              </div>

              {/* FB Reactions Bar */}
              <div className="p-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px]">
                    👍
                  </span>
                  <span className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center text-white text-[9px]">
                    ❤️
                  </span>
                  <span>1.4K</span>
                </div>
                <div>240 Comments • 85 Shares</div>
              </div>

              {/* FB Action Buttons */}
              <div className="px-3 py-2 border-t border-slate-900 grid grid-cols-3 gap-1 text-slate-400 text-xs font-semibold">
                <button className="flex items-center justify-center gap-1 py-1 hover:text-blue-400 hover:bg-slate-900 rounded">
                  <ThumbsUp className="w-3.5 h-3.5" /> Like
                </button>
                <button className="flex items-center justify-center gap-1 py-1 hover:text-white hover:bg-slate-900 rounded">
                  <MessageSquare className="w-3.5 h-3.5" /> Comment
                </button>
                <button className="flex items-center justify-center gap-1 py-1 hover:text-emerald-400 hover:bg-slate-900 rounded">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>
          ) : (
            /* INSTAGRAM FEED POST MOCKUP */
            <div className="w-full max-w-[380px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              {/* IG Header */}
              <div className="p-3 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold">
                      GN
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {igAccount?.handle?.replace('@', '') || 'globalnews.live'}
                    </div>
                    <div className="text-[10px] text-slate-400">Global Verified Newsroom</div>
                  </div>
                </div>
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </div>

              {/* Poster Image */}
              <div className="w-full bg-black flex items-center justify-center aspect-square overflow-hidden">
                {posterDataUrl ? (
                  <img
                    src={posterDataUrl}
                    alt="Instagram Post"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">Rendering Poster...</div>
                )}
              </div>

              {/* IG Action Icons */}
              <div className="p-3 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-300">
                  <Heart className="w-5 h-5 hover:text-rose-500 cursor-pointer" />
                  <MessageCircle className="w-5 h-5 hover:text-white cursor-pointer" />
                  <Send className="w-5 h-5 hover:text-white cursor-pointer" />
                </div>
                <Bookmark className="w-5 h-5 text-slate-300 hover:text-white cursor-pointer" />
              </div>

              {/* IG Caption */}
              <div className="px-3 pb-3 text-xs leading-relaxed max-h-32 overflow-y-auto">
                <div className="font-bold text-white mb-1">Liked by 2,940 others</div>
                <div className="text-slate-300 whitespace-pre-wrap">
                  <span className="font-bold text-white mr-1.5">
                    {igAccount?.handle?.replace('@', '') || 'globalnews.live'}
                  </span>
                  {story.instagramCaption}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Publish Controls & Channels */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Select Publishing Channels:
            </h4>

            <div className="space-y-2.5">
              {/* Facebook Channel Card */}
              <div
                onClick={() => togglePlatform('facebook')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  selectedPlatforms.includes('facebook')
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-slate-800 bg-slate-950/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {fbAccount?.name || 'Global News Wire Official'}
                      <span className="text-[10px] text-emerald-400 font-semibold">● Connected</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Facebook Page • 148K Followers
                    </div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    selectedPlatforms.includes('facebook')
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-700'
                  }`}
                >
                  {selectedPlatforms.includes('facebook') && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Instagram Channel Card */}
              <div
                onClick={() => togglePlatform('instagram')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  selectedPlatforms.includes('instagram')
                    ? 'border-pink-500 bg-pink-950/20'
                    : 'border-slate-800 bg-slate-950/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pink-600/20 text-pink-400 flex items-center justify-center">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {igAccount?.name || 'Global News Daily'}
                      <span className="text-[10px] text-emerald-400 font-semibold">● Connected</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {igAccount?.handle || '@globalnews.live'} • 94K Followers
                    </div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    selectedPlatforms.includes('instagram')
                      ? 'bg-pink-600 border-pink-500 text-white'
                      : 'border-slate-700'
                  }`}
                >
                  {selectedPlatforms.includes('instagram') && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          </div>

          {/* Published Result Badge */}
          {lastPublishedResult && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Check className="w-4 h-4" /> Success: Post Live on Social Media!
              </div>
              <p className="text-[11px] text-slate-300">
                Your post was published successfully. View live links below:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {lastPublishedResult.metaPostUrl && (
                  <a
                    href={lastPublishedResult.metaPostUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                  >
                    <Facebook className="w-3 h-3" /> View Facebook Post <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {lastPublishedResult.instaPostUrl && (
                  <a
                    href={lastPublishedResult.instaPostUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-pink-400 hover:underline"
                  >
                    <Instagram className="w-3 h-3" /> View Instagram Post <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Big Publish CTA */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleDirectPublish}
              disabled={isPublishing || selectedPlatforms.length === 0}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing to Facebook & Instagram...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  🚀 Direct Publish Now ({selectedPlatforms.length} Channel{selectedPlatforms.length > 1 ? 's' : ''})
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400">
              * Posts verified copy, hashtags, and broadcast poster directly to your channels
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
