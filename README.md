# BookABench

A full-stack application built with a microservices architecture, featuring a React Native/Expo frontend and Node.js/Express backend services. The application provides real-time database synchronization via Socket.IO and supports authentication, database operations, and real-time updates.

## Architecture

This project follows a microservices architecture with the following components:

### Backend Services

1. **Auth Service** (Port 3000)

   - Handles user registration and login
   - Password hashing with bcrypt
   - Role-based access control

2. **Database Service** (Port 3001)

   - MongoDB operations (CRUD)
   - Collection management
   - Document operations with UUID v4 IDs

3. **Business Service** (Port 3002)
   - Gateway service that routes requests to Auth or Database services
   - Socket.IO server for real-time updates
   - Unified API interface

### Frontend

- **React Native/Expo** application
- Cross-platform support (iOS, Android, Web)
- Real-time updates via Socket.IO client
- TypeScript throughout

## Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- MongoDB instance (local or remote)
- Expo CLI (for frontend development)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Irimiaz/BookABench
```

### 2. Backend Setup

#### Database Service

```bash
cd Backend/database-service
npm install
```

Create `.env`:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=your_mongo_uri
DB_NAME=myapp_db
```

Start the service:

```bash
npm run dev
```

#### Auth Service

```bash
cd Backend/auth-service
npm install
```

Create `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_SERVICE_URL=http://localhost:3001
ADMINID=your_secret_teacher_id
```

Start the service:

```bash
npm run dev
```

#### Business Service

```bash
cd Backend/business-service
npm install
```

Create `.env`:

```env
PORT=3002
NODE_ENV=development
AUTH_SERVICE_URL=http://localhost:3000
DATABASE_SERVICE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:8081
```

Start the service:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd Frontend
npm install
```

Create `.env`:

```env
BACKEND_URL=http://localhost:3002
```

Start the development server:

```bash
npm run dev
# or for web
npm run web
```

## Project Structure

```
CC/
├── Backend/
│   ├── auth-service/          # Authentication service
│   ├── database-service/       # Database operations service
│   └── business-service/      # Gateway & Socket.IO service
├── Frontend/                   # React Native/Expo app
│   ├── api/                    # API client & socket client
│   ├── app/                    # App screens & navigation
│   ├── components/             # Reusable components
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   └── types/                  # TypeScript types
└── README.md
```

## API Flow

1. Frontend makes requests to **Business Service** (port 3002)
2. Business Service routes to appropriate service:
   - `service: "auth"` → Auth Service
   - `service: "database"` → Database Service
3. Services process requests and return responses
4. Database changes trigger Socket.IO events
5. Frontend receives real-time updates via Socket.IO

## Real-Time Updates

The application uses Socket.IO for real-time database change notifications:

- After login, clients subscribe to collections
- Database operations (SET_DATA, UPDATE_DATA, DELETE_DATA) trigger events
- Subscribed clients receive change notifications automatically

## Development

### Running All Services

You'll need to run all three backend services simultaneously. Consider using a process manager like `concurrently`:

### Environment Variables

Each service requires its own `.env` file. See individual service READMEs for details.

## Technologies

### Backend

- Node.js
- Express
- TypeScript
- MongoDB
- Socket.IO
- bcryptjs

### Frontend

- React Native
- Expo
- TypeScript
- Socket.IO Client
- React Navigation
- Tailwind CSS (via twrnc)
- Axios

## License

[Your License Here]
