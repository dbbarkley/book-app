Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Authentication
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      post 'auth/logout', to: 'auth#logout'
      post 'auth/refresh', to: 'auth#refresh'
      get 'auth/me', to: 'auth#me'
      
      # Users
      # Preferences routes must come BEFORE resources to avoid route conflicts
      get 'users/preferences', to: 'users#preferences'
      post 'users/preferences', to: 'users#update_preferences'
      get 'users/search', to: 'users#search'
      
      resources :users, only: [:show, :update] do
        get 'profile', on: :member
        get 'following', on: :member
        get 'followers', on: :member
      end
      
      # Follows
      resources :follows, only: [:create, :index, :destroy]
      
      # Feed
      get 'feed', to: 'feed#index'
      
      # Authors
      resources :authors, only: [:index, :show, :create] do
        get 'books', on: :member
        get 'events', on: :member
        get 'followers', on: :member
      end
      
      # Books
      resources :books, only: [:index, :show]
      
      # User Books (shelves, reading progress)
      resources :user_books, only: [:index, :create, :show, :update], path: 'user/books' do
        post 'review', on: :member
      end
      
      # Events
      resources :events, only: [:index, :show]
      
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
    end
  end
end
