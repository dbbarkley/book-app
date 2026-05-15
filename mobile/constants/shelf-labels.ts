import type { ShelfStatus } from '@book-app/shared'

// Short labels — used in badges and shelf pills
export const SHELF_LABELS: Record<ShelfStatus, string> = {
  reading: 'Reading',
  to_read: 'To Read',
  read:    'Completed',
  dnf:     'DNF',
}

// Long labels — used in page headers and full shelf titles
export const SHELF_TITLES: Record<ShelfStatus | 'private', string> = {
  reading: 'Currently Reading',
  to_read: 'To Read',
  read:    'Completed',
  dnf:     'Did Not Finish',
  private: 'Private',
}
