# Business Service

A Node.js Express API with TypeScript that acts as a gateway service, routing requests to either the Auth Service or Database Service. Provides a unified interface for authentication and database operations.

## Structure

```
src/
├── handlers/          # Business logic handlers
├── middleware/        # Express middleware (error handling, logging, async)
├── routes/            # Route definitions
├── services/          # Service clients (authService, databaseService)
├── types/             # TypeScript type definitions
├── utils/             # Utility functions (response helpers, errors)
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
PORT=3002
NODE_ENV=development
AUTH_SERVICE_URL=http://localhost:3000
DATABASE_SERVICE_URL=http://localhost:3001
```

3. Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:3002` (or the port specified in `.env`).

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode: `development` or `production` (default: development)
- `AUTH_SERVICE_URL` - URL of the auth service (required)
- `DATABASE_SERVICE_URL` - URL of the database service (required)
- `SOCKET_CORS_ORIGINS` - Comma-separated list of allowed origins for Socket.IO (optional, defaults to `*` in development)

## API Endpoint

All requests go through a single endpoint:

**POST** `/business`

### Request Format

```json
{
  "api": "API_NAME",
  "service": "auth" | "database",
  "data": { ... }
}
```

### Response Format

**Success:**

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error message"
}
```

## Authentication Service Examples

### Register

Register a new user.

**Request:**

```bash
curl -X POST http://localhost:3002/business \
  -H "Content-Type: application/json" \
  -d '{
    "api": "REGISTER",
    "service": "auth",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "password123",
      "universityYear": 2,
      "phone": "1234567890",
      "universityName": "Example University"
    }
  }'
```

**With optional teacherID (for admin role):**

```bash
curl -X POST http://localhost:3002/business \
  -H "Content-Type: application/json" \
  -d '{
    "api": "REGISTER",
    "service": "auth",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "password123",
      "universityYear": 2,
      "phone": "1234567890",
      "universityName": "Example University",
      "teacherID": "your-teacher-id"
    }
  }'
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
      "phone": "1234567890",
      "universityName": "Example University",
      "role": "normal"
    }
  }
}
```

### Login

Login with email and password.

**Request:**

```bash
curl -X POST http://localhost:3002/business \
  -H "Content-Type: application/json" \
  -d '{
    "api": "LOGIN",
    "service": "auth",
    "data": {
      "email": "john@example.com",
      "password": "password123"
    }
  }'
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
      "phone": "1234567890",
      "universityName": "Example University",
      "role": "normal"
    }
  }
}
```

## Database Service Examples

### GET_DATA

Retrieve documents from a collection.

**Request:**

```bash
curl -X POST http://localhost:3002/business \
  -H "Content-Type: application/json" \
  -d '{
    "api": "GET_DATA",
    "service": "database",
    "data": {
      "collection": "users",
      "params": {
        "query": {
          "email": "john@example.com"
        }
      }
    }
  }'
```

**Get all documents (empty query):**

```bash
curl -X POST http://localhost:3002/business \
  -H "Content-Type: application/json" \
  -d '{
    "api": "GET_DATA",
    "service": "database",
    "data": {
      "collection": "users",
      "params": {
        "query": {}
      }
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Retrieved 1 document(s) from users",
  "data": [
    {
      "_id": "document-id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

### SET_DATA

Insert a new document or update an existing one.

**Insert new document:**

```bash
curl -X POST http://localhost:3002/business \
  -H "Content-Type: application/json" \
  -d '{
    "api": "SET_DATA",
    "service": "database",
    "data": {
      "collection": "products",
      "params": {
        "query": {
          "name": "Product Name",
          "price": 99.99,
          "category": "electronics"
        }
      }
    }
  }'
```

**Update existing document (if query matches):**

```bash
curl -X POST http://localhost:3002/business \
  -H "Content-Type: application/json" \
  -d '{
    "api": "SET_DATA",
    "service": "database",
    "data": {
      "collection": "products",
      "params": {
        "query": {
          "_id": "product-id"
        },
        "update": {
          "price": 89.99
        }
      }
    }
  }'
