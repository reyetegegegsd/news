import React, { useState } from 'react';
import { PublishedPost } from '../types';
import {
  X,
  ExternalLink,
  Facebook,
  Instagram,
  Trash2,
  BarChart2,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Calendar,
  Edit3,
  Film,
  Save,
  RefreshCw,
  Video,
  Download,
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: PublishedPost[];
  onDeletePost: (id: string) => void;
  onUpdatePost?: (id: string, updatedData: Partial<PublishedPost>) => Promise<void>;
  onOpenReelInStudio?: (item: any) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onDeletePost,
  onUpdatePost,
  onOpenReelInStudio,
}) => {
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Edit state
  const [editingPost, setEditingPost] = useState<PublishedPost | null>(null);
  const [editForm, setEditForm] = useState({
    headline: '',
    topic: '',
    instagramContent: '',
    facebookContent: '',
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const todayStr = new Date().toDateString();
  const todayList = history.filter((p) => {
    try {
      return new Date(p.publishedAt).toDateString() === todayStr;
    } catch {
      return false;
    }
  });

  const displayedList = filterMode === 'today' ? todayList : history;

  const handleOpenEdit = (post: PublishedPost) => {
    setEditingPost(post);
    setEditForm({
      headline: post.headline,
      topic: post.topic,
      instagramContent: post.instagramContent || '',
      facebookContent: post.facebookContent || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPost || !onUpdatePost) return;
    setIsSaving(true);
    try {
      await onUpdatePost(editingPost.id, {
        headline: editForm.headline,
        topic: editForm.topic,
        instagramContent: editForm.instagramContent,
        facebookContent: editForm.facebookContent,
      });
      setEditingPost(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <BarChart2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Dispatches & Daily Upload History</h3>
              <p className="text-xs text-slate-400">
                Live posts published across Instagram Reels & Facebook
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter buttons */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('today')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                filterMode === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📅 Today ({todayList.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🌐 All Time ({history.length})
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            {displayedList.length} items shown
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {displayedList.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">
                {filterMode === 'today' ? 'No dispatches uploaded today' : 'No dispatches yet'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Start the AI Agent or click 'Upload Reel Now' to publish your first reel!
              </p>
            </div>
          ) : (
            displayedList.map((post) => (
              <div
                key={post.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex gap-3">
                  {/* Poster Thumbnail */}
                  <div className="w-20 h-24 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-800">
                    <img
                      src={post.posterUrl}
                      alt={post.headline}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Headline & Badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                        {post.topic}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(post.publishedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-relaxed mb-1.5">
                      {post.headline}
                    </h4>

                    {/* Published Platform Badges */}
                    <div className="flex items-center gap-2">
                      {post.platforms.includes('instagram') && (
                        <span className="flex items-center gap-1 text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20 font-semibold">
                          <Instagram className="w-3 h-3" /> Instagram Reel
                        </span>
                      )}
                      {post.platforms.includes('facebook') && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-semibold">
                          <Facebook className="w-3 h-3" /> Facebook
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Caption snippet if available */}
                {post.instagramContent && (
                  <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded line-clamp-2 font-mono">
                    {post.instagramContent}
                  </p>
                )}

                {/* Analytics Counters */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-center">
                  <div className="bg-slate-900/60 p-1.5 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                      <Eye className="w-3 h-3 text-cyan-400" /> Reach
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {post.reach.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                      <Heart className="w-3 h-3 text-rose-400" /> Likes
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {post.likes.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                      <MessageCircle className="w-3 h-3 text-indigo-400" /> Comments
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {post.comments.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                      <Share2 className="w-3 h-3 text-emerald-400" /> Shares
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {post.shares.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    {post.videoUrl && (
                      <button
                        onClick={() => setPreviewVideoUrl(post.videoUrl!)}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] font-semibold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40 cursor-pointer"
                        title="Watch Real News Reel Video"
                      >
                        <Video className="w-3 h-3 text-rose-400" /> Play Reel
                      </button>
                    )}

                    {onUpdatePost && (
                      <button
                        onClick={() => handleOpenEdit(post)}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] font-semibold bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    )}

                    {onOpenReelInStudio && (
                      <button
                        onClick={() => {
                          onOpenReelInStudio({
                            id: post.id,
                            headline: post.headline,
                            summary: post.instagramContent || post.headline,
                            badge: '🚨 BREAKING NEWS',
                            imageSuggestion: post.posterUrl,
                          });
                          onClose();
                        }}
                        className="text-pink-400 hover:text-pink-300 flex items-center gap-1 text-[11px] font-semibold bg-pink-950/40 px-2 py-0.5 rounded border border-pink-800/40"
                      >
                        <Film className="w-3 h-3" /> Reels Studio
                      </button>
                    )}

                    {post.instaPostUrl && (
                      <a
                        href={post.instaPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pink-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Instagram className="w-3 h-3" /> View IG <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => onDeletePost(post.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition"
                    title="Delete Post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Post Modal inside Drawer */}
        {editingPost && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Edit Headline & Caption</span>
              </span>
              <button
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={editForm.headline}
              onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-bold"
              placeholder="Headline"
            />

            <textarea
              rows={3}
              value={editForm.instagramContent}
              onChange={(e) => setEditForm({ ...editForm, instagramContent: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
              placeholder="Instagram Caption & Hashtags"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingPost(null)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs flex items-center gap-1"
              >
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* Video Reel Player Modal */}
        {previewVideoUrl && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-sm w-full space-y-3 relative shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-pink-400" />
                  <span>Real News Reel Video Playback</span>
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
                  download="news-reel.mp4"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-pink-400" />
                  <span>Download Video</span>
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
