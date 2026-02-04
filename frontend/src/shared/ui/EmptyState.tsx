import { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  illustration?: ReactNode
  /** If provided and lottie-react is installed, Lottie animation is shown; otherwise illustration is used */
  lottieUrl?: string
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  illustration,
  lottieUrl: _lottieUrl, // reserved for when lottie-react is available
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center',
        className
      )}
    >
      <div className="w-full max-w-[280px] h-[200px] flex items-center justify-center mb-6">
        {illustration ? (
          illustration
        ) : (
          <div className="w-32 h-32 rounded-3xl bg-primary/5 flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
            <svg
              className="w-16 h-16 text-primary/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-[15px] text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
