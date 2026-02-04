import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Router } from '../router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/shared/lib/i18n/config'

const queryClient = new QueryClient()

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  )
}

describe('Router', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <Router />
      </TestWrapper>
    )
    // Basic smoke test
    expect(document.body).toBeTruthy()
  })
})

