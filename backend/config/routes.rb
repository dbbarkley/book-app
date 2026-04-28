Rails.application.routes.draw do
  mount ActionCable.server => '/cable'

  namespace :api do
    namespace :v1 do
      # Authentication
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      post 'auth/logout', to: 'auth#logout'
      post 'auth/refresh', to: 'auth#refresh'
      get 'auth/me', to: 'auth#me'
      
      # Social Auth
      get 'auth/:provider/callback', to: 'auth#callback'
      get 'auth/facebook/callback', to: 'auth#facebook' # Legacy support
      get 'auth/failure', to: redirect('http://localhost:3002/login?error=auth_failed')
      
      # Users
      # Preferences routes must come BEFORE resources to avoid route conflicts
      get 'users/preferences', to: 'users#preferences'
      post 'users/preferences', to: 'users#update_preferences'
      get 'users/search', to: 'users#search'
      
      resources :users, only: [:show, :update] do
        get 'profile', on: :member
        get 'following', on: :member
        get 'followers', on: :member
        get 'library', on: :member
        get 'stats', on: :member
        get 'friends', on: :member
        # get 'genre/:genre/books', on: :member, action: :genre_books, constraints: { genre: /[^\/]+/ }  # disabled: gamification hidden
      end
      
      # Follows
      resources :follows, only: [:create, :index, :destroy]

      # Book Suggestions
      resources :book_suggestions, only: [:create] do
        collection do
          get  :received
        end
        member do
          patch :dismiss
        end
      end

      # Friendships
      resources :friendships, only: [:index, :create, :update, :destroy] do
        collection do
          get  :pending
          get  'status/:user_id', action: :status
        end
      end
      
      # Feed
      get  'feed',             to: 'feed#index'
      post 'feed/mark_viewed', to: 'feed#mark_viewed'
      get  'feed/unread_count',to: 'feed#unread_count'

      # Recommendations
      get  'recommendations/books',      to: 'recommendations#books'
      get  'recommendations/authors',    to: 'recommendations#authors'
      post 'recommendations/regenerate', to: 'recommendations#regenerate'
      # get 'recommendations/events', to: 'recommendations#events'  # disabled: events hidden
      get 'recommendations/new_releases', to: 'recommendations#new_releases'
      get 'recommendations/coming_soon',  to: 'recommendations#coming_soon'
      
      # Authors
      resources :authors, only: [:index, :show, :create] do
        get 'books', on: :member
        # get 'events', on: :member  # disabled: events hidden
        get 'followers', on: :member
      end
      
      # Books
      resources :books, only: [:index, :show] do
        get 'friends', on: :member
        collection do
          get 'by_google/:google_books_id', action: :show_by_google, constraints: { google_books_id: /[^\/]+/ }
        end
      end
      
      # User Books (shelves, reading progress)
      resources :user_books, only: [:index, :create, :show, :update], path: 'user/books' do
        get 'by_book/:book_id', on: :collection, action: :show_by_book
        post 'review', on: :member
        patch 'notes', on: :member
      end
      
      # Events & Venues (disabled: events hidden)
      # resources :events, only: [:index, :show]
      # resources :venues, only: [:index, :show]
      
      # Notifications
      resources :notifications, only: [:index] do
        patch 'read', on: :member
        patch 'read_all', on: :collection
      end
      get 'notifications/unread', to: 'notifications#unread'
      
      # Reading Buddy
      resources :reading_buddy_sessions,
                path: 'reading_buddy/sessions',
                only: [:index, :create, :show, :update] do
        resources :reading_buddy_messages,
                  path: 'messages',
                  only: [:create]
        resources :reading_buddy_highlights,
                  path: 'highlights',
                  only: [:index, :create]
      end

      # Imports (Goodreads, StoryGraph, etc.)
      resources :imports, only: [:index, :show, :create] do
        collection do
          post 'goodreads', to: 'imports#create', defaults: { source: 'goodreads' }
        end
      end

      # Forums & Discussions (disabled: forums hidden)
      # resources :forums do
      #   member do
      #     post 'follow'
      #     delete 'unfollow'
      #   end
      #   resources :forum_posts, path: 'posts', only: [:index, :create]
      # end

      # resources :forum_posts, only: [:show, :update, :destroy] do
      #   member do
      #     post 'heart'
      #     delete 'unheart'
      #     post 'report'
      #   end
      #   resources :forum_replies, path: 'replies', only: [:index, :create]
      # end

      # resources :forum_replies, only: [:update, :destroy] do
      #   member do
      #     get 'thread'
      #     post 'heart'
      #     delete 'unheart'
      #     post 'report'
      #   end
      # end
    end
  end
end
