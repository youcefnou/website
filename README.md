<<<<<<< HEAD
hh
=======
# WEB - Next.js 14 TypeScript Project

A modern full-stack web application built with Next.js 14 App Router, TypeScript, and a comprehensive suite of modern tools and libraries.

## Tech Stack

### Core Framework

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **React 18** - UI library

### Styling & UI

- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - High-quality, accessible UI components
- **CSS Variables** - For theming support (light/dark mode)

### State Management & Data Fetching

- **TanStack Query** (React Query) - Powerful data synchronization for server state
- **Zustand** - Lightweight state management for client state

### Backend Services

- **Supabase** - Backend as a Service (Authentication, Database)
- **Cloudinary** - Media management and optimization

### Code Quality

- **ESLint** - Strict linting with Next.js recommended rules
- **Prettier** - Opinionated code formatter
- **TypeScript Strict Mode** - Enhanced type checking

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles with Shadcn variables
├── components/
│   ├── providers/         # Context providers
│   │   └── query-provider.tsx
│   └── ui/                # Shadcn UI components (to be added)
├── lib/
│   ├── auth/              # Supabase authentication wrapper
│   │   └── index.ts       # Auth helpers (signIn, signUp, etc.)
│   ├── cloudinary/        # Cloudinary integration
│   │   └── upload.ts      # Upload helpers with signed URLs
│   ├── supabase/          # Supabase client setup
│   │   ├── client.ts      # Browser client
│   │   └── server.ts      # Server client
│   └── utils.ts           # Utility functions (cn helper)
├── store/                 # Zustand stores
│   └── auth-store.ts      # Authentication state
├── .env.example           # Environment variables template
├── .env.local             # Local environment variables (gitignored)
└── components.json        # Shadcn UI configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

```bash
git clone https://github.com/you05GIT/WEB.git
cd WEB
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your actual values for Supabase and Cloudinary

```bash
cp .env.example .env.local
```

### Environment Variables

Update `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Key Features

### Authentication (lib/auth)

- Sign up / Sign in with email and password
- Password reset
- User metadata management
- Auth state management with Zustand
- Session management

### Supabase Integration (lib/supabase)

- Browser client for client-side operations
- Server client for server-side operations
- Automatic cookie management
- Type-safe database queries

### Cloudinary Integration (lib/cloudinary)

- Signed uploads for security
- Image/video/file upload support
- URL generation with transformations
- Asset deletion

### UI Components (Shadcn UI)

- Pre-configured with Tailwind CSS
- Dark mode support via CSS variables
- Accessible components
- Customizable themes

### State Management

- TanStack Query for server state (caching, refetching, etc.)
- Zustand for client state (auth, UI state, etc.)
- Optimistic updates support

## Adding Shadcn UI Components

To add new Shadcn UI components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

Components will be automatically added to `components/ui/`.

## Best Practices

1. **Type Safety**: Use TypeScript for all new files
2. **Server vs Client**: Use server components by default, add `'use client'` only when needed
3. **Environment Variables**: Never commit `.env.local`, always update `.env.example`
4. **Code Quality**: Run lint and format before committing
5. **Imports**: Use `@/` alias for absolute imports

## Learn More

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Learn Next.js](https://nextjs.org/learn)

### Library Documentation

- [Shadcn UI](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Supabase](https://supabase.com/docs)
- [Cloudinary](https://cloudinary.com/documentation)

## License

This project is licensed under the MIT License.
>>>>>>> bcc3cec (initial commit)
