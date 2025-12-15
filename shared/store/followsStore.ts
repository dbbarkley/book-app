// Follows Store - Zustand store for user follows
// Reusable in Next.js and React Native

import { create } from 'zustand'
import type { Follow } from '../types'
import { apiClient } from '../api/client'

interface FollowsState {
  follows: Follow[]
  loading: boolean
  error: string | null
  fetchFollows: () => Promise<void>
  follow: (followableType: 'User' | 'Author' | 'Book', followableId: number) => Promise<void>
  unfollow: (followId: number) => Promise<void>
  isFollowing: (followableType: 'User' | 'Author' | 'Book', followableId: number) => boolean
  getFollowId: (
    followableType: 'User' | 'Author' | 'Book',
    followableId: number
  ) => number | null
}

export const useFollowsStore = create<FollowsState>((set, get) => ({
  follows: [],
  loading: false,
  error: null,

  fetchFollows: async () => {
    set({ loading: true, error: null })
    try {
      const follows = await apiClient.getFollows()
      set({ follows, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch follows',
        loading: false,
      })
    }
  },

  follow: async (followableType: 'User' | 'Author' | 'Book', followableId: number) => {
    console.log('followsStore.follow called:', { followableType, followableId })
    
    // Cannot follow external entities (ID 0 = from Google Books)
    if (followableId === 0) {
      const error = new Error('Cannot follow external entity. Entity needs to be imported first.')
      console.error('followsStore.follow error:', error)
      set({ error: error.message })
      throw error
    }
    
    try {
      console.log('Calling apiClient.follow...')
      const follow = await apiClient.follow(followableType, followableId)
      console.log('apiClient.follow response:', follow)
      const currentFollows = get().follows || []
      set({ follows: [...currentFollows, follow] })
      console.log('Follow added to store')
    } catch (error) {
      console.error('followsStore.follow error:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to follow',
      })
      throw error
    }
  },

  unfollow: async (followId: number) => {
    try {
      await apiClient.unfollow(followId)
      const currentFollows = get().follows || []
      set({ follows: currentFollows.filter((f) => f.id !== followId) })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to unfollow',
      })
      throw error
    }
  },

  isFollowing: (followableType: 'User' | 'Author' | 'Book', followableId: number) => {
    const follows = get().follows || []
    return follows.some(
      (f) => f.followable_type === followableType && f.followable_id === followableId
    )
  },

  getFollowId: (followableType: 'User' | 'Author' | 'Book', followableId: number) => {
    const follows = get().follows || []
    const follow = follows.find(
      (f) => f.followable_type === followableType && f.followable_id === followableId
    )
    return follow?.id ?? null
  },
}))

