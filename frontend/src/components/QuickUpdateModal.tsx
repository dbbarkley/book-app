'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  CheckCircle, 
  BookOpen, 
  Clock, 
  XCircle, 
  Lock, 
  Globe,
  Star
} from 'lucide-react'
import { 
  useBookProgress, 
  useUpdateBookShelf, 
  useUpdateBookVisibility,
  useBookShelf
} from '@book-app/shared/hooks'
import type { 
  UserBook,
  ShelfStatus,
  Visibility
} from '@book-app/shared/types'
import Button from './Button'
import { BookCoverImage } from './BookCoverImage'

interface QuickUpdateModalProps {
  userBook: UserBook
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export default function QuickUpdateModal({ 
  userBook, 
  isOpen, 
  onClose, 
  onUpdate 
}: QuickUpdateModalProps) {
  const { updateProgress, loading: progressLoading } = useBookProgress()
  const { updateShelf, loading: updateShelfLoading } = useUpdateBookShelf()
  const { addToShelf, loading: addShelfLoading } = useBookShelf()
  const { setVisibility, loading: visibilityLoading } = useUpdateBookVisibility()

  const [status, setStatus] = useState<ShelfStatus>(userBook.status)
  const [visibility, setVisibilityState] = useState<Visibility>(userBook.visibility || 'public')
  const [pagesRead, setPagesRead] = useState(userBook.pages_read?.toString() || '0')
  const [totalPages, setTotalPages] = useState(
    userBook.total_pages?.toString() || userBook.book?.page_count?.toString() || '0'
  )
  const [percentage, setPercentage] = useState(userBook.completion_percentage || 0)
  const [dnfPage, setDnfPage] = useState(userBook.dnf_page?.toString() || '')
  const [dnfReason, setDnfReason] = useState(userBook.dnf_reason || '')

  const isBusy = progressLoading || updateShelfLoading || addShelfLoading || visibilityLoading

  useEffect(() => {
    if (isOpen) {
      setStatus(userBook.status)
      setVisibilityState(userBook.visibility || 'public')
      setPagesRead(userBook.pages_read?.toString() || '0')
      setTotalPages(userBook.total_pages?.toString() || userBook.book?.page_count?.toString() || '0')
      setPercentage(userBook.completion_percentage || 0)
      setDnfPage(userBook.dnf_page?.toString() || '')
      setDnfReason(userBook.dnf_reason || '')
    }
  }, [isOpen, userBook])

  if (!isOpen) return null

  const handleSave = async () => {
    try {
      let activeUserBookId = userBook.id

      // 1. Create or Update Status & Visibility
      if (activeUserBookId === 0) {
        // Create new entry
        const newBook = await addToShelf(userBook.book_id, status, userBook.book, {
          visibility,
          dnf_page: status === 'dnf' ? parseInt(dnfPage) : undefined,
          dnf_reason: status === 'dnf' ? dnfReason : undefined,
          total_pages: parseInt(totalPages) > 0 ? parseInt(totalPages) : undefined
        })
        activeUserBookId = newBook.id
      } else {
        // Update existing
        await updateShelf({
          userBookId: activeUserBookId,
          status,
          visibility,
          dnf_page: status === 'dnf' ? parseInt(dnfPage) : undefined,
          dnf_reason: status === 'dnf' ? dnfReason : undefined,
        })
      }

      // 2. Update Progress if Reading (and we have an ID now)
      if (status === 'reading' && activeUserBookId > 0) {
        const pRead = parseInt(pagesRead)
        const tPages = parseInt(totalPages)
        
        if (tPages > 0) {
          await updateProgress(activeUserBookId, {
            pages_read: pRead,
            total_pages: tPages,
            completion_percentage: Math.round((pRead / tPages) * 100)
          })
        } else {
          await updateProgress(activeUserBookId, {
            completion_percentage: percentage
          })
        }
      }

      onUpdate?.()
      onClose()
    } catch (error) {
      console.error('Failed to save updates:', error)
    }
  }

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    setPercentage(val)
    if (parseInt(totalPages) > 0) {
      setPagesRead(Math.round((val / 100) * parseInt(totalPages)).toString())
    }
  }

  const statusOptions: { id: ShelfStatus; label: string; icon: any; color: string }[] = [
    { id: 'to_read', label: 'To Read', icon: Clock, color: 'text-amber-600' },
    { id: 'reading', label: 'Reading', icon: BookOpen, color: 'text-blue-600' },
    { id: 'read', label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
    { id: 'dnf', label: 'DNF', icon: XCircle, color: 'text-rose-600' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-16 flex-none">
              {userBook.book && (
                <BookCoverImage 
                  src={userBook.book.cover_image_url} 
                  title={userBook.book.title} 
                  size="small"
                  className="rounded shadow-sm"
                />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 line-clamp-1">{userBook.book?.title}</h3>
              <p className="text-sm text-slate-500">Update your progress</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Status Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    status === opt.id 
                      ? `border-primary-600 bg-primary-50 ${opt.color}` 
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <opt.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress (Only if Reading) */}
          {status === 'reading' && (
            <div className="space-y-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reading Progress</label>
                  <span className="text-2xl font-black text-primary-600">{percentage}%</span>
                </div>
                
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={percentage}
                  onChange={handlePercentageChange}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pages Read</label>
                  <input 
                    type="number"
                    value={pagesRead}
                    onChange={(e) => {
                      setPagesRead(e.target.value)
                      const p = parseInt(e.target.value)
                      const t = parseInt(totalPages)
                      if (t > 0) setPercentage(Math.min(100, Math.round((p / t) * 100)))
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pages</label>
                  <input 
                    type="number"
                    value={totalPages}
                    onChange={(e) => {
                      setTotalPages(e.target.value)
                      const p = parseInt(pagesRead)
                      const t = parseInt(e.target.value)
                      if (t > 0) setPercentage(Math.min(100, Math.round((p / t) * 100)))
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DNF Details */}
          {status === 'dnf' && (
            <div className="space-y-4 bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Stopped at Page</label>
                <input 
                  type="number"
                  value={dnfPage}
                  onChange={(e) => setDnfPage(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-white border border-rose-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Why did you stop?</label>
                <textarea 
                  value={dnfReason}
                  onChange={(e) => setDnfReason(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full bg-white border border-rose-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* Visibility & Privacy */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Privacy</label>
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setVisibilityState('public')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  visibility === 'public' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                onClick={() => setVisibilityState('private')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  visibility === 'private' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center italic">
              {visibility === 'private' 
                ? 'Only you can see this book in your library.' 
                : 'Your followers can see this book and your progress.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <Button 
            onClick={handleSave} 
            isLoading={isBusy} 
            fullWidth 
            size="lg"
            className="rounded-2xl shadow-xl shadow-primary-600/20 py-4"
          >
            Save Updates
          </Button>
        </div>
      </div>
    </div>
  )
}

