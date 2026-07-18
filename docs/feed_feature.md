# Feed Feature Specification

## Overview
A Facebook-style social feed that allows users within the platform to post updates, share links, upload media, and engage with other members through likes and comments.

## Data Schema

### FeedPost
- `author`: Reference to User
- `content`: String (Text content of the post)
- `mediaUrls`: Array of Strings (Optional image/video URLs attached to the post)
- `likes`: Array of User References
- `commentCount`: Number
- `createdAt` / `updatedAt`: Timestamps

### FeedComment
- `post`: Reference to FeedPost
- `author`: Reference to User
- `content`: String
- `likes`: Array of User References
- `createdAt` / `updatedAt`: Timestamps

## Core Features
1. **Create Post**: 
   - A sticky / top input box on the feed page.
   - Support for text and optionally uploading an image.
2. **Timeline View**: 
   - Infinite scrolling or paginated list of posts, sorted by newest first.
   - For version 1, a global feed showing all users' posts.
3. **Engagement**:
   - Like button on posts.
   - Expandable comment section under each post to view/add comments.

## Frontend UI Components
- **FeedPage**: The main container for the feed route (`/feed`).
- **PostComposer**: The UI element where users type new posts.
- **PostCard**: The display component for a single post.
- **CommentThread**: The sub-component for rendering the comments of a specific post.
