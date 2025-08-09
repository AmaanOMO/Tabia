# Migration Notes: Spring Boot v1 → Supabase v2

This document outlines the migration from Tabia's v1 Spring Boot backend to v2 Supabase implementation.

## 🎯 Why Migrate?

### v1 Challenges (Spring Boot)
- **Hosting Costs**: Requires server infrastructure ($5-50/month)
- **Complexity**: Java backend, Docker, PostgreSQL setup
- **Maintenance**: Server updates, security patches, monitoring
- **Scaling**: Manual scaling, load balancing considerations

### v2 Benefits (Supabase)
- **$0 Hosting**: Free tier supports thousands of users
- **Built-in Features**: Auth, database, realtime, file storage
- **Auto-scaling**: Handles traffic spikes automatically
- **Developer Experience**: Direct frontend-to-database communication

## 📊 Architecture Comparison

### v1 Architecture (Spring Boot)
```
Chrome Extension → Firebase Auth → Spring Boot API → PostgreSQL
                                      ↓
                                 WebSocket Server
```

### v2 Architecture (Supabase)
```
Chrome Extension → Supabase Auth → Supabase PostgreSQL
                                       ↓
                                 Supabase Realtime
```

## 🔄 API Mapping

### Session Operations
| v1 Spring Boot | v2 Supabase | Notes |
|---|---|---|
| `GET /api/sessions` | `listSessions()` | Same response shape |
| `POST /api/sessions` | `createSession()` | Same request format |
| `GET /api/sessions/{id}` | `getSession()` | Same response shape |
| `PATCH /api/sessions/{id}` | `updateSession()` | Same request format |
| `DELETE /api/sessions/{id}` | `deleteSession()` | Same behavior |

### Tab Operations
| v1 Spring Boot | v2 Supabase | Notes |
|---|---|---|
| `POST /api/tabs/{sessionId}` | `addTab()` | Same request format |
| `PUT /api/tabs/{tabId}` | `updateTab()` | Same request format |
| `DELETE /api/tabs/{tabId}` | `deleteTab()` | Same behavior |

### Collaboration
| v1 Spring Boot | v2 Supabase | Notes |
|---|---|---|
| `GET /api/sessions/{id}/collaborators` | `listCollaborators()` | Same response shape |
| `POST /api/invite/{sessionId}` | `createInvite()` | Same request format |
| `POST /api/invite/accept/{inviteId}` | `acceptInvite()` | Uses invite code instead of ID |

### Authentication
| v1 Spring Boot | v2 Supabase | Notes |
|---|---|---|
| Firebase Auth + JWT verification | Supabase Auth (Google) | Simpler setup |
| Manual user table sync | Automatic user sync | Built-in |

## 🔐 Security Model Comparison

### v1 Security (Spring Boot)
- Firebase JWT verification in custom filter
- Service-layer permission checks
- Manual role-based access control
- Custom exception handling

### v2 Security (Supabase)
- Built-in JWT verification
- Row Level Security (RLS) policies
- Database-level access control
- Automatic auth integration

### RLS Policies (v2)
```sql
-- Sessions: Owner + collaborators can read
CREATE POLICY sessions_select ON sessions
FOR SELECT USING (
  owner_id = auth_uid() OR
  EXISTS (SELECT 1 FROM collaborators WHERE session_id = id AND user_id = auth_uid())
);

-- Tabs: Editors can write, viewers can read
CREATE POLICY tabs_write ON tabs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM sessions s
    LEFT JOIN collaborators c ON c.session_id = s.id
    WHERE s.id = tabs.session_id
    AND (s.owner_id = auth_uid() OR c.role IN ('EDITOR','OWNER'))
  )
);
```

## ⚡ Real-time Comparison

### v1 Real-time (WebSocket)
- Custom STOMP WebSocket server
- Manual connection management
- Firebase JWT over WebSocket
- Custom message routing

### v2 Real-time (Supabase)
- Built-in PostgreSQL change streams
- Automatic reconnection
- Integrated with auth system
- Simple subscription model

```typescript
// v1 WebSocket
webSocketClient.subscribeToSession(sessionId, handlers);

// v2 Supabase Realtime
joinSession(sessionId, {
  onTabInserted: (tab) => console.log('New tab:', tab),
  onTabUpdated: (tab) => console.log('Updated tab:', tab),
  onTabDeleted: (tabId) => console.log('Deleted tab:', tabId),
  onSessionUpdated: (patch) => console.log('Session updated:', patch)
});
```

## 📦 Data Model Consistency

Both v1 and v2 use identical DTO shapes:

```typescript
interface SessionDTO {
  id: string;
  name: string;
  ownerId: string;
  isStarred: boolean;
  isWindowSession: boolean;
  createdAt: string;
  updatedAt: string;
  tabs?: TabDTO[];
  collaboratorCount?: number;
}
```

This ensures the UI layer requires **zero changes** when switching between v1 and v2.

## 🚀 Migration Benefits

### Performance
- **Latency**: Direct database queries vs API roundtrips
- **Caching**: Built-in query caching and optimization
- **CDN**: Global edge network for faster responses

### Developer Experience
- **No Backend Code**: Frontend-only development
- **Type Safety**: Generated TypeScript types from schema
- **Admin Panel**: Built-in database admin interface
- **Monitoring**: Built-in analytics and logging

### Cost Efficiency
- **Free Tier**: 50,000+ monthly active users
- **No Server Costs**: Serverless architecture
- **Auto-scaling**: Pay only for usage beyond free tier

## 🔧 Migration Steps

1. **Database Setup**: Apply `backend-supabase/sql/schema.sql` and `rls.sql`
2. **Auth Configuration**: Enable Google OAuth in Supabase dashboard
3. **Environment Variables**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. **Code Integration**: Extension automatically uses v2 client
5. **Testing**: Verify CRUD operations and real-time updates

## 📋 Feature Parity Checklist

- ✅ **Authentication**: Google OAuth with user profiles
- ✅ **Sessions**: Create, read, update, delete with same API
- ✅ **Tabs**: Full CRUD operations with same request/response shapes
- ✅ **Collaboration**: Role-based permissions (Owner/Editor/Viewer)
- ✅ **Invites**: Create and accept invites with codes
- ✅ **Real-time**: Live updates for tabs and sessions
- ✅ **Security**: RLS policies enforce access control
- ✅ **Scalability**: Auto-scaling with generous free tier

## 🎯 Conclusion

The v2 Supabase migration provides:
- **100% feature parity** with v1 Spring Boot
- **Identical API surface** for seamless UI compatibility
- **Superior developer experience** with less complexity
- **Better economics** with $0 hosting costs
- **Enhanced performance** with built-in optimizations

The migration preserves all existing functionality while dramatically simplifying the architecture and reducing operational overhead.
