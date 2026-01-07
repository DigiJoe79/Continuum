import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Asset } from '../api/types'

interface AppState {
  // Current project
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void

  // Available assets for autocomplete
  projectAssets: Asset[]
  globalAssets: Asset[]
  setProjectAssets: (assets: Asset[]) => void
  setGlobalAssets: (assets: Asset[]) => void

  // UI state
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),

      projectAssets: [],
      globalAssets: [],
      setProjectAssets: (assets) => set({ projectAssets: assets }),
      setGlobalAssets: (assets) => set({ globalAssets: assets }),

      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'continuum-storage',
      partialize: (state) => ({
        currentProject: state.currentProject,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
