# Frontend - BookABench / Itinerary Planner

React Native/Expo application built with TypeScript, featuring real-time updates via Socket.IO and a unified API interface.

## Overview

This is a cross-platform mobile and web application built with Expo and React Native. It communicates with backend microservices through a unified API and receives real-time updates via Socket.IO.

## Features

- 🔐 User authentication (login/register)
- 📊 Real-time database synchronization
- 🔄 Socket.IO integration for live updates
- 📱 Cross-platform (iOS, Android, Web)
- 🎨 Modern UI with Tailwind CSS
- 📝 TypeScript for type safety

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Backend services running (see root README)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `Frontend` directory:

```env
BACKEND_URL=http://localhost:3002
```

The `BACKEND_URL` should point to your Business Service (gateway service).

### 3. Start Development Server

```bash
# Start Expo development server
npm start

# Or start for specific platform
npm run web      # Web browser
npm run ios      # iOS simulator
npm run android  # Android emulator
```

## Project Structure

```
Frontend/
├── api/
│   ├── client.ts              # HTTP API client (Axios)
│   ├── socketClient.ts        # Socket.IO client
│   └── requestBuilder.ts      # Request builder utilities
├── app/
│   ├── dashboard/             # Dashboard screens
│   │   ├── Dashboard.tsx     # Login/Register screen
│   │   └── Products.tsx      # Products management
│   ├── navigation/           # Navigation configuration
│   └── index.tsx             # App entry point
├── components/               # Reusable UI components
│   ├── BaseScreen.tsx        # Base screen wrapper
│   ├── Header.tsx            # Navigation header
│   └── ...
├── hooks/                    # Custom React hooks
│   ├── useStackNavigation.ts # Navigation hook
│   └── ...
├── utils/                    # Utility functions
│   ├── apiHelpers.ts         # API helper functions
│   ├── socketHelpers.ts     # Socket.IO helpers
│   └── ...
├── types/                    # TypeScript type definitions
├── app.config.js            # Expo configuration
├── package.json
└── tsconfig.json
```

## Key Features

### Authentication

The app supports user registration and login through the Dashboard screen:

```typescript
import { login, register } from "../utils/apiHelpers";

// Login
const response = await login({ email, password });

// Register
const response = await register({
  name,
  email,
  password,
  universityYear,
  phone,
  universityName,
});
```

### Real-Time Updates

Socket.IO integration for real-time database change notifications:

```typescript
import { setupSocketConnection } from "../utils/socketHelpers";

// Setup socket connection and subscribe to collections
setupSocketConnection(
  userId,
  ["products", "users"], // Collections to subscribe to
  (message) => {
    // Handle database change events
    console.log("Database change:", message);
  }
);
```

### API Usage

All API calls go through the unified API client:

```typescript
import { getData, setData, modifyData, deleteData } from "../utils/apiHelpers";

// Get data
const products = await getData("products", { query: {} });

// Create data
await setData("products", { name: "Product", price: 99.99 });

// Update data
await modifyData("products", { _id: "id" }, { price: 89.99 });

// Delete data
await deleteData("products", { _id: "id" });
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run web` - Start for web browser
- `npm run ios` - Start for iOS simulator
- `npm run android` - Start for Android emulator
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Environment Variables

| Variable      | Description                           | Required |
| ------------- | ------------------------------------- | -------- |
| `BACKEND_URL` | URL of the Business Service (gateway) | Yes      |

## Socket.IO Subscription

After logging in, you can:

1. **Subscribe to specific collections:**

   ```typescript
   setupSocketConnection(userId, ["products", "users"], onChange);
   ```

2. **Subscribe to all collections:**

   ```typescript
   setupSocketConnection(userId, [], onChange); // Empty array = all
   ```

3. **Update subscription later:**
   ```typescript
   import { updateSubscription } from "../utils/socketHelpers";
   updateSubscription(["products", "users", "orders"]);
   ```

## Database Change Events

When subscribed, you'll receive events with this structure:

```typescript
{
  type: "database_change",
  timestamp: "2026-01-03T15:48:16.770Z",
  operation: "SET_DATA" | "UPDATE_DATA" | "DELETE_DATA",
  collection: "products",
  documentId: "uuid-here",
  data: { ... } // The document (if available)
}
```

## Dependencies

### Core

- `expo` - Expo framework
- `react` & `react-native` - React and React Native
- `expo-router` - File-based routing
- `@react-navigation/native` - Navigation library

### API & Real-Time

- `axios` - HTTP client
- `socket.io-client` - Socket.IO client

### UI & Styling

- `twrnc` - Tailwind CSS for React Native
- `@expo/vector-icons` - Icon library

### Utilities

- `dayjs` - Date manipulation
- `bson` - BSON utilities
- `pdf-lib` - PDF generation

## Development Tips

1. **Hot Reload**: Expo automatically reloads on file changes
2. **Clear Cache**: If you encounter issues, try `npx expo start --clear`
3. **Environment Variables**: Make sure `.env` is in the `Frontend` directory
4. **Backend Connection**: Ensure all backend services are running before starting the app

## Troubleshooting

### Backend URL not found

- Ensure `.env` file exists with `BACKEND_URL`
- Restart Expo server after creating/modifying `.env`
- Clear cache: `npx expo start --clear`

### Socket connection issues

- Verify Business Service is running on the correct port
- Check CORS configuration in Business Service
- Ensure Socket.IO server is initialized

### Build issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Expo cache: `npx expo start --clear`

## License

[Your License Here]
