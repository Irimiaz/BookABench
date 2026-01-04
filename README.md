# BookABench

A full-stack bench reservation system built with a microservices architecture, featuring a React Native/Expo frontend and Node.js/Express backend services. The application enables students to browse, reserve, and manage bench bookings in real-time, with admin capabilities for bench management and reservation oversight.

## Features

- 🔐 **User Authentication** - Secure registration and login with role-based access control (Student/Admin)
- 📍 **Bench Management** - View, create, edit, and delete benches with location, capacity, and availability information
- 📅 **Reservation System** - Book benches with date and time slots, view availability, and manage reservations
- 💬 **Messaging** - Real-time messaging system for communication between users
- 🔄 **Real-Time Updates** - Live synchronization of data changes across all connected clients via Socket.IO
- 👥 **Admin Dashboard** - Administrative interface for managing benches and monitoring reservations
- 📱 **Cross-Platform** - Native iOS, Android, and Web support via React Native/Expo
- 🎨 **Modern UI** - Beautiful, responsive interface built with Tailwind CSS

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

```bash
# Install concurrently globally
npm install -g concurrently

# Run all services from project root
concurrently \
  "cd Backend/auth-service && npm run dev" \
  "cd Backend/database-service && npm run dev" \
  "cd Backend/business-service && npm run dev"
```

### Environment Variables

Each service requires its own `.env` file. See individual service READMEs for details.

### API Endpoints

#### Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email and password

#### Database Endpoints (via Business Service)

- `POST /database/get-data` - Query documents from a collection
- `POST /database/set-data` - Create new documents
- `POST /database/update-data` - Update existing documents
- `POST /database/delete-data` - Delete documents

All database requests should include:

```json
{
  "service": "database",
  "collection": "collection_name",
  "data": { ... }
}
```

### Socket.IO Events

- `subscribe` - Subscribe to collection changes
- `database-change` - Receive notifications when data changes
- `unsubscribe` - Unsubscribe from collection changes

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

## Deployment

### Docker Deployment

Each service includes a Dockerfile for containerized deployment:

```bash
# Build images
docker build -t bookabench-auth:latest ./Backend/auth-service
docker build -t bookabench-database:latest ./Backend/database-service
docker build -t bookabench-business:latest ./Backend/business-service

# Run containers
docker run -p 3000:3000 bookabench-auth:latest
docker run -p 3001:3001 bookabench-database:latest
docker run -p 3002:3002 bookabench-business:latest
```

### Kubernetes Deployment (Helm)

The project includes Helm charts for Kubernetes deployment. See the [Helm README](./helm/README.md) for detailed instructions.

Quick start with kind:

```bash
# Create kind cluster
kind create cluster --name bookabench --config helm/kind-nodeports.yaml

# Build and load images
docker build -t bookabench-auth:dev ./Backend/auth-service
docker build -t bookabench-business:dev ./Backend/business-service
docker build -t bookabench-database:dev ./Backend/database-service

kind load docker-image bookabench-auth:dev --name bookabench
kind load docker-image bookabench-business:dev --name bookabench
kind load docker-image bookabench-database:dev --name bookabench

# Deploy with Helm
helm upgrade --install bookabench ./helm/bookabench -n bookabench --create-namespace
```

## Troubleshooting

### Common Issues

**Port Already in Use**

- Ensure no other services are running on ports 3000, 3001, or 3002
- Use `lsof -i :PORT` (Mac/Linux) or `netstat -ano | findstr :PORT` (Windows) to find processes

**MongoDB Connection Issues**

- Verify MongoDB is running and accessible
- Check `MONGODB_URI` in database-service `.env` file
- Ensure network connectivity to MongoDB instance

**Socket.IO Connection Failed**

- Verify Business Service is running on port 3002
- Check CORS settings in business-service
- Ensure `FRONTEND_URL` matches your frontend URL

**Frontend Cannot Connect to Backend**

- Verify `BACKEND_URL` in Frontend `.env` points to Business Service (port 3002)
- Check that all backend services are running
- Verify network connectivity and firewall settings

### Logs

Check service logs for debugging:

```bash
# Backend services
cd Backend/auth-service && npm run dev
cd Backend/database-service && npm run dev
cd Backend/business-service && npm run dev

# Frontend
cd Frontend && npm start
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint configuration provided in each service
- Maintain consistent code formatting
- Write meaningful commit messages

## Testing

### Backend Services

Each service includes health check endpoints:

- `GET /health` - Service health status

Test endpoints:

```bash
# Auth Service
curl http://localhost:3000/health

# Database Service
curl http://localhost:3001/health

# Business Service
curl http://localhost:3002/health
```

## Security Considerations

- Passwords are hashed using bcrypt
- Environment variables should never be committed to version control
- Use strong `ADMINID` values in production
- Implement rate limiting for production deployments
- Use HTTPS in production environments
- Regularly update dependencies for security patches

## Performance

- Real-time updates are optimized with Socket.IO room subscriptions
- Database queries use MongoDB indexes for efficient lookups
- Frontend implements optimistic UI updates for better UX
- Services are stateless and can be horizontally scaled

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev/) for cross-platform development
- Uses [Socket.IO](https://socket.io/) for real-time communication
- Powered by [MongoDB](https://www.mongodb.com/) for data storage
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)

## Support

For issues, questions, or contributions, please open an issue on the [GitHub repository](https://github.com/Irimiaz/BookABench).
