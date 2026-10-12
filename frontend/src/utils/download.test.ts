import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob } from './download'

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a link with the blob URL and triggers a click', () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const blob = new Blob(['test'], { type: 'text/plain' })

    downloadBlob(blob, 'file.txt')

    expect(createSpy).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')
  })
})