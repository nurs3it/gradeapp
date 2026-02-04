import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98] rounded-xl',
          {
            'bg-primary text-primary-foreground hover:opacity-90 shadow-sm': variant === 'default',
            'bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm': variant === 'destructive',
            'border border-border bg-transparent hover:bg-accent': variant === 'outline',
            'bg-secondary text-secondary-foreground hover:opacity-90': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
            'h-10 px-4 text-[15px]': size === 'default',
            'h-9 px-3 text-sm rounded-lg': size === 'sm',
            'h-11 px-6 text-base rounded-xl': size === 'lg',
            'h-10 w-10 rounded-xl': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
