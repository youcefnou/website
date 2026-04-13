# Visual Flow Documentation

This document provides a visual representation of how the FAQ and About pages system works.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐              ┌────────────────┐         │
│  │  Public Pages  │              │  Admin Panel   │         │
│  ├────────────────┤              ├────────────────┤         │
│  │   /faq         │              │ /admin/settings│         │
│  │   /about       │              │     /pages     │         │
│  └────────┬───────┘              └───────┬────────┘         │
│           │                              │                  │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            │ Read Only                    │ Read/Write
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Actions                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  getPage(pageId)                updatePage(pageId, data)    │
│  getAllPages()                  [Requires Admin Auth]       │
│                                                               │
└───────────┬─────────────────────────────┬───────────────────┘
            │                             │
            │         Supabase Client     │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (Supabase)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  pages table:                                                 │
│  ┌─────────────┬────────────┬──────────────────────┐        │
│  │ id          │ title      │ content              │        │
│  ├─────────────┼────────────┼──────────────────────┤        │
│  │ faq         │ FAQ        │ ## Question 1...     │        │
│  │ about       │ About Us   │ ## Who we are...     │        │
│  └─────────────┴────────────┴──────────────────────┘        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## User Journeys

### Journey 1: Public User Viewing FAQ

```
User                    Frontend                Server              Database
  |                        |                       |                    |
  |  1. Click FAQ link     |                       |                    |
  |----------------------->|                       |                    |
  |                        | 2. Request /faq       |                    |
  |                        |---------------------->|                    |
  |                        |                       | 3. getPage('faq') |
  |                        |                       |------------------>|
  |                        |                       |                    |
  |                        |                       | 4. Return page data|
  |                        |                       |<-------------------|
  |                        | 5. Render page        |                    |
  |                        |<----------------------|                    |
  |  6. Display FAQ page   |                       |                    |
  |<-----------------------|                       |                    |
  |                        |                       |                    |
```

### Journey 2: Admin Editing About Page

```
Admin                   Frontend                Server              Database
  |                        |                       |                    |
  |  1. Navigate to        |                       |                    |
  |     /admin/settings/   |                       |                    |
  |     pages/about        |                       |                    |
  |----------------------->|                       |                    |
  |                        | 2. Check auth         |                    |
  |                        |---------------------->|                    |
  |                        |                       | 3. Verify admin   |
  |                        | 4. Auth OK            |                    |
  |                        |<----------------------|                    |
  |                        |                       |                    |
  |                        | 5. getPage('about')   |                    |
  |                        |---------------------->|                    |
  |                        |                       | 6. Query DB       |
  |                        |                       |------------------>|
  |                        |                       | 7. Page data      |
  |                        | 8. Return data        |<-------------------|
  |                        |<----------------------|                    |
  |  9. Show editor form   |                       |                    |
  |<-----------------------|                       |                    |
  |                        |                       |                    |
  | 10. Edit content       |                       |                    |
  | 11. Click save         |                       |                    |
  |----------------------->|                       |                    |
  |                        | 12. updatePage()      |                    |
  |                        |---------------------->|                    |
  |                        |                       | 13. Update DB     |
  |                        |                       |------------------>|
  |                        |                       | 14. Success       |
  |                        | 15. Revalidate cache  |<-------------------|
  |                        |<----------------------|                    |
  | 16. Show success toast |                       |                    |
  |<-----------------------|                       |                    |
  |                        |                       |                    |
```

## Component Hierarchy

### Public Pages

```
app/(public)/faq/page.tsx
│
├─ getPage('faq')                        [Server Action]
│
├─ formatMarkdownContent(content)        [Utility Function]
│  │
│  ├─ Parse ## headings → <h2>
│  ├─ Parse - lists → <ul><li>
│  └─ Parse paragraphs → <p>
│
└─ Render formatted content
```

### Admin Panel

```
app/(admin)/admin/settings/page.tsx
│
└─ Link to pages management

app/(admin)/admin/settings/pages/page.tsx
│
├─ getAllPages()                         [Server Action]
│
└─ Display list of pages
   │
   └─ Link to edit each page

app/(admin)/admin/settings/pages/[pageId]/page.tsx
│
├─ requireAdmin()                        [Auth Check]
│
├─ getPage(pageId)                       [Server Action]
│
└─ <PageEditor>                          [Client Component]
   │
   ├─ Form inputs (title, content, etc.)
   │
   └─ onSubmit → updatePage()            [Server Action]
```

## Data Flow

### Reading a Page

```
1. Request: GET /faq
             ↓
2. Server Action: getPage('faq')
             ↓
3. Database Query: SELECT * FROM pages WHERE id = 'faq'
             ↓
4. Return Data: { id: 'faq', title: '...', content: '...' }
             ↓
5. Format Content: formatMarkdownContent(content)
             ↓
6. Render JSX: <h2>, <p>, <ul><li> elements
             ↓
7. Response: HTML page with formatted content
```

