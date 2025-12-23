/**
 * Event Service
 * 
 * Handles all API calls related to events (book signings, readings, tours, virtual events).
 * 
 * IMPORTANT: Events are NOT user-created. They are:
 * - Automatically fetched from external sources (Eventbrite, Ticketmaster, etc.)
 * - Triggered by background jobs when users follow authors
 * - Stored globally in PostgreSQL and shared across all users
 * - Deduplicated to prevent duplicate events
 * 
 * The frontend ONLY consumes the Rails API - it does NOT scrape or fetch events directly.
 * 
 * Backend Flow (for context):
 * 1. User follows an author
 * 2. Backend triggers background job (Sidekiq)
 * 3. Job fetches events from external APIs
 * 4. Events are deduplicated and stored in Postgres
 * 5. Frontend fetches events via Rails API
 * 
 * Future Expandability:
 * - RSVPs: Add `rsvp` field to Event model, POST /events/:id/rsvp
 * - Calendar sync: Generate .ics files, POST /events/:id/add_to_calendar
 * - Event notifications: Subscribe to event reminders
 * - Personalized recommendations: ML-based event suggestions
 */

import { apiClient } from '../api/client'
import type { 
  Event, 
  EventSearchParams, 
  EventsResponse, 
  RefreshEventsResponse,
  Venue 
} from '../types'

/**
 * Fetch all known literary venues
 * 
 * @param params - Optional filters (city, state, zipcode)
 * @returns Promise<{ venues: Venue[] }>
 */
export const getVenues = async (params?: { city?: string; state?: string; zipcode?: string }): Promise<{ venues: Venue[] }> => {
  const response = await (apiClient as any).client.get('/venues', { params })
  return response.data
}

/**
 * Fetch events for followed authors
 * 
 * Returns upcoming events from authors the current user follows.
 * Events are sorted by start date (soonest first).
 * 
 * @param params - Optional filters (page, per_page, upcoming, event_type, etc.)
 * @returns Promise<EventsResponse>
 */
export const getEvents = async (params?: EventSearchParams): Promise<EventsResponse> => {
  // Use the apiClient's internal axios client directly for custom endpoints
  const response = await (apiClient as any).client.get('/events', {
    params: {
      page: params?.page,
      per_page: params?.per_page,
      upcoming: params?.upcoming,
      event_type: params?.event_type,
      audience_type: params?.audience_type,
      is_virtual: params?.is_virtual,
      start_date: params?.start_date,
      end_date: params?.end_date,
      zipcode: params?.zipcode,
      radius: params?.radius,
    }
  })
  
  // Normalize response - handle different response formats
  const data = response.data
  
  // If response has events array directly
  if (data.events) {
    return {
      events: data.events || [],
      pagination: data.pagination
    }
  }
  
  // If response is the events array itself
  if (Array.isArray(data)) {
    return {
      events: data,
      pagination: undefined
    }
  }
  
  // Default fallback
  return {
    events: [],
    pagination: undefined
  }
}

/**
 * Fetch events for a specific author
 * 
 * Returns all events for a given author (both upcoming and past).
 * Useful for author profile pages.
 * 
 * @param authorId - Author ID
 * @param params - Optional filters
 * @returns Promise<EventsResponse>
 */
export const getAuthorEvents = async (
  authorId: number, 
  params?: EventSearchParams
): Promise<EventsResponse> => {
  const response = await (apiClient as any).client.get(
    `/authors/${authorId}/events`,
    {
      params: {
        page: params?.page,
        per_page: params?.per_page,
        upcoming: params?.upcoming,
        event_type: params?.event_type,
        audience_type: params?.audience_type,
        is_virtual: params?.is_virtual,
      }
    }
  )
  
  // Normalize response
  const data = response.data
  
  if (data.events) {
    return {
      events: data.events || [],
      pagination: data.pagination
    }
  }
  
  if (Array.isArray(data)) {
    return {
      events: data,
      pagination: undefined
    }
  }
  
  return {
    events: [],
    pagination: undefined
  }
}

/**
 * Fetch a single event by ID
 * 
 * @param eventId - Event ID
 * @returns Promise<Event>
 */
export const getEvent = async (eventId: number): Promise<Event> => {
  const response = await (apiClient as any).client.get<{ event: Event }>(`/events/${eventId}`)
  return response.data.event
}

/**
 * Manually refresh events for an author
 * 
 * Triggers a background job to fetch new events from external sources.
 * This is rate-limited on the backend (e.g., max once per hour per author).
 * 
 * Use Cases:
 * - User clicks "Check for new events" button on author profile
 * - User wants to force a refresh for a specific author
 * 
 * Backend Flow:
 * 1. API receives POST /events/refresh?author_id=123
 * 2. Enqueues Sidekiq job to fetch events
 * 3. Job scrapes Eventbrite, Ticketmaster, etc.
 * 4. New events are saved to Postgres
 * 5. Response includes updated count and timestamp
 * 
 * @param authorId - Optional author ID (if null, refreshes all followed authors)
 * @returns Promise<RefreshEventsResponse>
 */
export const refreshEvents = async (authorId?: number): Promise<RefreshEventsResponse> => {
  const response = await (apiClient as any).client.post<RefreshEventsResponse>(
    '/events/refresh',
    {},
    {
      params: authorId ? { author_id: authorId } : undefined
    }
  )
  return response.data
}

/**
 * Future: RSVP to an event
 * 
 * Uncomment when backend implements RSVP functionality.
 * 
 * @param eventId - Event ID
 * @returns Promise<{ message: string }>
 */
// export const rsvpToEvent = async (eventId: number): Promise<{ message: string }> => {
//   const response = await apiClient.post<{ message: string }>(`/events/${eventId}/rsvp`)
//   return response.data
// }

/**
 * Future: Cancel RSVP
 * 
 * @param eventId - Event ID
 * @returns Promise<{ message: string }>
 */
// export const cancelRsvp = async (eventId: number): Promise<{ message: string }> => {
//   const response = await apiClient.delete<{ message: string }>(`/events/${eventId}/rsvp`)
//   return response.data
// }

/**
 * Future: Add event to calendar
 * 
 * Generates a .ics file for calendar apps (Google Calendar, Apple Calendar, etc.)
 * 
 * @param eventId - Event ID
 * @returns Promise<Blob> - .ics file as blob
 */
// export const addToCalendar = async (eventId: number): Promise<Blob> => {
//   const response = await apiClient.get(`/events/${eventId}/calendar.ics`, {
//     responseType: 'blob'
//   })
//   return response.data
// }

export default {
  getEvents,
  getAuthorEvents,
  getEvent,
  refreshEvents,
}

