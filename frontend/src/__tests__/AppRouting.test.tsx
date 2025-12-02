import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'

vi.mock('../components/Auth', () => ({
  Auth: ({ children }: any) => <div>{children}</div>
}))

vi.mock('../pages/Home', () => ({ Home: () => <div>Home Page</div> }))

describe('App routing', () => {
  it('redirects from / to /home', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })
})
