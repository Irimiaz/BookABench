# Database Service

A Node.js Express API with TypeScript for handling MongoDB database operations. Provides a unified interface for CRUD operations across different collections.

## Structure

```
src/
├── handlers/          # Business logic handlers (getData, setData, updateData, deleteData)
├── middleware/        # Express middleware (error handling, logging, async)
├── routes/            # Route definitions
├── services/          # Database connection and operations (MongoDB)
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
PORT=3001
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
DB_NAME=your_database_name
```

3. Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode: `development` or `production` (default: development)
- `MONGODB_URI` - MongoDB connection string (required)
- `DB_NAME` - Database name (required)

Example `.env`:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017
DB_NAME=myapp_db
```

## API Endpoint

All requests go through a single endpoint:

**POST** `/database`

### Request Format

```json
{
  "api": "GET_DATA",
  "data": {
    "collection": "users",
    "params": {
      "query": { "email": "john@example.com" }
    }
  }
}
```

### Response Format

**Success:**

```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ]
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

### GET_DATA

Retrieve documents from a collection based on a query.

**Request:**

```json
{
  "api": "GET_DATA",
  "data": {
    "collection": "users",
    "params": {
      "query": { "email": "john@example.com" },
      "limit": 10,
      "sort": { "createdAt": -1 }
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      ...
    }
  ]
}
```

### SET_DATA

Insert a new document into a collection. The `_id` field is automatically generated as a UUID v4 string if not provided.

**Request:**

```json
{
  "api": "SET_DATA",
  "data": {
    "collection": "users",
    "params": {
      "query": {
        "name": "John Doe",
        "email": "john@example.com",
        "passwordHash": "..."
      }
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "insertedId": "generated-uuid-v4",
    "document": {
      "_id": "generated-uuid-v4",
      "name": "John Doe",
      "email": "john@example.com",
      ...
    }
  }
}
```

### UPDATE_DATA

Update documents in a collection based on a query.

**Request:**

```json
{
  "api": "UPDATE_DATA",
  "data": {
    "collection": "users",
    "params": {
      "query": { "_id": "user-id" },
      "update": {
        "name": "Jane Doe",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  }
}
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

Delete documents from a collection based on a query.

**Request:**

```json
{
  "api": "DELETE_DATA",
  "data": {
    "collection": "users",
    "params": {
      "query": { "_id": "user-id" }
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "deletedCount": 1
  }
}
```

## Example Requests

### Get All Users

```bash
curl -X POST http://localhost:3001/database -H "Content-Type: application/json" -d '{"api":"GET_DATA","data":{"collection":"users","params":{"query":{}}}}'
```

### Get User by Email

```bash
curl -X POST http://localhost:3001/database -H "Content-Type: application/json" -d '{"api":"GET_DATA","data":{"collection":"users","params":{"query":{"email":"john@example.com"}}}}'
```

### Create User

```bash
curl -X POST http://localhost:3001/database -H "Content-Type: application/json" -d '{"api":"SET_DATA","data":{"collection":"users","params":{"query":{"name":"John Doe","email":"john@example.com","passwordHash":"hashed_password"}}}}'
```

### Update User

```bash
curl -X POST http://localhost:3001/database -H "Content-Type: application/json" -d '{"api":"UPDATE_DATA","data":{"collection":"users","params":{"query":{"_id":"user-id"},"update":{"name":"Jane Doe"}}}}'
```

### Delete User

```bash
curl -X POST http://localhost:3001/database -H "Content-Type: application/json" -d '{"api":"DELETE_DATA","data":{"collection":"users","params":{"query":{"_id":"user-id"}}}}'
```

## Features

- **Automatic UUID Generation**: Documents automatically get a UUID v4 string `_id` if not provided
- **Collection-Based**: All operations require specifying a collection name
- **Flexible Queries**: Supports MongoDB query syntax for filtering, sorting, and limiting
- **Type Safety**: Full TypeScript support with type definitions

## Development

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run typecheck # Type check without building
```

## How It Works

1. All requests go to `POST /database`
2. The `api` field determines which handler to execute (GET_DATA, SET_DATA, UPDATE_DATA, DELETE_DATA)
3. Handlers are located in `src/handlers/`
4. Each handler validates input, performs MongoDB operations, and returns results
5. The `_id` field is automatically generated as UUID v4 for new documents
6. The system handles multiple concurrent requests asynchronously

## Dependencies

- **express**: Web framework
- **mongodb**: MongoDB driver
- **uuid**: UUID generation for document IDs
- **dotenv**: Environment variable management

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run production server (requires build first)
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without building
