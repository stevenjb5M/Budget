import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer Component', () => {
  it('renders copyright text', () => {
    render(<Footer />)

    expect(screen.getByText('© 2025 Steven Brown. All rights reserved.')).toBeInTheDocument()
  })

  it('has correct structure', () => {
    const { container } = render(<Footer />)

    expect(container.firstChild).toHaveClass('footer')
    expect(container.querySelector('.footer-container')).toBeInTheDocument()
    expect(container.querySelector('.footer-text')).toBeInTheDocument()
  })
})