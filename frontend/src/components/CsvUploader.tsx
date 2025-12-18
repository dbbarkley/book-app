'use client'

import { useState, useRef, DragEvent } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import InputField from './InputField'

interface CsvUploaderProps {
  onFileSelected: (file: File) => void
  isLoading?: boolean
  error?: string | null
}

/**
 * CsvUploader Component
 * 
 * Drag-and-drop or click-to-upload CSV file picker
 * Validates file type and size on the client side
 * Shows file preview and allows removal
 */
export function CsvUploader({ onFileSelected, isLoading = false, error = null }: CsvUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return 'Please upload a CSV file'
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 10MB'
    }

    return null
  }

  const handleFileChange = (file: File) => {
    const error = validateFile(file)
    
    if (error) {
      setValidationError(error)
      setSelectedFile(null)
      return
    }

    setValidationError(null)
    setSelectedFile(file)
    onFileSelected(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const displayError = error || validationError

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-400 hover:bg-emerald-50'}
        `}
      >
        <InputField
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          disabled={isLoading}
          className="hidden"
        />

        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-full border border-gray-200">
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
          </div>

          <div>
            <p className="text-base font-medium text-gray-900">
              Drop your Goodreads CSV here
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse files
            </p>
          </div>

          <p className="text-xs text-gray-400">
            CSV files up to 10MB
          </p>
        </div>
      </div>

      {/* Selected file preview */}
      {selectedFile && !displayError && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          {!isLoading && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
              className="p-1 hover:bg-emerald-100 rounded transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{displayError}</p>
        </div>
      )}
    </div>
  )
}

