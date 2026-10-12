import React, { useState, useEffect } from 'react';
import { TrendingNewsItem } from '../types';
import { COUNTRIES } from '../data/countries';
import {
  RefreshCw,
  Search,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';

interface TrendingNewsSelectorProps {
  onSelectTopic: (
    topic: string,
    category: string,
    suggestedImg?: string,
    autoPoster?: any,
    summary?: string,
    item?: TrendingNewsItem
  ) => void;
  isGenerating: boolean;
  selectedTopic: string;
  selectedCountry: string;
  onCountryChange: (countryCode: string) => void;
  onNewsFeedLoaded?: (items: TrendingNewsItem[]) => void;
  activeTimeFilter: string;
  onTimeFilterChange: (timeFilter: string) => void;
  onOpenAiModal?: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Top Stories' },
  { id: 'politics', label: 'Politics' },
  { id: 'business', label: 'Business' },
  { id: 'tech', label: 'Technology' },
  { id: 'sports', label: 'Sports' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'world', label: 'World' },
];

const TIME_FILTERS = [
  { id: 'latest', label: 'Past 1h' },
  { id: '24h', label: '24 Hours' },
  { id: 'viral', label: 'Top Ranking' },
];

export const TrendingNewsSelector: React.FC<TrendingNewsSelectorProps> = ({
  selectedCountry,
  onNewsFeedLoaded,
  activeTimeFilter,
  onTimeFilterChange,
  onOpenAiModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  const [activeSearchTopic, setActiveSearchTopic] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchGoogleNewsFeed(activeCategory, activeTimeFilter, selectedCountry, activeSearchTopic);
  }, [activeCategory, activeTimeFilter, selectedCountry]);

  const fetchGoogleNewsFeed = async (
    cat: string,
    timeFilter: string,
    country: string,
    queryToUse?: string
  ) => {
    setIsLoading(true);
    try {
      const q = (queryToUse !== undefined ? queryToUse : customSearchQuery).trim();
      const url = `/api/news/trending?category=${cat}&country=${country}&timeFilter=${timeFilter}&limit=50${
        q ? `&q=${encodeURIComponent(q)}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.news && Array.isArray(data.news)) {
        if (onNewsFeedLoaded) {
          onNewsFeedLoaded(data.news);
        }
      }
    } catch (e) {
      console.error('Failed to fetch country news feed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSearchQuery.trim();
    if (!trimmed) {
      setActiveSearchTopic('');
      fetchGoogleNewsFeed(activeCategory, activeTimeFilter, selectedCountry, '');
      return;
    }
    setActiveSearchTopic(trimmed);
    fetchGoogleNewsFeed(activeCategory, activeTimeFilter, selectedCountry, trimmed);
  };

  const handleClearSearch = () => {
    setCustomSearchQuery('');
    setActiveSearchTopic('');
    fetchGoogleNewsFeed(activeCategory, activeTimeFilter, selectedCountry, '');
  };

  const currentCountryObj =
    COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 sm:p-4 space-y-3 shadow-xs">
      {/* Category Segmented Bar & Time Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none" role="tablist">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                if (activeSearchTopic) {
                  fetchGoogleNewsFeed(cat.id, activeTimeFilter, selectedCountry, activeSearchTopic);
                }
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 border border-slate-800/60 rounded-lg text-xs">
          {TIME_FILTERS.map((tf) => (
            <button
              key={tf.id}
              onClick={() => onTimeFilterChange(tf.id)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                activeTimeFilter === tf.id
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar - Search Google News Wire */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <form onSubmit={handleCustomSearch} className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={customSearchQuery}
            onChange={(e) => setCustomSearchQuery(e.target.value)}
            placeholder="Search any topic, entity, or breaking wire (e.g. Technology, Market Rally, SpaceX)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-28 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 transition-colors font-normal"
          />
          {customSearchQuery && (
            <button
              type="button"
              onClick={() => setCustomSearchQuery('')}
              className="absolute right-28 mr-2 text-slate-500 hover:text-slate-300 p-0.5"
              title="Clear text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !customSearchQuery.trim()}
            className="absolute right-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:opacity-40 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-white" />
                <span>Searching...</span>
              </>
            ) : (
              <span>Search Wire</span>
            )}
          </button>
        </form>
      </div>

      {/* Active Verified Search Banner */}
      {activeSearchTopic && (
        <div className="flex items-center justify-between bg-slate-950 border border-emerald-900/60 rounded-lg px-3 py-2 text-xs text-emerald-300">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Showing verified dispatches for: <strong className="text-white">"{activeSearchTopic}"</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearSearch}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-900 border border-slate-800 shrink-0 ml-2 transition-colors"
          >
            <X className="w-3 h-3 text-slate-400" />
            <span>Reset to Top Stories</span>
          </button>
        </div>
      )}
    </div>
  );
};
