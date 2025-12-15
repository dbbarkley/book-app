import { useState } from 'react'
import { apiClient } from '../api/client'

/**
 * Hook for uploading Goodreads CSV and initiating the import process
 * 
 * Returns upload function and loading/error states
 */
export function useGoodreadsImport() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importId, setImportId] = useState<number | null>(null)

  const uploadCsv = async (file: File) => {
    setIsUploading(true)
    setError(null)
    setImportId(null)

    try {
      // Validate file on client side first
      if (!file.name.endsWith('.csv')) {
        throw new Error('Please upload a CSV file')
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      const response = await apiClient.uploadGoodreadsCsv(file)
      setImportId(response.import.id)
      return response.import
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to upload CSV'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const reset = () => {
    setError(null)
    setImportId(null)
    setIsUploading(false)
  }

  return {
    uploadCsv,
    isUploading,
    error,
    importId,
    reset,
  }
}

