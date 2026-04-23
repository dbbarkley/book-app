'use client'

import { useState, useRef, DragEvent } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'

interface CsvUploaderProps {
  onFileSelected: (file: File) => void
  isLoading?: boolean
  error?: string | null
}

export function CsvUploader({ onFileSelected, isLoading = false, error = null }: CsvUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return 'Please upload a CSV file'
    }
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return 'File size must be less than 10MB'
    }
    return null
  }

  const handleFileChange = (file: File) => {
    const err = validateFile(file)
    if (err) {
      setValidationError(err)
      setSelectedFile(null)
      return
    }
    setValidationError(null)
    setSelectedFile(file)
    onFileSelected(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileChange(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false) }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileChange(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setValidationError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const displayError = error || validationError

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className="relative rounded-2xl p-8 text-center transition-all duration-200"
        style={{
          border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-rim)'}`,
          backgroundColor: isDragging ? 'rgba(201,168,76,0.06)' : 'var(--color-grove)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.5 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          disabled={isLoading}
          className="hidden"
        />

        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}>
              <Upload className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-lit)' }}>
              Drop your Goodreads CSV here
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-lit-3)' }}>
              or click to browse files
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>CSV files up to 10MB</p>
        </div>
      </div>

      {/* Selected file */}
      {selectedFile && !displayError && (
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <FileText className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-lit)' }}>
              {selectedFile.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          {!isLoading && (
            <button
              onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
              className="p-1 rounded-lg transition-colors"
              style={{ color: 'var(--color-lit-3)' }}
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {displayError && (
        <div className="flex items-start gap-2 p-3 rounded-xl"
          style={{ backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{displayError}</p>
        </div>
      )}
    </div>
  )
}
