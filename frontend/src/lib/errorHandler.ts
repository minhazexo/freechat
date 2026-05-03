import { toast } from 'sonner'

interface ErrorResponse {
  response?: {
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }
  message?: string
}

export function handleApiError(error: unknown, customMessage?: string): void {
  const errorData = error as ErrorResponse
  
  if (errorData.response?.data?.errors) {
    const errors = errorData.response.data.errors
    Object.values(errors).forEach((messages) => {
      messages.forEach((msg) => toast.error(msg))
    })
    return
  }

  if (errorData.response?.data?.message) {
    toast.error(errorData.response.data.message)
    return
  }

  if (errorData.message) {
    toast.error(errorData.message)
    return
  }

  toast.error(customMessage || 'Something went wrong')
}

export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error)
}