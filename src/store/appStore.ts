import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  ProfileState, GeneratorState, HistoryEntry,
  ToastItem, Theme, GeneratorResult
} from '@/types'
import { DEFAULT_PROFILE, HISTORY_MAX_ITEMS } from '@/lib/constants'

interface AppStore {
  // ── Profile ─────────────────────────────────────────────────────
  profile: ProfileState
  profileLoading: boolean
  setProfile: (data: Partial<ProfileState>) => void
  setProfileLoading: (loading: boolean) => void
  isProfileComplete: () => boolean

  // ── Generator ────────────────────────────────────────────────────
  generator: GeneratorState
  setGeneratorField: (field: 'jd' | 'keywords', value: string) => void
  setGeneratorStatus: (status: GeneratorState['status']) => void
  setLoadingStep: (step: number) => void
  setGeneratorResult: (result: GeneratorResult) => void
  setGeneratorError: (error: string) => void
  resetGenerator: () => void

  // ── History ───────────────────────────────────────────────────────
  history: HistoryEntry[]
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'runNumber'>) => void
  clearHistory: () => void

  // ── Theme ─────────────────────────────────────────────────────────
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void

  // ── Toasts ───────────────────────────────────────────────────────
  toasts: ToastItem[]
  addToast: (message: string, type: ToastItem['type'], duration?: number) => void
  removeToast: (id: string) => void

  // ── Preview (from history) ────────────────────────────────────────
  previewHtml: string | null
  setPreviewHtml: (html: string | null) => void
}

const initialGenerator: GeneratorState = {
  jd: '',
  keywords: '',
  status: 'idle',
  loadingStep: 0,
  result: null,
  error: null,
}

type StoreSet = (
  partial: AppStore | Partial<AppStore> | ((state: AppStore) => AppStore | Partial<AppStore>),
  replace?: boolean,
  action?: string,
) => void

type StoreGet = () => AppStore

function createStore(set: StoreSet, get: StoreGet): AppStore {
  return {
    // ── Profile ─────────────────────────────────────────────────────
    profile: { ...DEFAULT_PROFILE },
    profileLoading: true, // true until initial Supabase fetch completes
    setProfile: (data: Partial<ProfileState>) =>
      set((state) => ({ profile: { ...state.profile, ...data } }), false, 'setProfile'),
    setProfileLoading: (loading: boolean) =>
      set({ profileLoading: loading }, false, 'setProfileLoading'),
    isProfileComplete: () => {
      const p = get().profile
      return !!(p.firstName.trim() && p.lastName.trim() && p.baseResumeHtml.trim() && p.webhookUrl.trim())
    },

    // ── Generator ────────────────────────────────────────────────────
    generator: { ...initialGenerator },
    setGeneratorField: (field: 'jd' | 'keywords', value: string) =>
      set((state) => ({
        generator: { ...state.generator, [field]: value }
      }), false, 'setGeneratorField'),
    setGeneratorStatus: (status: GeneratorState['status']) =>
      set((state) => ({
        generator: { ...state.generator, status }
      }), false, 'setGeneratorStatus'),
    setLoadingStep: (step: number) =>
      set((state) => ({
        generator: { ...state.generator, loadingStep: step }
      }), false, 'setLoadingStep'),
    setGeneratorResult: (result: GeneratorResult) =>
      set((state) => ({
        generator: { ...state.generator, status: 'success' as const, result, error: null }
      }), false, 'setGeneratorResult'),
    setGeneratorError: (error: string) =>
      set((state) => ({
        generator: { ...state.generator, status: 'error' as const, error, result: null }
      }), false, 'setGeneratorError'),
    resetGenerator: () =>
      set((state) => ({
        generator: { ...state.generator, status: 'idle' as const, result: null, error: null, loadingStep: 0 }
      }), false, 'resetGenerator'),

    // ── History ───────────────────────────────────────────────────────
    history: [],
    addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'runNumber'>) =>
      set((state) => {
        const newEntry: HistoryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          runNumber: state.history.length + 1,
        }
        const newHistory = [newEntry, ...state.history].slice(0, HISTORY_MAX_ITEMS)
        return { history: newHistory }
      }, false, 'addHistoryEntry'),
    clearHistory: () =>
      set({ history: [] }, false, 'clearHistory'),

    // ── Theme ─────────────────────────────────────────────────────────
    theme: 'dark' as Theme,
    toggleTheme: () =>
      set((state) => {
        const next: Theme = state.theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        localStorage.setItem('rt-theme', next)
        return { theme: next }
      }, false, 'toggleTheme'),
    setTheme: (theme: Theme) => {
      document.documentElement.setAttribute('data-theme', theme)
      set({ theme }, false, 'setTheme')
    },

    // ── Toasts ───────────────────────────────────────────────────────
    toasts: [],
    addToast: (message: string, type: ToastItem['type'], duration?: number) =>
      set((state) => {
        const newToast: ToastItem = {
          id: crypto.randomUUID(),
          message,
          type,
          duration: duration ?? 4000,
        }
        const toasts = [...state.toasts, newToast].slice(-3)
        return { toasts }
      }, false, 'addToast'),
    removeToast: (id: string) =>
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }), false, 'removeToast'),

    // ── Preview ───────────────────────────────────────────────────────
    previewHtml: null,
    setPreviewHtml: (html: string | null) =>
      set({ previewHtml: html }, false, 'setPreviewHtml'),
  }
}

export const useAppStore = import.meta.env.DEV
  ? create<AppStore>()(devtools(createStore as never))
  : create<AppStore>()(createStore as never)
