# File Sharing in Chat Groups

## Overview
This feature allows users to share files directly within chat groups, making it easy to collaborate and share study materials, documents, and images.

## Features

### File Types Supported
- **Images**: JPG, PNG, GIF, WebP, etc.
- **Documents**: PDF, DOC, DOCX, TXT, PPT, PPTX
- **File Size Limit**: 10MB per file

### How It Works
1. **Upload**: Click the paperclip icon (📎) in the chat input area
2. **Select File**: Choose a file from your device
3. **Preview**: See file details before sending
4. **Send**: Click send to share the file in the chat
5. **Download**: Other users can download the shared files

### File Display
- **Images**: Displayed inline with optional caption
- **Documents**: Show file icon, name, size, and download button
- **File Info**: File name, type, and size are clearly displayed

## Technical Implementation

### Database Changes
- Added file-related columns to `chat_messages` table
- Created `chat_files` table for better file management
- Added RLS policies for security

### Storage
- Files are stored in Supabase Storage under `uploads/chat-files/`
- Public URLs are generated for easy access
- File metadata is stored in the database

### Security
- Only chat room members can view and upload files
- File access is controlled by chat room membership
- RLS policies ensure data isolation

## Usage Examples

### Sharing a Study Document
1. Join a study group chat room
2. Click the paperclip icon
3. Select your PDF or document
4. Add an optional message
5. Send to share with the group

### Sharing Study Images
1. Take a photo of your notes
2. Upload to the chat
3. Add a description
4. Share with your study group

## Benefits
- **Centralized Sharing**: All study materials in one place
- **Easy Access**: No need to switch between apps
- **Group Collaboration**: Share resources with study groups
- **File History**: Keep track of shared materials
- **Mobile Friendly**: Works on all devices

## Future Enhancements
- File preview for documents
- File organization by subject
- Search within shared files
- File versioning
- Integration with study sessions
