# Config Module Overview

## 1. What is this module?
The `config` folder contains configuration files for the backend application. Its main job is to set up external connections and settings needed before the application can run.

## 2. Why is it used?
Separating configuration logic from the main application code keeps the project organized and easy to maintain. Instead of writing database connection logic directly inside `server.js`, it is isolated in its own file. This makes changing the database settings or adding new configuration options straightforward.

## 3. Files in this module

### `db.js`
- **What it does:** Connects our backend server to the MongoDB database using Mongoose.
- **Why it is needed:** The Leave Management System needs to store user data and leave requests persistently. Without a database connection, the API cannot function.
- **What it communicates with:** It reads the `MONGO_URI` connection string from environment variables and connects directly to MongoDB. It is called by `server.js` when the server boots up.

## 4. How does the code work?
1. The server starts up in `server.js`.
2. `server.js` calls `connectDB()` from `config/db.js`.
3. `connectDB()` attempts to connect to MongoDB using the connection string stored in `process.env.MONGO_URI`.
4. If the connection succeeds, a success message is printed to the console (`MongoDB Connected: <host>`).
5. If the connection fails, the error message is logged and the process stops immediately with exit code `1` to prevent the server from running in a broken state.

## 5. Important logic
- **Graceful Failure:** If MongoDB is down or the connection string is incorrect, the server exits immediately (`process.exit(1)`). This avoids running an API that cannot serve database queries.
- **Environment Flexibility:** In local development, it connects to a local MongoDB instance (`mongodb://127.0.0.1:27017/leave_management_db`). In production, the exact same code connects to MongoDB Atlas simply by changing the `MONGO_URI` environment variable.

## 6. Connection with other modules
```text
server.js (Application Entry Point)
       ↓ calls
config/db.js
       ↓ connects to
MongoDB Database (users, leaveRequests collections)
```
