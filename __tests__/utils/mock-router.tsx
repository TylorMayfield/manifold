import React from 'react'
import { createMemoryHistory } from 'history'

// Mock Next.js Router
export const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  basePath: '',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  defaultLocale: 'en',
  domainLocales: [],
  isPreview: false
}

// Mock useRouter hook
export const useMockRouter = () => mockRouter

// Router provider for tests
export const MockRouterProvider: React.FC<{ children: React.ReactNode; router?: any }> = ({ 
  children, 
  router = mockRouter 
}) => {
  // This would wrap components with router context
  return <>{children}</>
}

// Memory router for testing navigation
export const createTestRouter = (initialPath = '/') => {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  
  return {
    ...mockRouter,
    push: (url: string) => {
      history.push(url)
      mockRouter.push(url)
    },
    back: () => {
      history.goBack()
      mockRouter.back()
    },
    pathname: history.location.pathname,
    asPath: history.location.pathname,
    query: new URLSearchParams(history.location.search),
    history
  }
}

export default mockRouter
