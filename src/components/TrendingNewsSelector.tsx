import React, { useState, useEffect } from 'react';
import { TrendingNewsItem } from '../types';
import { COUNTRIES } from '../data/countries';
import { LANGUAGES } from '../data/languages';
import { generateClient50Styles, generateClientVerifiedNews } from '../utils/clientNewsGenerator';
import {
  RefreshCw,
  Search,
  Sparkles,
  ShieldCheck,
  X,
  Globe2,
  Clock,
  Filter,
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
  selectedLanguage: string;
  onLanguageChange?: (languageName: string) => void;
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
  selectedLanguage,
  onCountryChange,
  onLanguageChange,
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
    fetchGoogleNewsFeed(activeCategory, activeTimeFilter, selectedCountry, selectedLanguage, activeSearchTopic);
  }, [activeCategory, activeTimeFilter, selectedCountry, selectedLanguage]);

  const fetchGoogleNewsFeed = async (
    cat: string,
    timeFilter: string,
    country: string,
    lang: string,
    queryToUse?: string
  ) => {
    setIsLoading(true);
    const q = (queryToUse !== undefined ? queryToUse : customSearchQuery).trim();
    const cName = COUNTRIES.find((c) => c.code === country)?.name || country;

    try {
      const url = `/api/news/trending?category=${cat}&country=${country}&language=${encodeURIComponent(lang)}&timeFilter=${timeFilter}&limit=50${
        q ? `&q=${encodeURIComponent(q)}` : ''
      }`;
      const res = await fetch(url);
      if (res.ok) {
        try {
          const data = await res.json();
          if (data.news && Array.isArray(data.news) && data.news.length > 0) {
            if (onNewsFeedLoaded) {
              onNewsFeedLoaded(data.news);
            }
            return;
          }
        } catch {
          // If response is not JSON
        }
      }

      // Fallback for static hosting (GitHub Pages, etc.)
      if (onNewsFeedLoaded) {
        if (q) {
          const generated = generateClient50Styles(q, `Live dispatch for ${q}`);
          onNewsFeedLoaded(generated.slice(0, 20));
        } else {
          const generated = generateClientVerifiedNews(lang, cName, '', timeFilter, 20, cat);
          onNewsFeedLoaded(generated.news);
        }
      }
    } catch (e) {
      console.warn('Country news fetch notice (using client news generator):', e);
      if (onNewsFeedLoaded) {
        if (q) {
          const generated = generateClient50Styles(q, `Live dispatch for ${q}`);
          onNewsFeedLoaded(generated.slice(0, 20));
        } else {
          const generated = generateClientVerifiedNews(lang, cName, '', timeFilter, 20, cat);
          onNewsFeedLoaded(generated.news);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSearchQuery.trim();
    if (!trimmed) {
      setActiveSearchTopic('');
      fetchGoogleNewsFeed(activeCategory, activeTimeFilter, selectedCountry, selectedLanguage, '');
      return;
    }
    setActiveSearchTopic(trimmed);
    fetchGoogleNewsFeed(activeCategory, activeTimeFilter, selectedCountry, selectedLanguage, trimmed);
  };

  const handleClearSearch = () => {
    setCustomSearchQuery('');
    setActiveSearchTopic('');
    fetchGoogleNewsFeed(activeCategory, activeTimeFilter, selectedCountry, selectedLanguage, '');
  };

  const currentCountryObj =
    COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 shadow-md">
      {/* Category Segmented Bar & Time Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none max-w-full" role="tablist">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                fetchGoogleNewsFeed(cat.id, activeTimeFilter, selectedCountry, selectedLanguage, activeSearchTopic);
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-400'
                  : 'bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-xl p-1 text-xs shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-500 ml-1.5 hidden xs:inline" />
          {TIME_FILTERS.map((tf) => (
            <button
              key={tf.id}
              onClick={() => onTimeFilterChange(tf.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                activeTimeFilter === tf.id
                  ? 'bg-amber-500 text-black shadow-xs font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Keyword Search and Country Summary Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
        {/* Search Input Bar */}
        <form onSubmit={handleCustomSearch} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={customSearchQuery}
            onChange={(e) => setCustomSearchQuery(e.target.value)}
            placeholder={`Search news in ${currentCountryObj.name} (${selectedLanguage})...`}
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-rose-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden transition-colors"
          />
          {customSearchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Status & Quick Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
          <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Wire: <strong>{currentCountryObj.name}</strong> • <strong>{selectedLanguage}</strong></span>
          </span>

          <button
            onClick={() => fetchGoogleNewsFeed(activeCategory, activeTimeFilter, selectedCountry, selectedLanguage, activeSearchTopic)}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 text-xs transition cursor-pointer"
            title="Refresh Headlines"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
