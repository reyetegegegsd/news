import React, { useState } from 'react';
import { SocialAccount } from '../types';
import { Facebook, Instagram, CheckCircle2, AlertCircle, X, ShieldCheck, Key, RefreshCw, Zap } from 'lucide-react';

interface ConnectAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: SocialAccount[];
  onUpdateAccount: (accountData: Partial<SocialAccount> & { id: string }) => void;
}

export const ConnectAccountsModal: React.FC<ConnectAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onUpdateAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram'>('facebook');

  const fbAccount = accounts.find((a) => a.platform === 'facebook') || {
    id: 'fb-1',
    platform: 'facebook' as const,
    name: 'Global News Wire Official',
    handle: '@globalnewswire',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    followers: 148500,
    isConnected: true,
    pageId: '10982347891234',
  };

  const igAccount = accounts.find((a) => a.platform === 'instagram') || {
    id: 'ig-1',
    platform: 'instagram' as const,
    name: 'Global News Daily',
    handle: '@globalnews.live',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150',
    followers: 94200,
    isConnected: true,
    pageId: '17841400234567',
  };

  const [fbForm, setFbForm] = useState({
    name: fbAccount.name,
    handle: fbAccount.handle,
    pageId: fbAccount.pageId || '',
    accessToken: fbAccount.accessToken || 'EAABwzL...',
  });

  const [igForm, setIgForm] = useState({
    name: igAccount.name,
    handle: igAccount.handle,
    pageId: igAccount.pageId || '',
    accessToken: igAccount.accessToken || 'EAABwzL...',
  });

  if (!isOpen) return null;

  const handleSaveFacebook = () => {
    onUpdateAccount({
      id: fbAccount.id,
      name: fbForm.name,
      handle: fbForm.handle,
      pageId: fbForm.pageId,
      accessToken: fbForm.accessToken,
      isConnected: true,
    });
    onClose();
  };

  const handleSaveInstagram = () => {
    onUpdateAccount({
      id: igAccount.id,
      name: igForm.name,
      handle: igForm.handle,
      pageId: igForm.pageId,
      accessToken: igForm.accessToken,
      isConnected: true,
    });
    onClose();
  };

  const handleInstantConnectDemo = () => {
    onUpdateAccount({
      id: 'fb-1',
      name: 'Global News Wire Official',
      handle: '@globalnewswire',
      isConnected: true,
    });
    onUpdateAccount({
      id: 'ig-1',
      name: 'Global News Daily',
      handle: '@globalnews.live',
      isConnected: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl shadow">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                Connect Facebook & Instagram Accounts
              </h3>
              <p className="text-xs text-slate-400">
                Direct publishing integration for Facebook Pages and Instagram Business
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

        {/* Quick Demo Connect Banner */}
        <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-pink-950/30 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ready for Autopilot: 1-Click Verified Connection</span>
          </div>
          <button
            onClick={handleInstantConnectDemo}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg shadow transition shrink-0"
          >
            ⚡ 1-Click Instant Connect
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('facebook')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'facebook'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Facebook className="w-4 h-4" /> Facebook Page {fbAccount.isConnected && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('instagram')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'instagram'
                ? 'border-pink-500 text-pink-400 bg-pink-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Instagram className="w-4 h-4" /> Instagram Business {igAccount.isConnected && '✓'}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'facebook' ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                    FB
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{fbAccount.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {fbAccount.handle} • {fbAccount.followers.toLocaleString()} Followers
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                    fbAccount.isConnected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {fbAccount.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Facebook Page Name:
                </label>
                <input
                  type="text"
                  value={fbForm.name}
                  onChange={(e) => setFbForm({ ...fbForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Facebook Page ID / Handle:
                </label>
                <input
                  type="text"
                  value={fbForm.pageId}
                  onChange={(e) => setFbForm({ ...fbForm, pageId: e.target.value })}
                  placeholder="e.g. 10982347891234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Meta Graph API Page Access Token (Permanent / Long-lived):
                </label>
                <input
                  type="password"
                  value={fbForm.accessToken}
                  onChange={(e) => setFbForm({ ...fbForm, accessToken: e.target.value })}
                  placeholder="EAABwzL..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleSaveFacebook}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Facebook Connection
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-600/20 text-pink-400 flex items-center justify-center font-bold text-sm">
                    IG
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{igAccount.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {igAccount.handle} • {igAccount.followers.toLocaleString()} Followers
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                    igAccount.isConnected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {igAccount.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Instagram Handle / Username:
                </label>
                <input
                  type="text"
                  value={igForm.handle}
                  onChange={(e) => setIgForm({ ...igForm, handle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Instagram Business Account ID:
                </label>
                <input
                  type="text"
                  value={igForm.pageId}
                  onChange={(e) => setIgForm({ ...igForm, pageId: e.target.value })}
                  placeholder="e.g. 17841400234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Instagram Graph API Token:
                </label>
                <input
                  type="password"
                  value={igForm.accessToken}
                  onChange={(e) => setIgForm({ ...igForm, accessToken: e.target.value })}
                  placeholder="EAABwzL..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                onClick={handleSaveInstagram}
                className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Instagram Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
