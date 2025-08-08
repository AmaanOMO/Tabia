# Tabia Backend API Documentation

## Overview
This is the Spring Boot backend for Tabia - Smart Tab Session Manager. It provides REST APIs for managing browsing sessions, tabs, and collaboration features with Firebase authentication.

## Architecture
- **Framework**: Spring Boot 3.2+ with Java 17+
- **Database**: PostgreSQL with JPA/Hibernate
- **Authentication**: Firebase Auth with JWT tokens
- **Security**: Spring Security with custom Firebase filter
- **Testing**: JUnit 5 with Mockito

## Authentication
All API endpoints (except `/api/health`) require Firebase authentication:
```
Authorization: Bearer <firebase-id-token>
```

## API Endpoints

### Sessions API

#### Create Session
```http
POST /api/sessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Frontend Research",
  "isWindowSession": false,
  "tabs": [
    {
      "title": "Tailwind Docs",
      "url": "https://tailwindcss.com",
      "tabIndex": 0,
      "windowIndex": 0
    }
  ]
}
```

#### Get All Sessions
```http
GET /api/sessions
Authorization: Bearer <token>
```
Returns all sessions the user owns or collaborates on.

#### Get Session by ID
```http
GET /api/sessions/{sessionId}
Authorization: Bearer <token>
```

#### Update Session
```http
PATCH /api/sessions/{sessionId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Session Name",
  "isStarred": true
}
```

#### Delete Session
```http
DELETE /api/sessions/{sessionId}
Authorization: Bearer <token>
```
Only session owner can delete.

### Tabs API

#### Add Tab to Session
```http
POST /api/tabs/{sessionId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "New Tab",
  "url": "https://example.com",
  "tabIndex": 1,
  "windowIndex": 0
}
```

#### Update Tab
```http
PUT /api/tabs/{tabId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Updated Tab Title",
  "url": "https://updated-url.com",
  "tabIndex": 2
}
```

#### Delete Tab
```http
DELETE /api/tabs/{tabId}
Authorization: Bearer <token>
```

### Collaboration API

#### Create Invite
```http
POST /api/invite/{sessionId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "role": "EDITOR",
  "expiresInHours": 24
}
```

#### Accept Invite
```http
POST /api/invite/accept/{inviteCode}
Authorization: Bearer <token>
```

#### Get Session Collaborators
```http
GET /api/sessions/{sessionId}/collaborators
Authorization: Bearer <token>
```

#### Remove Collaborator
```http
DELETE /api/sessions/{sessionId}/collaborators/{userId}
Authorization: Bearer <token>
```

## Data Models

### Session
- `id`: UUID - Primary key
- `name`: String - Session name
- `ownerId`: String - Firebase UID of owner
- `isStarred`: Boolean - Starred status
- `isWindowSession`: Boolean - Window vs tab session
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last update timestamp

### Tab
- `id`: UUID - Primary key
- `sessionId`: UUID - Parent session
- `title`: String - Tab title
- `url`: String - Tab URL
- `tabIndex`: Integer - Position within window
- `windowIndex`: Integer - Window number (for multi-window sessions)
- `createdAt`: DateTime - Creation timestamp

### Collaborator
- `id`: UUID - Primary key
- `sessionId`: UUID - Session being shared
- `userId`: String - Firebase UID of collaborator
- `role`: Enum - EDITOR or VIEWER
- `addedAt`: DateTime - When collaboration started

### Invite
- `id`: UUID - Primary key
- `sessionId`: UUID - Session being shared
- `inviteCode`: String - Unique 8-character code
- `role`: Enum - Role to assign when accepted
- `createdBy`: String - Firebase UID of invite creator
- `createdAt`: DateTime - Creation timestamp
- `expiresAt`: DateTime - Expiration timestamp
- `used`: Boolean - Whether invite has been used

## Permissions

### Session Access
- **Owner**: Full access (read, write, delete, share)
- **Editor**: Can view session and modify tabs
- **Viewer**: Can only view session (read-only)

### Operations by Role
| Operation | Owner | Editor | Viewer |
|-----------|-------|--------|--------|
| View session | ✅ | ✅ | ✅ |
| Rename session | ✅ | ❌ | ❌ |
| Star session | ✅ | ❌ | ❌ |
| Delete session | ✅ | ❌ | ❌ |
| Add tabs | ✅ | ✅ | ❌ |
| Edit tabs | ✅ | ✅ | ❌ |
| Delete tabs | ✅ | ✅ | ❌ |
| Create invites | ✅ | ❌ | ❌ |
| Remove collaborators | ✅ | ❌ | ❌ |

## Error Handling
All errors return consistent JSON responses:

```json
{
  "status": 404,
  "error": "Resource Not Found",
  "message": "Session not found or access denied",
  "timestamp": "2024-01-15T10:30:00"
}
```

### Common Error Codes
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

## Configuration

### Environment Variables
```yaml
# Database
POSTGRES_URL: jdbc:postgresql://localhost:5432/tabia
POSTGRES_USERNAME: tabia_user
POSTGRES_PASSWORD: your_password

# Firebase
FIREBASE_PROJECT_ID: your-project-id
FIREBASE_CREDENTIALS: '{"type":"service_account",...}'
```

### Application Properties
See `application.yml` for full configuration including:
- Database connection settings
- JPA/Hibernate configuration
- Security settings
- CORS configuration
- Logging levels

## Testing
The project includes comprehensive tests:

### Unit Tests
- Service layer tests with Mockito
- Controller tests with MockMvc
- Repository integration tests with @DataJpaTest

### Running Tests
```bash
mvn test
```

## Security Features
- Firebase JWT token verification
- Role-based access control
- CORS configuration for Chrome extensions
- SQL injection prevention via JPA
- Input validation with Bean Validation

## Performance Considerations
- Database indexes on frequently queried fields
- Lazy loading for entity relationships
- Transactional boundaries for data consistency
- Connection pooling for database access

## Development Setup
1. Ensure PostgreSQL is running (Docker recommended)
2. Set environment variables for database and Firebase
3. Run: `mvn spring-boot:run`
4. API will be available at `http://localhost:8080/api`

## Deployment Notes
- Use environment-specific `application-{profile}.yml` files
- Configure proper database connection pooling
- Set up proper logging levels for production
- Use HTTPS in production environments
- Configure Firebase service account credentials securely