import { describe, it, expect, vi } from 'vitest'

describe('errorHandler', () => {
  it('should have logError function', async () => {
    const { logError } = await import('./errorHandler')
    expect(logError).toBeDefined()
    expect(typeof logError).toBe('function')
  })

  it('should have handleApiError function', async () => {
    const { handleApiError } = await import('./errorHandler')
    expect(handleApiError).toBeDefined()
    expect(typeof handleApiError).toBe('function')
  })

  it('logError should accept context and error', async () => {
    const { logError } = await import('./errorHandler')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    logError('TestContext', new Error('test error'))
    
    expect(consoleSpy).toHaveBeenCalledWith('[TestContext]', expect.any(Error))
    consoleSpy.mockRestore()
  })
})