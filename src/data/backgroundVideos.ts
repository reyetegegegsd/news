export interface BackgroundVideoPreset {
  id: string;
  name: string;
  url: string;
  thumb: string;
  badge: string;
}

export const PRESET_BACKGROUND_VIDEOS: BackgroundVideoPreset[] = [
  {
    id: 'vid-breaking-wire',
    name: '🔴 Breaking News Broadcast Studio Loop',
    badge: 'Trending Live',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumb: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=75',
  },
  {
    id: 'vid-cyber-stream',
    name: '🌐 Global Satellite News Network Loop',
    badge: 'International Wire',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=75',
  },
  {
    id: 'vid-tech-markets',
    name: '⚡ High-Speed Wire Financial Broadcast',
    badge: 'Tech & Markets',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumb: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=300&auto=format&fit=crop&q=75',
  },
  {
    id: 'vid-primetime-pulse',
    name: '🏆 Primetime News Broadcast Pulse',
    badge: 'Primetime',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumb: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300&auto=format&fit=crop&q=75',
  },
];
