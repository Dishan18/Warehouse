import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

vi.mock('react-hot-toast', () => ({
  Toaster: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: (() => {
    const store = new Map<string, string>()
    return {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, String(value))
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key)
      }),
      clear: vi.fn(() => {
        store.clear()
      }),
      key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
      get length() {
        return store.size
      },
    }
  })(),
})