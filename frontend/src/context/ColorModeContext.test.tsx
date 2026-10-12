import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ColorModeProvider, useColorMode } from './ColorModeContext'

function Probe() {
  const { mode, toggleColorMode } = useColorMode()
  return <button onClick={toggleColorMode}>{mode}</button>
}

describe('ColorModeContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to light mode', () => {
    render(
      <ColorModeProvider>
        <Probe />
      </ColorModeProvider>,
    )
    expect(screen.getByRole('button').textContent).toBe('light')
  })

  it('toggles color mode and persists to localStorage', () => {
    render(
      <ColorModeProvider>
        <Probe />
      </ColorModeProvider>,
    )
    const button = screen.getByRole('button')

    fireEvent.click(button)
    expect(button.textContent).toBe('dark')
    expect(localStorage.getItem('smart-warehouse-theme')).toBe('dark')

    fireEvent.click(button)
    expect(button.textContent).toBe('light')
    expect(localStorage.getItem('smart-warehouse-theme')).toBe('light')
  })
})