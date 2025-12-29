Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Authentication
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      post 'auth/logout', to: 'auth#logout'
      post 'auth/refresh', to: 'auth#refresh'
      get 'auth/me', to: 'auth#me'
      
      # Social Auth
      get 'auth/facebook/callback', to: 'auth#facebook'
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
      end
      
      # Follows
      resources :follows, only: [:create, :index, :destroy]
      
      # Feed
      get 'feed', to: 'feed#index'

      # Recommendations
      get 'recommendations/books', to: 'recommendations#books'
      get 'recommendations/authors', to: 'recommendations#authors'
      get 'recommendations/events', to: 'recommendations#events'
      
      # Authors
      resources :authors, only: [:index, :show, :create] do
        get 'books', on: :member
        get 'events', on: :member
        get 'followers', on: :member
      end
      
      # Books
      resources :books, only: [:index, :show] do
        get 'friends', on: :member
      end
      
      # User Books (shelves, reading progress)
      resources :user_books, only: [:index, :create, :show, :update], path: 'user/books' do
        get 'by_book/:book_id', on: :collection, action: :show_by_book
        post 'review', on: :member
      end
      
      # Events & Venues
      resources :events, only: [:index, :show]
      resources :venues, only: [:index, :show]
      
      # Notifications
      resources :notifications, only: [:index] do
        patch 'read', on: :member
        patch 'read_all', on: :collection
      end
      get 'notifications/unread', to: 'notifications#unread'
      
      # Imports (Goodreads, StoryGraph, etc.)
      resources :imports, only: [:index, :show, :create] do
        collection do
          post 'goodreads', to: 'imports#create', defaults: { source: 'goodreads' }
        end
      end

      # Forums & Discussions
      resources :forums do
        member do
          post 'follow'
          delete 'unfollow'
        end
        resources :forum_posts, path: 'posts', only: [:index, :create]
      end

      resources :forum_posts, only: [:show, :update, :destroy] do
        member do
          post 'heart'
          delete 'unheart'
          post 'report'
        end
        resources :forum_replies, path: 'replies', only: [:index, :create]
      end

      resources :forum_replies, only: [:update, :destroy] do
        member do
          get 'thread'
          post 'heart'
          delete 'unheart'
          post 'report'
        end
      end
    end
  end
end
