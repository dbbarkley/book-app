# Book Social Platform - Monorepo

A social platform for book lovers built as a monorepo with Rails API backend and Next.js frontend.

## Structure

```
book-app/
├── backend/          # Rails API (Ruby on Rails)
├── frontend/         # Next.js 14+ (App Router, TypeScript)
├── shared/           # Shared TypeScript code (API client, types, hooks, utils)
└── packages/         # Optional future shared libraries
```

## Tech Stack

### Backend
- Ruby 3.1+
- Rails 7.0 (API-only)
- PostgreSQL
- Redis
- Sidekiq
- JWT Authentication

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React 18+

### Shared
- TypeScript types
- API client
- React hooks
- Utility functions

## Quick Start

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- **Backend API**: `http://localhost:3000`
- **Frontend**: `http://localhost:3001`
- **PostgreSQL**: `localhost:5433`
- **Redis**: `localhost:6380`

### Local Development

#### Backend

```bash
cd backend
bundle install
rails db:create db:migrate db:seed
rails server
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Shared

```bash
cd shared
npm install
npm run type-check
```

## Development

### Backend Development

See `backend/README.md` for detailed backend documentation.

### Frontend Development

See `frontend/README.md` for detailed frontend documentation.

### Shared Code

The `shared/` directory contains:
- **API Client**: Reusable client for backend communication
- **TypeScript Types**: Type definitions matching backend models
- **React Hooks**: Custom hooks for API interactions
- **Utils**: Shared utility functions

These can be used in both Next.js and React Native applications.

## Docker Commands

```bash
# Start all services
docker-compose up -d

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs -f [service_name]

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Execute commands in containers
docker-compose exec backend rails console
docker-compose exec frontend npm run build
```

## API Documentation

See `backend/ARCHITECTURE.md` for complete API endpoint documentation.

## Project Structure Details

### `/backend`
Rails API application with:
- Models, controllers, services, jobs
- Database migrations
- API endpoints under `/api/v1/`

### `/frontend`
Next.js application with:
- App Router structure
- TypeScript configuration
- Tailwind CSS
- Integration with shared API client

### `/shared`
Shared TypeScript code:
- `api/client.ts` - API client class
- `types/` - TypeScript type definitions
- `hooks/` - React hooks for API interactions
- `utils/` - Utility functions

### `/packages`
Future location for shared libraries (e.g., design system components)

## Environment Variables

Create `.env` files in respective directories:

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/book_app_development
REDIS_URL=redis://redis:6379/0
SECRET_KEY_BASE=your_secret_key
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Contributing

1. Backend changes: Work in `/backend`
2. Frontend changes: Work in `/frontend`
3. Shared code: Work in `/shared` (affects both frontend and future React Native app)

## License

Private project

