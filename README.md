# Banana Clicker - Full-Stack Real-Time Application

## 1. Project Objective

This project implements a real-time dashboard application as per the assignment requirements. It features distinct roles for Admins and Players, with functionalities centered around player management, activity monitoring, and a real-time game interaction where players click a "Banana" button to increment a score and track their rank.

The application utilizes React for the frontend, Node.js with Express for the backend, MongoDB for data storage, and Socket.io for real-time bi-directional communication.

## 2. Core Features Implemented

### Admin Functionalities:
*   **User Management (CRUD)**: Admins can create, view, edit, and delete player accounts via dedicated UI and REST API endpoints.
*   **User Blocking**: Admins can block and unblock players, preventing or allowing their login.
*   **Real-Time Activity Monitoring**:
    *   View a list of active (online) users.
    *   Monitor users' banana counts and online statuses in real-time via Socket.IO (`user_status_update` event).
    *   Observe a feed of recent player activities/score updates.
    *   View summary statistics like total online users and an estimated "clicks per minute" (derived from banana count increases).

### Player Functionalities:
*   **Authentication**: Secure registration and login using JWT.
*   **Game Interaction (Home Page)**:
    *   Clickable "Banana" element.
    *   Display of the player's own total banana count, updated in real-time via Socket.IO (`player_score_update` event).
*   **Ranking Page**:
    *   Display of a leaderboard showing player rankings.
    *   Rankings are sorted by the highest banana click count.
    *   The leaderboard updates in real-time for all players via Socket.IO (`rank_update` event).
    *   Initial ranks are fetched upon page load via a `request_initial_ranks` socket event.

### Real-Time System:
*   Socket.io is used for broadcasting:
    *   Player score updates.
    *   User status changes (online/offline, banana count updates for admin view).
    *   Overall ranking updates.

## 3. Tech Stack

*   **Frontend**:
    *   React (Vite)
    *   TypeScript
    *   Tailwind CSS
    *   Socket.io-client
    *   Axios
    *   Framer Motion (for UI animations)
    *   Lucide Icons
*   **Backend**:
    *   Node.js
    *   Express.js
    *   MongoDB (with Mongoose)
    *   Socket.io
    *   JSON Web Tokens (JWT)
    *   Validator.js
    *   Winston (Logger)
*   **Database**:
    *   MongoDB

## 4. Setup and Running the Application

### 4.1. Backend Setup

1.  Navigate to the `banana-clicker-app/backend` directory.
    ```bash
    cd banana-clicker-app/backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file by copying `backend/.env.example`. Populate the following variables:
    ```env
    PORT=3000
    MONGODB_URI=<your_mongodb_connection_string>
    JWT_SECRET=<your_jwt_secret_key>
    JWT_EXPIRES_IN=7d
    FRONTEND_URL=http://localhost:5173 # Adjust if your frontend runs on a different port
    NODE_ENV=development
    ```
4.  Start the backend server:
    ```bash
    npm run dev 
    # Or `npm start` for production builds if configured
    ```
    The server will typically run on `http://localhost:3000`.

### 4.2. Frontend Setup

1.  Navigate to the `banana-clicker-app/frontend` directory.
    ```bash
    cd banana-clicker-app/frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `frontend` directory. Populate the following variables (adjust ports if your backend runs differently):
    ```env
    VITE_API_URL=http://localhost:3000/api 
    VITE_SOCKET_URL=http://localhost:3000 
    ```
4.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The frontend will typically be available at `http://localhost:5173`.

## 5. Project Structure Overview

```
banana-clicker-app/
├── backend/
│   ├── src/
│   │   ├── config/       # DB, logger, Swagger configurations
│   │   ├── controllers/  # API request handlers
│   │   ├── middleware/   # Authentication, error handling middleware
│   │   ├── models/       # Mongoose data models (e.g., User)
│   │   └── routes/       # API route definitions (auth, users)
│   ├── app.js            # Express application and Socket.io setup
│   ├── server.js         # Main server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── contexts/     # React Context API providers (Auth, Socket, Notification)
│   │   ├── hooks/        # Custom React hooks (useAuth, useSocket, etc.)
│   │   ├── layouts/      # Page layout components (AppLayout, AdminLayout)
│   │   ├── pages/        # Top-level page components
│   │   ├── services/     # API interaction services (apiClient, authService, userService)
│   │   ├── App.tsx       # Root application component with React Router setup
│   │   ├── main.tsx      # Application entry point
│   │   └── index.css     # Global styles and Tailwind CSS directives
│   └── package.json
└── README.md             # This file
```

## 6. Key Technical Decisions & Notes
*   **Authentication**: JWTs are used for stateless authentication. Tokens are stored in client-side `localStorage`.
*   **Real-Time Communication**: Socket.io handles bi-directional updates for player scores, rankings, and admin monitoring of user statuses. Key events include `player_score_update`, `rank_update`, and `user_status_update`.
*   **API Design**: RESTful principles are followed for backend API endpoints for user management and authentication.
*   **State Management (Frontend)**: React Context API is used for managing global state related to authentication, socket connection, and notifications. Component-level state is managed with `useState` and `useReducer` where appropriate.
*   **Error Handling**:
    *   Backend: Centralized error handling middleware.
    *   Frontend: Axios interceptors for global API error handling, with specific error notifications displayed to the user.
*   **Styling**: Tailwind CSS is used for utility-first styling.
