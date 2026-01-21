import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import { useAuth } from './useAuth'

export type Milestone = 'local_connection' | 'personal_library' | 'goal_set'

export function useMilestones() {
  const { user, refreshUser } = useAuth()
  const [viewedMilestones, setViewedMilestones] = useState<string[]>([])
  const [readingGoal, setReadingGoal] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user?.preferences) {
      setViewedMilestones(user.preferences.milestones_viewed || [])
      setReadingGoal(user.preferences.reading_goal || null)
    }
  }, [user])

  const markMilestoneViewed = useCallback(async (milestone: Milestone) => {
    if (viewedMilestones.includes(milestone)) return

    const newMilestones = [...viewedMilestones, milestone]
    setViewedMilestones(newMilestones)

    try {
      await apiClient.savePreferences({
        milestones_viewed: newMilestones,
      })
      await refreshUser()
    } catch (error) {
      console.error('Failed to mark milestone as viewed:', error)
      // Rollback on error
      setViewedMilestones(viewedMilestones)
    }
  }, [viewedMilestones, refreshUser])

  const setGoal = useCallback(async (goal: number) => {
    setIsLoading(true)
    try {
      await apiClient.savePreferences({
        reading_goal: goal,
        milestones_viewed: [...viewedMilestones, 'goal_set' as Milestone],
      })
      setReadingGoal(goal)
      setViewedMilestones(prev => [...prev, 'goal_set'])
      await refreshUser()
      return { success: true }
    } catch (error) {
      console.error('Failed to set reading goal:', error)
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }, [viewedMilestones, refreshUser])

  const hasViewedMilestone = useCallback((milestone: Milestone) => {
    return viewedMilestones.includes(milestone)
  }, [viewedMilestones])

  return {
    viewedMilestones,
    readingGoal,
    isLoading,
    markMilestoneViewed,
    setGoal,
    hasViewedMilestone,
  }
}

