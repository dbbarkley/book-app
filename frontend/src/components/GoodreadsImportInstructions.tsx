'use client'

import { FileText, Download, Info } from 'lucide-react'

export function GoodreadsImportInstructions() {
  const handleOpenGoodreadsExport = () => {
    window.open('https://www.goodreads.com/review/import', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="rounded-2xl p-6 space-y-6"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--color-grove)' }}>
          <FileText className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-xl font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
            Import your Goodreads library
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-lit-2)' }}>
            Bring your entire reading history, ratings, and shelves over in less than a minute.
          </p>
        </div>
      </div>

      {/* Info callout */}
      <div className="rounded-xl p-4 flex gap-3"
        style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-lit-3)' }} />
        <div className="text-sm">
          <p className="font-semibold mb-0.5" style={{ color: 'var(--color-lit-2)' }}>Why export manually?</p>
          <p style={{ color: 'var(--color-lit-3)' }}>
            Goodreads doesn't provide an API for third-party apps. CSV export is their official
            data portability method.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-lit-3)' }}>
          How to export from Goodreads
        </p>
        {[
          'Click the button below to open the Goodreads export page',
          'Scroll down and click "Export Library"',
          'Wait for the CSV file to download (usually a few seconds)',
          'Come back here and upload the CSV file below',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}>
              {i + 1}
            </span>
            <p className="text-sm pt-0.5" style={{ color: 'var(--color-lit-2)' }}>{text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleOpenGoodreadsExport}
        className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
      >
        <Download className="w-4 h-4" />
        Open Goodreads Export Page
      </button>
    </div>
  )
}
