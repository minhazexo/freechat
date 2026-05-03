import { describe, it, expect } from 'vitest'
import { formatDate, formatDuration, cn } from './utils'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = '2024-01-15T10:30:00Z'
    const result = formatDate(date)
    expect(result).toBeTruthy()
  })

  it('should handle invalid date', () => {
    const result = formatDate('invalid-date')
    expect(result).toBeTruthy()
  })
})

describe('formatDuration', () => {
  it('should format seconds to time string', () => {
    expect(formatDuration(30)).toBe('0:30')
    expect(formatDuration(60)).toBe('1:00')
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(3600)).toBe('60:00')
  })
})

describe('cn', () => {
  it('should combine class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const isFalse = false
    const isTrue = true
    expect(cn('foo', isFalse && 'bar')).toBe('foo')
    expect(cn('foo', isTrue && 'bar')).toBe('foo bar')
  })

  it('should handle empty strings', () => {
    expect(cn('', 'bar')).toBe('bar')
    expect(cn('foo', '')).toBe('foo')
  })
})