# API Reference

This document provides detailed information about the API endpoints used in StudySphere.

## Authentication

- **POST /auth/signup**
  - Create a new user account.
  - Request body: `{ email, password }`
  - Response: User object and JWT token.

- **POST /auth/login**
  - Authenticate user and return JWT token.
  - Request body: `{ email, password }`
  - Response: User object and JWT token.

- **POST /auth/logout**
  - Invalidate user session.

## Chat Rooms

- **GET /chat/rooms**
  - List all chat rooms.

- **POST /chat/rooms**
  - Create a new chat room.
  - Request body: `{ name, description }`

- **GET /chat/rooms/:id**
  - Get details of a specific chat room.

- **POST /chat/rooms/:id/join**
  - Join a chat room.

- **POST /chat/rooms/:id/leave**
  - Leave a chat room.

## Messages

- **GET /chat/rooms/:id/messages**
  - Get messages in a chat room.

- **POST /chat/rooms/:id/messages**
  - Send a message to a chat room.
  - Request body: `{ content, message_type, file_url? }`

## Study Sessions

- **GET /study-sessions**
  - List all active study sessions.

- **POST /study-sessions**
  - Create a new study session.
  - Request body: `{ title, subject, scheduled_for, max_participants }`

- **POST /study-sessions/:id/join**
  - Join a study session.

## Resources

- **GET /resources**
  - List all shared resources.

- **POST /resources**
  - Upload a new resource.
  - Request body: `{ title, subject, file_url, description? }`

## Files

- **GET /files/personal**
  - List personal files of the authenticated user.

- **POST /files/personal**
  - Upload a personal file.

- **POST /files/share**
  - Share a file with a chat room or AI session.

## Notifications

- **GET /notifications**
  - List notifications for the authenticated user.

- **POST /notifications/mark-read**
  - Mark notifications as read.

## AI Assistant

- **POST /ai/query**
  - Send a query to the AI assistant.
  - Request body: `{ message }`
  - Response: AI-generated response.

---

For detailed request and response schemas, please refer to the source code and Supabase function definitions.
