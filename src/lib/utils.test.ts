import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn (className utility)', () => {
  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const isDisabled = false

    expect(cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class'
    )).toBe('base-class active-class')
  })

  it('should handle falsy values', () => {
    expect(cn('class1', null, undefined, false, '', 'class2')).toBe('class1 class2')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['px-2', 'py-1'], ['px-4', 'bg-red-500'])).toBe('py-1 px-4 bg-red-500')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle complex Tailwind conflicts', () => {
    expect(cn(
      'bg-blue-500 text-white px-4 py-2',
      'bg-red-500 px-6'
    )).toBe('text-white py-2 bg-red-500 px-6')
  })
})
