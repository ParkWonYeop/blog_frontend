type AdminPostFilters = {
  page: number;
  keyword: string;
  sort: string;
  categoryName: string;
};

type ChessGameListFilters = {
  page: number;
  size: number;
  sort: string;
};

export const queryKeys = {
  categories: {
    all: ['categories'] as const,
  },
  profile: {
    all: ['profile'] as const,
  },
  blogStats: {
    summary: ['blog-stats', 'summary'] as const,
  },
  posts: {
    all: ['posts'] as const,
    detail: (slug?: string) => ['post', slug] as const,
    category: (category: string, page: number, size: string, keyword: string) => (
      ['posts', 'category', category, page, size, keyword] as const
    ),
    adminManagement: (filters: AdminPostFilters) => (
      ['posts', 'admin', 'management', filters] as const
    ),
    adminLatest: ['posts', 'admin', 'latest'] as const,
    adminPopular: ['posts', 'admin', 'popular'] as const,
  },
  comments: {
    all: ['comments'] as const,
    post: (slug: string) => ['comments', slug] as const,
    adminPage: (page: number) => ['comments', 'admin', { page }] as const,
    adminRecent: ['comments', 'admin', 'recent'] as const,
  },
  dashboard: {
    admin: (range: string) => ['admin-dashboard', range] as const,
  },
  chess: {
    today: (timezone: string) => ['chess-puzzle', 'today', timezone] as const,
    games: {
      all: ['chess-games'] as const,
      list: (filters: ChessGameListFilters) => ['chess-games', filters] as const,
    },
    stats: ['chess-game-stats'] as const,
    game: (gameId: string) => ['chess-game', gameId] as const,
    online: {
      active: ['chess-online-active'] as const,
      list: (filters: { page: number; size: number }) => ['chess-online-games', filters] as const,
      game: (gameId: string) => ['chess-online-game', gameId] as const,
    },
  },
} as const;
