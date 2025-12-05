import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { Badge } from './badge'

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>)
    const badge = screen.getByText('Default Badge')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-blue-600')
  })

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>)
    const badge = screen.getByText('Secondary Badge')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gradient-to-r', 'from-gray-100', 'to-gray-200')
  })

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>)
    const badge = screen.getByText('Destructive Badge')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gradient-to-r', 'from-red-500', 'to-red-600')
  })

  it('renders with success variant', () => {
    render(<Badge variant="success">Success Badge</Badge>)
    const badge = screen.getByText('Success Badge')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-green-600')
  })

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning Badge</Badge>)
    const badge = screen.getByText('Warning Badge')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gradient-to-r', 'from-yellow-500', 'to-orange-500')
  })

  it('renders with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>)
    const badge = screen.getByText('Outline Badge')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('border-gray-300', 'bg-transparent')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    const badge = screen.getByText('Custom Badge')

    expect(badge).toHaveClass('custom-class')
  })
})
