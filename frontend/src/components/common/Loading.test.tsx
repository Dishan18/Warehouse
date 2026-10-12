import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Loading from './Loading'

describe('Loading', () => {
  it('renders a progress indicator', () => {
    render(<Loading />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})