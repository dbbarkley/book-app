# Book Social Platform API

A social platform for book lovers built with Rails API.

## Tech Stack

- Ruby 3.1+
- Rails 7.0 (API-only)
- PostgreSQL
- Redis
- Sidekiq
- JWT Authentication

## Prerequisites

### Option 1: Docker (Recommended)
- Docker
- Docker Compose

### Option 2: Local Development
- Ruby 3.1 or higher
- PostgreSQL
- Redis
- Bundler

## Setup

### Using Docker (Recommended)

1. **Build and start all services:**
   ```bash
   docker-compose up -d
   ```
   
   Or use the Makefile:
   ```bash
   make build
   make up
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   # Or
   make logs
   ```

3. **Access the API:**
   - API: `http://localhost:3000`
   - PostgreSQL: `localhost:5432`
   - Redis: `localhost:6379`

4. **Useful commands:**
   ```bash
   make shell          # Open shell in web container
   make db-setup       # Set up database
   make db-migrate     # Run migrations
   make db-seed        # Seed database
   make logs-web       # View web logs
   make logs-sidekiq   # View Sidekiq logs
   make down           # Stop all services
   ```

   See `Makefile` for all available commands.

### Local Development Setup

1. Install dependencies:
```bash
bundle install
```

2. Set up database:
```bash
rails db:create
rails db:migrate
rails db:seed  # Optional: creates sample data
```

3. Set up environment variables (optional):
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start Redis (required for Sidekiq):
```bash
redis-server
```

5. Start Sidekiq (in separate terminal):
```bash
bundle exec sidekiq
```

6. Start Rails server:
```bash
rails server
```

The API will be available at `http://localhost:3000`

> **Note:** If using Docker, the database and Redis are automatically configured. Skip steps 3-5.

## API Documentation

See `ARCHITECTURE.md` for detailed API endpoint documentation and `SERVICE_OBJECTS.md` for service object patterns.

### Quick API Reference

All endpoints are under `/api/v1/`

**Authentication:**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh JWT token

**Feed:**
- `GET /api/v1/feed` - Get user's feed (paginated)

**Follows:**
- `POST /api/v1/follows` - Follow a user/author/book
- `DELETE /api/v1/follows/:id` - Unfollow
- `GET /api/v1/follows` - List user's follows

**Authors:**
- `GET /api/v1/authors` - List all authors
- `GET /api/v1/authors/:id` - Get author details
- `GET /api/v1/authors/:id/books` - Get author's books
- `GET /api/v1/authors/:id/events` - Get author's events

**Books:**
- `GET /api/v1/books` - List books (supports `?upcoming=true`, `?author_id=:id`)
- `GET /api/v1/books/:id` - Get book details

**Events:**
- `GET /api/v1/events` - List events (supports `?upcoming=true`, `?author_id=:id`)
- `GET /api/v1/events/:id` - Get event details

**Notifications:**
- `GET /api/v1/notifications` - List all notifications
- `GET /api/v1/notifications/unread` - List unread notifications
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `PATCH /api/v1/notifications/read_all` - Mark all as read

## Authentication

The API uses JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Development

- Run tests: `rspec` (when configured)
- Run linter: `rubocop` (if configured)
- View Sidekiq UI: Mount Sidekiq::Web in routes for web UI

## Architecture

The application follows a service-oriented architecture:

- **Models**: Data validation and associations only
- **Controllers**: HTTP concerns, parameter handling, response formatting
- **Services**: Business logic and orchestration
- **Jobs**: Background processing (feed generation, notifications)

See `ARCHITECTURE.md` for complete design documentation.

