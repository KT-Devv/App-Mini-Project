# Database Schema Documentation

This document provides a comprehensive overview of the StudySphere database schema, including all tables, relationships, and key constraints.

## Overview

StudySphere uses PostgreSQL as its primary database, managed through Supabase. The database is designed with a focus on real-time collaboration, user relationships, and content management.

## Core Tables

### 1. profiles
User profile information and authentication data.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users |
| email | text | User's email address |
| username | text | User's display name |
| avatar_url | text | URL to user's profile picture |
| created_at | timestamp | Account creation timestamp |

**Relationships:**
- One-to-many with chat_messages (user_id)
- One-to-many with study_sessions (host_id)
- One-to-many with resources (uploaded_by)
- One-to-many with personal_files (user_id)
- One-to-many with notifications (user_id)

### 2. chat_rooms
Study group chat rooms for collaborative discussions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Chat room name |
| description | text | Optional room description |
| created_by | uuid | References profiles.id |
| created_at | timestamp | Room creation timestamp |
| is_active | boolean | Whether room is active |

**Relationships:**
- One-to-many with chat_messages (room_id)
- One-to-many with chat_room_members (room_id)
- One-to-many with chat_room_invitations (room_id)

### 3. chat_messages
Individual messages within chat rooms.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| room_id | uuid | References chat_rooms.id |
| user_id | uuid | References profiles.id |
| content | text | Message content |
| message_type | text | Type: 'text', 'file', 'system' |
| file_url | text | URL for attached files |
| file_name | text | Name of attached file |
| file_type | text | MIME type of attached file |
| file_size | integer | Size of attached file in bytes |
| created_at | timestamp | Message timestamp |

### 4. study_sessions
Scheduled collaborative study sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Session title |
| subject | text | Study subject/topic |
| description | text | Optional session description |
| created_by | uuid | References profiles.id |
| host_id | uuid | References profiles.id |
| start_time | timestamp | Session start time |
| end_time | timestamp | Session end time |
| scheduled_for | timestamp | When session is scheduled |
| max_participants | integer | Maximum number of participants |
| is_active | boolean | Whether session is active |
| created_at | timestamp | Session creation timestamp |

**Relationships:**
- One-to-many with session_participants (session_id)

### 5. session_participants
Tracks which users are participating in study sessions.

| Column | Type | Description |
|--------|------|-------------|
| session_id | uuid | References study_sessions.id |
| user_id | uuid | References profiles.id |
| joined_at | timestamp | When user joined the session |

### 6. resources
Shared study materials and educational content.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Resource title |
| subject | text | Subject category |
| description | text | Optional description |
| file_url | text | URL to resource file |
| file_type | text | MIME type |
| size | integer | File size in bytes |
| uploaded_by | uuid | References profiles.id |
| downloads | integer | Download count |
| created_at | timestamp | Upload timestamp |

**Relationships:**
- One-to-many with resource_tags (resource_id)

### 7. resource_tags
Tags for categorizing resources.

| Column | Type | Description |
|--------|------|-------------|
| resource_id | uuid | References resources.id |
| tag | text | Tag name |

### 8. personal_files
User's private file storage.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles.id |
| file_url | text | File URL |
| file_name | text | Original file name |
| file_type | text | MIME type |
| file_size | integer | File size in bytes |
| original_name | text | Original file name |
| description | text | Optional description |
| tags | text[] | Array of tags |
| created_at | timestamp | Upload timestamp |
| updated_at | timestamp | Last modification timestamp |

**Relationships:**
- One-to-many with file_shares (file_id)
- One-to-many with file_ai_shares (file_id)

### 9. chat_files
Files shared within chat messages.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| message_id | uuid | References chat_messages.id |
| file_url | text | File URL |
| file_name | text | File name |
| file_type | text | MIME type |
| file_size | integer | File size in bytes |
| uploaded_by | uuid | References profiles.id |
| created_at | timestamp | Upload timestamp |

### 10. file_shares
Tracks file sharing between users and chat rooms.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| file_id | uuid | References personal_files.id |
| chat_room_id | uuid | References chat_rooms.id |
| shared_by | uuid | References profiles.id |
| shared_at | timestamp | Share timestamp |
| message_id | uuid | References chat_messages.id |

### 11. file_ai_shares
Tracks files shared with AI assistant.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| file_id | uuid | References personal_files.id |
| user_id | uuid | References profiles.id |
| shared_at | timestamp | Share timestamp |
| ai_session_id | uuid | AI session identifier |
| purpose | text | Purpose of sharing |

### 12. friends
User friendship relationships.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | First user in friendship |
| friend_id | uuid | Second user in friendship |
| status | text | Friendship status: 'pending', 'accepted', 'blocked' |
| created_at | timestamp | Friendship creation timestamp |

### 13. notifications
User notifications system.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References profiles.id |
| title | text | Notification title |
| message | text | Notification content |
| type | text | Notification type |
| related_id | uuid | Related entity ID |
| is_read | boolean | Read status |
| created_at | timestamp | Notification timestamp |

### 14. chat_room_members
Tracks membership in chat rooms.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| room_id | uuid | References chat_rooms.id |
| user_id | uuid | References profiles.id |
| role | text | Member role: 'member', 'moderator', 'admin' |
| joined_at | timestamp | Join timestamp |

### 15. chat_room_invitations
Invitation system for chat rooms.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| room_id | uuid | References chat_rooms.id |
| invited_by | uuid | References profiles.id |
| invited_user | uuid | References profiles.id |
| invitation_code | text | Unique invitation code |
| email | text | Email of invited user |
| status | text | Invitation status |
| expires_at | timestamp | Invitation expiration |
| created_at | timestamp | Invitation creation timestamp |

## Database Functions

### get_unread_notification_count
Returns the count of unread notifications for a user.

**Parameters:**
- target_user_id (uuid): User ID to check

**Returns:** integer

### is_room_admin_or_moderator
Checks if a user has admin or moderator privileges in a room.

**Parameters:**
- room_uuid (uuid): Room ID
- user_uuid (uuid): User ID

**Returns:** boolean

### is_room_member
Checks if a user is a member of a room.

**Parameters:**
- room_uuid (uuid): Room ID
- user_uuid (uuid): User ID

**Returns:** boolean

### get_file_share_info
Retrieves sharing information for a file in a specific room.

**Parameters:**
- file_uuid (uuid): File ID
- room_uuid (uuid): Room ID

**Returns:** Table of share information

### get_user_file_stats
Returns statistics about a user's files.

**Parameters:**
- user_uuid (uuid): User ID

**Returns:** Table of file statistics

## Row Level Security (RLS) Policies

The database implements comprehensive RLS policies to ensure data security:

- Users can only access their own profile data
- Chat room members can only see messages in rooms they're part of
- Users can only modify resources they uploaded
- File access is restricted to owners and authorized sharers
- Notifications are private to each user

## Indexes

Key indexes are created for performance optimization:

- Primary key indexes on all tables
- Foreign key indexes for referential integrity
- Composite indexes on frequently queried columns
- Partial indexes for active records

## Migrations

Database schema changes are managed through Supabase migrations:

- Initial schema setup
- Feature additions (file sharing, AI integration, etc.)
- Performance optimizations
- Security enhancements

See the `supabase/migrations/` directory for migration files.
