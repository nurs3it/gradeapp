import * as React from 'react'
import { cn } from '../lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ value: controlledValue, defaultValue = '', onValueChange, className, children, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue
    const handleValueChange = React.useCallback(
      (v: string) => {
        if (controlledValue === undefined) setUncontrolledValue(v)
        onValueChange?.(v)
      },
      [controlledValue, onValueChange]
    )
    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn(className)} data-state={value} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      'inline-flex h-9 items-center rounded-[10px] bg-neutral-200/90 dark:bg-neutral-700/80 p-0.5',
      className
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext)
    const isActive = ctx?.value === value
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? 'active' : 'inactive'}
        onClick={() => ctx?.onValueChange(value)}
        className={cn(
          'inline-flex min-w-0 flex-1 basis-0 items-center justify-center whitespace-nowrap rounded-[8px] px-4 py-1.5 text-[13px] font-semibold transition-all duration-200 ease-out',
          'text-neutral-500 dark:text-neutral-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          'data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
          'dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-neutral-100 dark:data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext)
    if (ctx?.value !== value) return null
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn(
          'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
