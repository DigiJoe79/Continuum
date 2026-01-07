/**
 * Centralized React Query key factory
 *
 * Usage:
 *   import { queryKeys } from '../api/queryKeys'
 *
 *   // In queries
 *   useQuery({ queryKey: queryKeys.assets.list({ project_id: 1 }), ... })
 *
 *   // In mutations (invalidation)
 *   queryClient.invalidateQueries({ queryKey: queryKeys.assets.all })
 */

export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.projects.all, 'detail', id] as const,
  },

  assets: {
    all: ['assets'] as const,
    list: (params?: { project_id?: number; type?: string; is_global?: boolean }) =>
      [...queryKeys.assets.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.assets.all, 'detail', id] as const,
    global: (type?: string) => [...queryKeys.assets.all, 'global', type] as const,
    allGlobal: () => [...queryKeys.assets.all, 'global', 'all'] as const,
  },

  variants: {
    all: ['variants'] as const,
    detail: (id: number) => [...queryKeys.variants.all, 'detail', id] as const,
  },

  scenes: {
    all: ['scenes'] as const,
    list: (projectId?: number) => [...queryKeys.scenes.all, 'list', projectId] as const,
    detail: (id: number) => [...queryKeys.scenes.all, 'detail', id] as const,
  },

  settings: {
    all: ['settings'] as const,
  },

  llm: {
    all: ['llm'] as const,
    test: () => [...queryKeys.llm.all, 'test'] as const,
    logs: () => [...queryKeys.llm.all, 'logs'] as const,
  },
} as const
