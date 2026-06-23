import type { LoadingStep, ProfileState } from '@/types'

export const WEBHOOK_TIMEOUT_MS = 600_000 // 10 minutes

export const HISTORY_MAX_ITEMS = 20

export const LOADING_STEPS: LoadingStep[] = [
  { icon: 'zap',          label: 'Starting up...',                 duration: 0 },
  { icon: 'brain',        label: 'Extracting JD intelligence...',  duration: 0 },
  { icon: 'search',       label: 'Planning keyword insertions...', duration: 0 },
  { icon: 'pen-line',     label: 'Rewriting resume sections...',   duration: 0 },
  { icon: 'check-circle', label: 'Finalizing and assembling...',   duration: 0 },
]

export const DEFAULT_PROFILE: ProfileState = {
  firstName: '',
  lastName: '',
  baseResumeHtml: '',
  maxgrowthpct: 8,
  companynamefallback: 'unknown-company',
  roletitlefallback: 'target-role',
}

export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', '↵'],  label: 'Generate resume' },
  { keys: ['⌘', 'G'],  label: 'Go to Generator' },
  { keys: ['⌘', 'P'],  label: 'Go to Profile' },
  { keys: ['⌘', 'H'],  label: 'Go to History' },
  { keys: ['Esc'],      label: 'Close modal / dialog' },
]
