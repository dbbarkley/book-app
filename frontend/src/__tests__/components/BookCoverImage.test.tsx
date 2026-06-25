import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BookCoverImage } from '../../components/BookCoverImage'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onLoad, onError, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onLoad={onLoad} onError={onError} data-testid="cover-img" />
  ),
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layoutId, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('BookCoverImage', () => {
  describe('skeleton debounce', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('does not show skeleton immediately for a fast-loading image', () => {
      render(<BookCoverImage src="https://pub-test.r2.dev/covers/test.jpg" title="Test Book" />)
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument()
    })

    it('shows skeleton after 100ms if image has not loaded', () => {
      render(<BookCoverImage src="https://pub-test.r2.dev/covers/test.jpg" title="Test Book" />)
      act(() => { jest.advanceTimersByTime(150) })
      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
    })
  })

  describe('Open Library fallback', () => {
    it('tries OL URL on first error when isbn is provided', () => {
      render(
        <BookCoverImage
          src="https://broken.example.com/cover.jpg"
          title="Test Book"
          isbn="9780743273565"
        />
      )
      const img = screen.getByTestId('cover-img')
      fireEvent.error(img)
      expect(img.getAttribute('src')).toContain('covers.openlibrary.org')
      expect(img.getAttribute('src')).toContain('9780743273565')
    })

    it('shows ModernPlaceholder after OL also fails', () => {
      render(
        <BookCoverImage
          src="https://broken.example.com/cover.jpg"
          title="Test Book"
          isbn="9780743273565"
        />
      )
      const img = screen.getByTestId('cover-img')
      fireEvent.error(img)     // → tries OL
      fireEvent.error(img)     // → gives up, shows placeholder
      expect(screen.queryByTestId('cover-img')).not.toBeInTheDocument()
    })

    it('shows ModernPlaceholder immediately on error when no isbn provided', () => {
      render(<BookCoverImage src="https://broken.example.com/cover.jpg" title="Test Book" />)
      const img = screen.getByTestId('cover-img')
      fireEvent.error(img)
      expect(screen.queryByTestId('cover-img')).not.toBeInTheDocument()
    })
  })
})
