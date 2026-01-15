import { cn } from '@/lib/utils'
import type { Banner } from '@/lib/types'

interface PromotionalBannerProps {
  banner: Banner
  onClick?: (banner: Banner) => void
}

const sizeClasses = {
  small: 'h-24 md:h-32',
  medium: 'h-32 md:h-48',
  large: 'h-48 md:h-64',
  full: 'h-64 md:h-80',
}

export function PromotionalBanner({ banner, onClick }: PromotionalBannerProps) {
  const isClickable = banner.linkType !== 'none' && onClick

  const content = (
    <>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${banner.image})`,
          backgroundColor: banner.backgroundColor || undefined,
        }}
      />

      {/* Gradient Overlay */}
      <div
        className={cn(
          'absolute inset-0',
          banner.textColor === 'dark'
            ? 'bg-gradient-to-r from-white/60 to-transparent'
            : 'bg-gradient-to-r from-black/60 to-transparent'
        )}
      />

      {/* Content */}
      <div
        className={cn(
          'relative z-10 flex flex-col justify-center h-full px-6 md:px-10',
          banner.textColor === 'dark' ? 'text-gray-900' : 'text-white'
        )}
      >
        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2">
          {banner.title}
        </h3>
        {banner.subtitle && (
          <p
            className={cn(
              'text-sm md:text-base lg:text-lg',
              banner.textColor === 'dark' ? 'text-gray-700' : 'text-white/90'
            )}
          >
            {banner.subtitle}
          </p>
        )}
      </div>
    </>
  )

  if (isClickable) {
    return (
      <button
        onClick={() => onClick(banner)}
        className={cn(
          'relative w-full overflow-hidden rounded-lg cursor-pointer transform transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]',
          sizeClasses[banner.size]
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg',
        sizeClasses[banner.size]
      )}
    >
      {content}
    </div>
  )
}
