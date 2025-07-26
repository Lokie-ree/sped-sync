# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start both frontend (Vite) and backend (Convex) development servers in parallel
- `npm run dev:frontend` - Start only the Vite frontend development server with auto-open
- `npm run dev:backend` - Start only the Convex backend development server
- `npm run build` - Build the frontend application for production
- `npm run lint` - Run TypeScript compiler checks for both main project and Convex backend, then build

### Database Operations
- `npx convex dev` - Start Convex development environment and database
- `npx convex deploy` - Deploy Convex backend to production
- `npx convex dashboard` - Open the Convex database dashboard

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 with TypeScript, Vite build system
- **Backend**: Convex (real-time database and serverless functions)
- **Styling**: Tailwind CSS with custom components
- **Rich Text**: BlockNote editor with ProseMirror integration
- **Authentication**: Convex Auth with anonymous authentication
- **AI Integration**: OpenAI GPT models for IEP assistance

### Project Structure
- `src/` - React frontend application
  - `components/` - UI components (Dashboard, IEP management, collaboration tools)
  - `App.tsx` - Main application with authentication flow
- `convex/` - Backend functions and database schema
  - `schema.ts` - Complete database schema with all tables
  - `ieps.ts` - IEP CRUD operations and business logic
  - `auth.ts` - Authentication and user management
  - `ai.ts` - AI-powered features and OpenAI integration
  - `prosemirror.ts` - Real-time collaborative editing
- `docs/` - Project documentation

### Database Schema Architecture

The application uses role-based access control with these user roles:
- `special_educator`, `general_educator`, `service_provider`, `administrator`, `parent`, `student`

Key database entities:
- **userProfiles** - User information with role-based permissions
- **ieps** - IEP documents with structured content (goals, services, accommodations)
- **collaborationSessions** - Real-time editing sessions with cursor/selection tracking
- **attachments** - File storage for assessments and reports
- **progressData** - Progress monitoring with data points and interventions
- **implementationPlans** - AI-generated implementation strategies
- **chatMessages** - AI assistant conversation history
- **documentChunks** - RAG search content with embeddings
- **notifications** - System notifications and alerts
- **reports** - Analytics and compliance reporting

### Real-time Collaboration
- Uses Convex Presence for live user indicators
- ProseMirror sync for collaborative document editing
- Real-time cursor position and selection sharing
- Change tracking with user attribution and timestamps

### AI Integration Patterns
- Chat-based AI assistant with context from IEP documents
- RAG (Retrieval Augmented Generation) for document search
- Implementation plan generation based on IEP goals
- Progress analysis and recommendations

## Development Guidelines

### Convex Function Patterns
Always use the new Convex function syntax with proper validators:
```typescript
export const functionName = query({
  args: { param: v.string() },
  returns: v.object({ result: v.string() }),
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

### Authentication & Authorization
- All functions should validate user authentication with `getAuthUserId(ctx)`
- IEP access control: check if user is creator or team member
- Role-based permissions implemented in userProfiles table

### File Organization
- Public functions in main files (queries, mutations, actions)
- Internal functions for sensitive operations
- HTTP endpoints in `convex/router.ts` (separate from auth routes in `convex/http.ts`)

### Component Patterns
- Dashboard-based navigation with view state management
- Modal overlays for detailed editing (IEP Editor)
- Real-time collaboration indicators
- Toast notifications using Sonner

### Testing & Quality
- Run `npm run lint` before committing (includes TypeScript checks and build verification)
- Follow existing component patterns and naming conventions
- Use proper TypeScript types from `convex/_generated/dataModel`

## Special Considerations

### IEP Data Structure
IEP documents have complex nested content structure:
- `presentLevels` - Current academic/functional performance
- `goals` - Array of measurable goals with objectives and progress tracking
- `services` - Special education services with frequency/duration
- `accommodations` & `modifications` - Learning supports
- `transitionPlanning` - Post-secondary planning for older students

### Compliance Requirements
- Track approval workflows with digital signatures
- Maintain audit trails for all changes
- Generate compliance reports for state/federal requirements
- Monitor deadlines for annual reviews and meetings

### Performance Optimization  
- Use Convex indexes for efficient queries (defined in schema)
- Implement pagination for large data sets
- Optimize real-time collaboration to minimize bandwidth
- Use document chunking for large text content in RAG search