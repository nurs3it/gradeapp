import { ReactNode, useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Sidebar } from '../sidebar/Sidebar'
import { Header } from '../header/Header'
import { BottomNav } from '../bottom-nav/BottomNav'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  })

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div
        className={clsx(
          'flex-1 flex flex-col min-w-0 transition-[padding] duration-200',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <Header showMenuButton={false} />
        <main className="flex-1 w-full p-4 sm:p-6 overflow-auto pb-20 lg:pb-6 safe-area-bottom">
          {children}
        </main>
      </div>
      <BottomNav className="lg:hidden" />
    </div>
  )
}
