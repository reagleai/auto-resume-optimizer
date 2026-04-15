import type { LoadingStep, ProfileState } from '@/types'

export const WEBHOOK_TIMEOUT_MS = 90_000 // 90 seconds

export const HISTORY_MAX_ITEMS = 20

export const LOADING_STEPS: LoadingStep[] = [
  { icon: 'zap',          label: 'Connecting to workflow...',      duration: 5000  },
  { icon: 'brain',        label: 'Extracting JD intelligence...',  duration: 10000 },
  { icon: 'search',       label: 'Planning keyword insertions...', duration: 8000  },
  { icon: 'pen-line',     label: 'Rewriting resume sections...',   duration: 10000 },
  { icon: 'check-circle', label: 'Finalizing and assembling...',   duration: 0     },
]

export const DEFAULT_PROFILE: ProfileState = {
  firstName: '',
  lastName: '',
  baseResumeHtml: '',
  webhookUrl: '',
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
