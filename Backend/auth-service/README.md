# Auth Service

A Node.js Express API with TypeScript for handling authentication and custom requests.

## Structure

```
src/
├── handlers/          # Business logic handlers (one per API action)
├── middleware/        # Express middleware (error handling, logging, async)
├── routes/            # Route definitions
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
PORT=3000
NODE_ENV=development
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

Example `.env`:

```env
PORT=3000
NODE_ENV=development
```

### Additional Environment Variables

Any other environment variables (database credentials, API keys, secrets, etc.) should be accessed from your external configuration service or secrets management system. Do not store sensitive data in the `.env` file. Access these variables through your configuration management solution.

## API Endpoint

All requests go through a single endpoint:

**POST** `/auth`

### Request Format

```json
{
  "api": "TEST",
  "data": {
    "message": "Your data here"
  }
}
```

### Response Format

**Success:**

```json
{
  "success": true,
  "message": "Success",
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

### Example Request

```bash
curl -X POST http://localhost:3000/auth \
  -H "Content-Type: application/json" \
  -d '{"api":"TEST","data":{"message":"Hello!"}}'
```

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
2. The `api` field determines which handler to execute
3. Handlers are located in `src/handlers/`
4. Each handler is async and returns `{ success: boolean, data?: any, message?: string }`
5. The system handles multiple concurrent requests asynchronously

## Adding New Handlers

1. Create a new file in `src/handlers/` (e.g., `login.ts`)
2. Export a handler function that matches the `HandlerFunction` type
3. Add a case in `src/routes/authLogic.ts` switch statement

Example handler:

```typescript
import type { HandlerFunction } from "../types/request.d.js";

type LoginData = {
  email: string;
  password: string;
};

export const login: HandlerFunction = async (data: LoginData) => {
  // Your logic here
  return {
    success: true,
    data: { token: "abc123" },
  };
};
```

Then add to `authLogic.ts`:

```typescript
case "LOGIN":
  result = await login(body.data);
  break;
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run production server (requires build first)
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without building
