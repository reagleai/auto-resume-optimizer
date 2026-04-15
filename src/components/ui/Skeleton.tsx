import { cn } from '@/lib/cn'

type SkeletonVariant = 'text' | 'heading' | 'avatar' | 'image' | 'custom'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string
  height?: string
  className?: string
}

const presets: Record<SkeletonVariant, { width: string; height: string }> = {
  text: { width: '100%', height: '12px' },
  heading: { width: '55%', height: '18px' },
  avatar: { width: '48px', height: '48px' },
  image: { width: '100%', height: '200px' },
  custom: { width: '100%', height: '16px' },
}

export function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
  const preset = presets[variant]
  const isAvatar = variant === 'avatar'
  return (
    <div
      className={cn('skeleton', className)}
      style={{
        width: width || preset.width,
        height: height || preset.height,
        borderRadius: isAvatar ? 'var(--radius-full)' : 'var(--radius-sm)',
      }}
    />
  )
}
