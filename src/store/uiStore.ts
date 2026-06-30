import { create } from 'zustand'

interface UiState {
  selectedSvgElementId: string | null
  setSelected: (id: string) => void
  clearSelection: () => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedSvgElementId: null,
  setSelected: (id) => set({ selectedSvgElementId: id }),
  clearSelection: () => set({ selectedSvgElementId: null }),
}))
