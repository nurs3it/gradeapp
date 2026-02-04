import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}
import { AuthProvider } from '@/shared/lib/auth'
import { ThemeProvider } from '@/shared/lib/ThemeProvider'
import { I18nProvider } from '@/shared/lib/i18n/I18nProvider'
import { ToastProvider } from '@/shared/lib/ToastProvider'
import { Router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={routerFutureFlags}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <Router />
              </Suspense>
            </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nProvider>
  )
}

export default App