### Updating a Page

```
1. Admin submits form
             ↓
2. Client Action: updatePage('about', newData)
             ↓
3. Auth Check: requireAdmin()
             ↓
4. Database Update: UPDATE pages SET ... WHERE id = 'about'
             ↓
5. Revalidate: revalidatePath('/about')
             ↓
6. Response: { success: true }
             ↓
7. Client: Show success toast
```

## File Organization

```
/home/runner/work/WEB/WEB/
│
├── migrations/
│   └── add_pages_table.sql              [Database schema]
│
├── db/
│   └── types.ts                         [TypeScript types]
│
├── app/
│   ├── actions/
│   │   └── pages.ts                     [Server actions]
│   │
│   ├── (public)/
│   │   ├── faq/
│   │   │   └── page.tsx                 [Public FAQ page]
│   │   └── about/
│   │       └── page.tsx                 [Public About page]
│   │
│   └── (admin)/admin/settings/
│       └── pages/
│           ├── page.tsx                 [Pages list]
│           └── [pageId]/
│               └── page.tsx             [Page editor]
│
├── components/
│   └── admin/
│       └── page-editor.tsx              [Editor component]
│
├── lib/
│   └── markdown-formatter.tsx           [Utility function]
│
└── docs/
    ├── MIGRATION_GUIDE.md
    ├── FAQ_ABOUT_IMPLEMENTATION.md
    └── DEPLOYMENT_CHECKLIST.md
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Route Protection                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │  requireAdmin() in all admin routes                │     │
│  │  Redirects unauthorized users                      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 2: Server Action Protection                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │  updatePage() checks admin status                  │     │
│  │  Read-only actions are public                      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 3: Database Security (Supabase RLS)                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Row Level Security policies                        │     │
│  │  Service role key for server actions               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 4: Content Security                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │  React escapes all user content by default         │     │
│  │  No dangerouslySetInnerHTML used                   │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Performance Optimizations

1. **Server-Side Rendering (SSR)**
   - Pages are rendered on the server
   - Better SEO and initial load time

2. **Caching**
   - Next.js caches rendered pages
   - Invalidated on content updates

3. **Minimal Client JavaScript**
   - No client-side data fetching
   - Admin panel only loads editor code

4. **Database Indexing**
   - Primary key on `id` field
   - Fast lookups for pages

## Error Handling

```
Error Scenario              Response                      User Experience
───────────────────────────────────────────────────────────────────────────
Page not found              404 Not Found                 Next.js 404 page
Page unpublished            404 Not Found                 Next.js 404 page
Database error (read)       Throw error                   500 error page
Database error (write)      Error message                 Toast notification
Unauthorized admin access   Redirect to home              "unauthorized" error
Network error               Retry/error message           Toast notification
Validation error            Error message                 Form validation
```

## Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Testing Pyramid                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                    ┌─────────────┐                           │
│                    │   Manual    │   (User flows)            │
│                    │   Testing   │                           │
│                    └─────────────┘                           │
│                  ┌─────────────────┐                         │
│                  │  Build & Lint   │  (Type safety)          │
│                  │     Tests       │                         │
│                  └─────────────────┘                         │
│              ┌───────────────────────┐                       │
│              │   Database Schema     │  (Migration)          │
│              │      Validation       │                       │
│              └───────────────────────┘                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Deployment Pipeline

```
1. Development
   │
   ├─ Write code
   ├─ Run linter
   ├─ Build locally
   └─ Test manually
   │
   ▼
2. Code Review
   │
   ├─ Automated review
   ├─ Address feedback
   └─ Commit changes
   │
   ▼
3. Pre-Deployment
   │
   ├─ Run migration (staging)
   ├─ Deploy to staging
   └─ Test on staging
   │
   ▼
4. Production Deployment
   │
   ├─ Run migration (production)
   ├─ Deploy code
   └─ Verify deployment
   │
   ▼
5. Post-Deployment
   │
   ├─ Monitor logs
   ├─ Check analytics
   └─ Update content
```

## Future Enhancements Roadmap

```
Phase 1: Current Implementation ✅
├─ Basic page management
├─ FAQ and About pages
└─ Admin panel integration

Phase 2: Enhanced Editor (Future)
├─ Rich text editor
├─ Image uploads
├─ Preview mode
└─ Autosave

Phase 3: Advanced Features (Future)
├─ Version history
├─ Custom pages
├─ Page templates
└─ Multi-language support

Phase 4: Analytics (Future)
├─ Page view tracking
├─ User engagement metrics
└─ A/B testing
```

---

This visual documentation should help understand the complete system architecture and data flow.
