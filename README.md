# Tabia - Smart Tab Session Manager + AI Assistant

🧠 **Project Overview**

Tabia is a Chrome Extension that helps users save, restore, and organize browsing sessions into named collections. It's like a productivity-focused "Notion for tabs," with future integration of AI assistance (Tabi) and Stripe billing for premium features.

## 🧱 Tech Stack

### Frontend (Chrome Extension)
- **React** + **Tailwind CSS**
- **Manifest V3** (Chrome APIs)
- **Firebase Auth** (Gmail login only)
- **Axios** for backend API calls

### Backend
- **Spring Boot** (Java)
- **PostgreSQL** (hosted)
- **JPA** for ORM
- **Firebase Admin SDK** for ID token verification
- **Stripe** (planned for Pro billing)

### AI (Planned)
- **OpenAI GPT-4o**
- API receives session context (titles + URLs) and responds to user queries
- Usage-based caps and Stripe billing enforcement

## ✅ Current MVP Scope (No AI / No Stripe)

- Firebase login (Gmail)
- Save current Chrome window's tabs as a session
- Save individual tab to existing session
- View, rename, delete, and reorder sessions
- View and reorder tabs within a session
- Search bar (fuzzy match session names + tab URLs)
- Drag-and-drop tabs between sessions
- Star sessions (pin to top)
- All data stored per-user in PostgreSQL

## 🔐 Auth Flow

- User signs in with Firebase Auth (Google login)
- Frontend includes ID token in `Authorization: Bearer <token>` headers
- Spring Boot verifies ID token and stores UID + email in users table
- All session data is scoped to that UID

## 🧠 Tabi (Planned Post-MVP)

- Draggable, resizable modal chat window
- Accessible from any screen in the extension
- Sends current session context (tab titles + URLs) to OpenAI API
- Can summarize, answer questions, and assist with research/focus
- Free users: capped messages/day
- Pro users: unlimited messages (soft/hard caps enforced via backend)

## 💳 Stripe Billing (Planned Post-MVP)

- Stripe Checkout for Pro subscriptions
- Stripe webhook on backend → updates user status
- Pro unlocks:
  - Unlimited AI messages
  - Multi-window session saving
  - Priority support
- Free tier includes 10 AI messages/day and basic session management

## 📦 Multi-Window Sessions (MVP)

- User can save all open Chrome windows into a grouped session
- Group has a name (e.g. "Weekend Project")
- Each window inside it can have a default name ("Window 1") or custom name
- When reopened, each window opens with its own tabs

## 🧠 UX Goals

- Clean, calm UI (bg-white + #A2D2FF accent)
- Session cards with collapsible tab lists
- Simple buttons: Save Session, Save Tab, Search, Tabi (Pro)
- AI assistant feels like a useful coworker, not a gimmick

## 🛠 Project Structure

```
/tabia
├── /extension (React + Tailwind + Manifest V3)
│   ├── /src
│   │   ├── /components     # Reusable UI components
│   │   ├── /pages          # Page-level components
│   │   ├── /services       # API calls and external services
│   │   ├── /utils          # Utility functions
│   │   ├── /hooks          # Custom React hooks
│   │   ├── /context        # React context providers
│   │   ├── /types          # TypeScript type definitions
│   │   ├── /styles         # CSS and styling
│   │   └── /assets         # Images, icons, etc.
│   ├── /public             # Static assets and manifest
│   ├── /build              # Build output
│   └── /dist               # Distribution files
└── /backend (Spring Boot + PostgreSQL + Firebase + Stripe)
    └── /src
        ├── /main
        │   ├── /java/com/tabia
        │   │   ├── /controller    # REST API endpoints
        │   │   ├── /service       # Business logic
        │   │   ├── /repository    # Data access layer
        │   │   ├── /model         # Entity classes
        │   │   ├── /config        # Configuration classes
        │   │   └── /exception     # Custom exceptions
        │   └── /resources         # Application properties, static files
        └── /test                  # Test files
```

## 🧭 Build Strategy

- **Phase 1**: MVP (no AI, no billing)
- **Phase 2**: Add Tabi (basic assistant)
- **Phase 3**: Add Stripe billing and Pro tier gating
- **Phase 4**: Add advanced AI features, analytics, usage tracking

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Java 17+
- PostgreSQL
- Chrome browser for extension development

### Development Setup

1. **Backend Setup**
   ```bash
   cd backend
   # Add Spring Boot dependencies and configuration
   # Set up PostgreSQL connection
   # Configure Firebase Admin SDK
   ```

2. **Extension Setup**
   ```bash
   cd extension
   # Initialize React app with TypeScript
   # Add Tailwind CSS
   # Configure Chrome extension manifest
   # Set up Firebase Auth
   ```

## 📝 Development Notes

- All API endpoints should include Firebase ID token verification
- Session data is scoped to user UID from Firebase
- Extension uses Chrome APIs for tab management
- Backend handles all data persistence and business logic

## 🔮 Future Features

- AI-powered session analysis and recommendations
- Pro subscription with Stripe integration
- Multi-window session support
- Advanced search and filtering
- Session sharing and collaboration
- Usage analytics and insights 