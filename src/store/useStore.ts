import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { HistoryItem } from '../types'

interface StoreState {
  history: HistoryItem[]
  scanCount: number
  reviewShown: boolean
  addHistory: (item: HistoryItem) => void
  removeHistory: (id: string) => void
  clearHistory: () => void
  incrementScan: () => void
  markReviewShown: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      history: [],
      scanCount: 0,
      reviewShown: false,
      addHistory: (item) =>
        set((s) => ({ history: [item, ...s.history].slice(0, 100) })),
      removeHistory: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
      clearHistory: () => set({ history: [] }),
      incrementScan: () => set((s) => ({ scanCount: s.scanCount + 1 })),
      markReviewShown: () => set({ reviewShown: true }),
    }),
    {
      name: 'sukari-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        history: s.history,
        scanCount: s.scanCount,
        reviewShown: s.reviewShown,
      }),
    }
  )
)