```

**Response (Insert):**

```json
{
  "success": true,
  "message": "Document inserted successfully",
  "data": {
    "insertedId": "generated-uuid",
    "document": {
      "_id": "generated-uuid",
      "name": "Product Name",
      "price": 99.99,
      "category": "electronics"
    }
  }
}
```

**Response (Update):**

```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "matchedCount": 1,
    "modifiedCount": 1
  }
}
```

### UPDATE_DATA

Update an existing document.

**Request:**

```bash
curl -X POST http://localhost:3002/business \
  -H "Content-Type: application/json" \
  -d '{
    "api": "UPDATE_DATA",
    "service": "database",
    "data": {
      "collection": "users",
      "params": {
        "query": {
          "_id": "user-id"
        },
        "update": {
          "name": "Updated Name",
          "universityYear": 3
        }
      }
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "matchedCount": 1,
    "modifiedCount": 1
  }
}
```

### DELETE_DATA

Delete a document from a collection.

**Request:**

```bash
curl -X POST http://localhost:3002/business \
  -H "Content-Type: application/json" \
  -d '{
    "api": "DELETE_DATA",
    "service": "database",
    "data": {
      "collection": "users",
      "params": {
        "query": {
          "_id": "user-id"
        }
      }
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Deleted 1 document(s) successfully",
  "data": {
    "deletedCount": 1
  }
}
```

## Error Examples

### Missing Required Field

```json
{
  "success": false,
  "message": "Missing 'api' field in request"
}
```

### Invalid Service

```json
{
  "success": false,
  "message": "Service field in request must be 'auth' or 'database'"
}
```

### Authentication Error

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Validation Error

```json
{
  "success": false,
  "message": "All fields are required"
}
```

### Not Found Error

```json
{
  "success": false,
  "message": "No matching record found to delete"
}
```

## One-Liner Examples

### Register

```bash
curl -X POST http://localhost:3002/business -H "Content-Type: application/json" -d "{\"api\":\"REGISTER\",\"service\":\"auth\",\"data\":{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\",\"universityYear\":2,\"phone\":\"1234567890\",\"universityName\":\"Example University\"}}"
```

### Login

```bash
curl -X POST http://localhost:3002/business -H "Content-Type: application/json" -d "{\"api\":\"LOGIN\",\"service\":\"auth\",\"data\":{\"email\":\"john@example.com\",\"password\":\"password123\"}}"
```

### Get Data

```bash
curl -X POST http://localhost:3002/business -H "Content-Type: application/json" -d "{\"api\":\"GET_DATA\",\"service\":\"database\",\"data\":{\"collection\":\"users\",\"params\":{\"query\":{\"email\":\"john@example.com\"}}}}"
```

### Set Data

```bash
curl -X POST http://localhost:3002/business -H "Content-Type: application/json" -d "{\"api\":\"SET_DATA\",\"service\":\"database\",\"data\":{\"collection\":\"products\",\"params\":{\"query\":{\"name\":\"Product Name\",\"price\":99.99}}}}"
```

### Update Data

```bash
curl -X POST http://localhost:3002/business -H "Content-Type: application/json" -d "{\"api\":\"UPDATE_DATA\",\"service\":\"database\",\"data\":{\"collection\":\"users\",\"params\":{\"query\":{\"_id\":\"user-id\"},\"update\":{\"name\":\"Updated Name\"}}}}"
```

### Delete Data

```bash
curl -X POST http://localhost:3002/business -H "Content-Type: application/json" -d "{\"api\":\"DELETE_DATA\",\"service\":\"database\",\"data\":{\"collection\":\"users\",\"params\":{\"query\":{\"_id\":\"user-id\"}}}}"
```

## Socket.IO Real-Time Updates

The business service includes Socket.IO for real-time database change notifications. After a user logs in, they can connect to the socket and subscribe to database changes.

### Client Connection (React Native/Web)

```javascript
import { io } from "socket.io-client";

// Connect to business service
const socket = io("http://your-server:3002", {
  transports: ["websocket"],
});

// After login, subscribe to collections
socket.on("connect", () => {
  socket.emit("subscribe", {
    userId: "user-id-from-login",
    collections: ["users", "messages"], // or [] for all collections
  });
});

// Listen for database changes
socket.on("database_change", (message) => {
  // message structure:
  // {
  //   type: "database_change",
  //   timestamp: "2024-01-01T00:00:00.000Z",
  //   operation: "SET_DATA" | "UPDATE_DATA" | "DELETE_DATA",
  //   collection: "users",
  //   documentId: "document-id",
  //   data: { ... } // the document
  // }
});
```

### Socket Events

**Client → Server:**

- `subscribe` - Subscribe to database changes
  ```javascript
  socket.emit("subscribe", {
    userId: "user-id",
    collections: ["users"], // or [] for all
  });
  ```
- `update_subscription` - Update subscription preferences
  ```javascript
  socket.emit("update_subscription", {
    collections: ["users", "messages"],
    filters: { users: { role: "admin" } },
  });
  ```

**Server → Client:**

- `subscribed` - Confirmation of subscription
- `subscription_updated` - Confirmation of subscription update
- `database_change` - Real-time database change notification

### Automatic Notifications

Database changes from `SET_DATA`, `UPDATE_DATA`, and `DELETE_DATA` operations are automatically broadcast to subscribed clients. No additional configuration needed.

## Available APIs

### Auth Service

- `REGISTER` - Register a new user
- `LOGIN` - Login with email and password

### Database Service

- `GET_DATA` - Retrieve documents from a collection
- `SET_DATA` - Insert a new document or update if query matches
- `UPDATE_DATA` - Update an existing document
- `DELETE_DATA` - Delete a document from a collection
