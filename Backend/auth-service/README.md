# Auth Service

A Node.js Express API with TypeScript for handling user authentication and authorization with role-based access control.

## Structure

```
src/
├── handlers/          # Business logic handlers (register, login)
├── middleware/        # Express middleware (error handling, logging, async)
├── routes/            # Route definitions
├── services/          # External service clients (database service)
├── types/             # TypeScript type definitions
├── utils/             # Utility functions (password hashing, response helpers, errors)
├── index.ts           # Entry point
└── server.ts          # Express app configuration
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
DATABASE_SERVICE_URL=http://localhost:3001
ADMIN_TEACHER_ID=your_secret_teacher_id
```

3. Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode: `development` or `production` (default: development)
- `DATABASE_SERVICE_URL` - URL of the database service (required)
- `ADMINID` - Secret teacher ID for admin registration (optional, can be set in environment)

**Development `.env`:**

```env
PORT=3000
NODE_ENV=development
DATABASE_SERVICE_URL=http://localhost:3001
ADMINID=your_secret_teacher_id
```

**Production `.env` (Portainer):**

```env
PORT=3000
NODE_ENV=production
DATABASE_SERVICE_URL=http://database-service:3001
ADMINID=your_secret_teacher_id
```

**Note for Portainer Deployment:**

- Use Docker service names (e.g., `database-service`) for internal service URLs
- Ensure all services are on the same Docker network
- The server binds to `0.0.0.0` to accept connections from outside the container

## API Endpoint

All requests go through a single endpoint:

**POST** `/auth`

### Request Format

```json
{
  "api": "REGISTER",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "universityYear": 2,
    "phone": "+1234567890",
    "universityName": "Tech University",
    "teacherID": "your_secret_teacher_id"
  }
}
```

### Response Format

**Success:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "universityYear": 2,
      "phone": "+1234567890",
      "universityName": "Tech University",
      "role": "admin"
    }
  }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error message"
}
```

## Available APIs

### REGISTER

Register a new user. Users can register as normal users or admins by providing a special `teacherID`.

**Request:**

```json
{
  "api": "REGISTER",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "universityYear": 2,
    "phone": "+1234567890",
    "universityName": "Tech University",
    "teacherID": "your_secret_teacher_id"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "universityYear": 2,
      "phone": "+1234567890",
      "universityName": "Tech University",
      "role": "admin"
    }
  }
}
```

**Note:** If `teacherID` matches the configured admin teacher ID, the user will be registered with `role: "admin"`. Otherwise, they will be registered with `role: "normal"`.

### LOGIN

Authenticate a user and return their information including role.

**Request:**

```json
{
  "api": "LOGIN",
  "data": {
    "email": "john@example.com",
    "password": "securepass123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "universityYear": 2,
      "phone": "+1234567890",
      "universityName": "Tech University",
      "role": "admin"
    }
  }
}
```

## Example Requests

### Register as Normal User

```bash
curl -X POST http://localhost:3000/auth -H "Content-Type: application/json" -d '{"api":"REGISTER","data":{"name":"John Doe","email":"john.doe@university.edu","password":"securepass123","universityYear":2,"phone":"+1234567890","universityName":"Tech University"}}'
```

### Register as Admin

```bash
curl -X POST http://localhost:3000/auth -H "Content-Type: application/json" -d '{"api":"REGISTER","data":{"name":"Admin User","email":"admin@university.edu","password":"adminpass123","universityYear":1,"phone":"+9876543210","universityName":"Tech University","teacherID":"your_secret_teacher_id"}}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth -H "Content-Type: application/json" -d '{"api":"LOGIN","data":{"email":"john.doe@university.edu","password":"securepass123"}}'
```

## User Roles

The service supports two user roles:

- **normal**: Default role for regular users
- **admin**: Admin role assigned when registering with a valid `teacherID`

The role is stored in the database and returned in both registration and login responses.

## Development

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run typecheck # Type check without building
```

## How It Works

1. All requests go to `POST /auth`
2. The `api` field determines which handler to execute (REGISTER or LOGIN)
3. Handlers are located in `src/handlers/`
4. Each handler validates input, interacts with the database service, and returns user data
5. Passwords are hashed using bcrypt before storage
6. The system handles multiple concurrent requests asynchronously

## Dependencies

- **express**: Web framework
- **bcryptjs**: Password hashing
- **dotenv**: Environment variable management

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run production server (requires build first)
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without building
