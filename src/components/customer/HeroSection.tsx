import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { HeroConfig } from '@/lib/types'

interface HeroSectionProps {
  config: HeroConfig
  onCtaClick: (link: string) => void
}

export function HeroSection({ config, onCtaClick }: HeroSectionProps) {
  if (!config.active) {
    return null
  }

  const textAlignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }

  return (
    <section className="relative w-full min-h-[50vh] md:min-h-[60vh] lg:min-h-[70vh] overflow-hidden bg-black group">
      {/* Background Image with Zoom Effect using CSS */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 transition-transform duration-[10000ms] ease-in-out transform scale-110 group-hover:scale-100"
        style={{ backgroundImage: `url(${config.backgroundImage})` }}
      />

      {/* Heavy Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />

      {/* Content */}
      <div
        className={cn(
          'relative z-10 flex flex-col justify-center h-full min-h-[50vh] md:min-h-[60vh] lg:min-h-[70vh] px-6 md:px-12 lg:px-24 animate-in fade-in slide-in-from-bottom-4 duration-700',
          textAlignmentClasses[config.textAlignment]
        )}
      >
        {/* Tagline - High Contrast Badge */}
        {config.tagline && (
          <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
            <span className="bg-yellow-500 text-black font-black text-sm md:text-lg px-4 py-1 uppercase tracking-widest skew-x-[-12deg] inline-block">
              {config.tagline}
            </span>
          </div>
        )}

        {/* Title - Huge Typography */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-4 leading-[0.9] uppercase drop-shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {config.title}
        </h1>

        {/* Subtitle */}
        {config.subtitle && (
          <p className="text-lg md:text-2xl text-gray-200 mb-8 max-w-2xl font-medium border-l-4 border-primary pl-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {config.subtitle}
          </p>
        )}

        {/* CTA Button */}
        {config.ctaText && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
            <Button
              size="lg"
              onClick={() => onCtaClick(config.ctaLink)}
              className="bg-primary hover:bg-primary/90 text-white text-lg md:text-xl font-bold uppercase tracking-wider px-10 py-7 rounded-sm shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {config.ctaText}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
