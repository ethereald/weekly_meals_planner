![Weekly Meals Planner Logo](./public/icons/icon.svg)

# Weekly Meals Planner

A comprehensive meal planning application built with Next.js 15, TypeScript, and Tailwind CSS. Features multi-user authentication, PostgreSQL database with comprehensive meal planning system.

## 🚀 Features

### Authentication System

* ✅ **Multi-User Support** \- Individual user accounts with secure authentication
* ✅ **Username/Password Login** \- Simple\, secure authentication
* ✅ **Password Management** \- Secure password hashing and change functionality
* ✅ **JWT Tokens** \- Stateless authentication with JWT
* ✅ **Protected Routes** \- Middleware\-based route protection

### Meal Planning (Coming Soon)

* 📅 **Weekly Planning** \- Plan meals for the entire week
* 🍽️ **Meal Categories** \- Breakfast\, lunch\, dinner\, and snacks
* 📋 **Shopping Lists** \- Auto\-generated from meal plans
* 🥗 **Ingredient Management** \- Track ingredients and quantities
* 📊 **Nutritional Goals** \- Set and track nutritional targets
* 🔄 **Meal Rotation** \- Reuse favorite meal plans

## 🛠️ Tech Stack

* <strong>Frontend</strong>: Next.js 15 (App Router), TypeScript, Tailwind CSS
* <strong>Backend</strong>: Next.js API Routes
* <strong>Database</strong>: PostgreSQL with Drizzle ORM
* <strong>Authentication</strong>: bcryptjs, jsonwebtoken
* <strong>Package Manager</strong>: pnpm
* <strong>Deployment</strong>: Vercel-ready

## 📦 Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd weekly_meals_planner
    ```
2. **Install dependencies**

    ```bash
    pnpm install
    ```
3. **Set up environment variables**

    ```bash
    cp .env.example .env.local
    ```

    Edit `.env.local`:

    ```bash
    # Required for JWT authentication
    NEXTAUTH_SECRET="your-secret-key-here"
    
    # Database configuration
    NODE_ENV="production"
    DATABASE_URL="postgresql://username:password@host:port/database"
    ```
4. **Initialize the database**

    ```bash
    # Option 1: Use generated SQL script (recommended)
    pnpm db:export-schema
    psql -d your_database -f database-schema-setup.sql
    
    # Option 2: Use Drizzle commands
    pnpm db:push
    ```
5. **Start the development server**

    ```bash
    pnpm dev
    ```
6. **Open your browser**
    Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

This project uses **PostgreSQL** exclusively with a comprehensive schema for meal planning.

### Quick Setup

1. **Create a PostgreSQL database** (local, Neon, Supabase, Railway, etc.)
2. **Generate the complete setup script**:
   ```bash
   pnpm db:export-schema
   ```
3. **Initialize your database**:
   ```bash
   psql -d your_database -f database-schema-setup.sql
   ```
4. **Login with admin credentials**:
   - Username: `admin`
   - Password: `admin` (change after first login!)

### Database Features

* **17 Tables**: Complete meal planning schema
* **2 Custom Enums**: Dietary restrictions and difficulty levels  
* **12 Indexes**: Performance optimized
* **Admin User**: Pre-configured admin account
* **Default Data**: Categories, tags, and sample ingredients

### Database Commands

```bash
# Export complete schema with data
pnpm db:export-schema

# Push schema to current database
pnpm db:push

# Generate migrations
pnpm db:generate

# View database in Drizzle Studio
pnpm db:studio

# Create database backup
pnpm db:backup
```

For detailed database documentation, see [DATABASE.md](./DATABASE.md).

## 🔐 Authentication

### Quick Test

Visit `/auth` to test the authentication system:

1. Register a new account
2. Login with your credentials
3. Change your password
4. View your profile

### API Usage

```typescript
import { authApi } from '@/lib/auth-client';

// Register
const response = await authApi.register('username', 'password');

// Login
const loginResponse = await authApi.login('username', 'password');

// Check if authenticated
const isLoggedIn = authApi.isAuthenticated();
```

For detailed authentication documentation, see [AUTHENTICATION.md](./AUTHENTICATION.md).

## 📁 Project Structure

### Root Directory Files (Preserved)
```
# Configuration Files
package.json              # Project dependencies and scripts
drizzle.config.ts         # Database ORM configuration
next.config.ts            # Next.js configuration
tsconfig.json             # TypeScript configuration
eslint.config.mjs         # ESLint configuration
postcss.config.mjs        # PostCSS configuration
vercel.json               # Vercel deployment configuration
middleware.ts             # Next.js middleware for auth

# Environment & Setup
.env.example              # Environment template
.env.local                # Local environment variables (git-ignored)
.gitignore                # Git ignore rules

# Documentation
README.md                 # This file - project overview
DATABASE.md               # Database setup and schema documentation
AUTHENTICATION.md         # Authentication system documentation

# Build & Dependencies
pnpm-lock.yaml            # Package manager lock file
next-env.d.ts             # Next.js TypeScript declarations
tsconfig.tsbuildinfo      # TypeScript build cache
```

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── health/        # Database health check
│   ├── auth/              # Authentication pages
│   ├── meal-planning/     # Meal planning interface
│   ├── recipes/           # Recipe management
│   ├── account/           # User account management
│   ├── admin/             # Admin interface
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── meal-planning/     # Meal planning components
│   ├── recipes/           # Recipe components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configuration
│   ├── db/                # Database configuration
│   │   ├── index.ts       # Database connection
│   │   ├── schema.ts      # PostgreSQL schema
│   │   ├── seed.ts        # Database seeding
│   │   └── migrations/    # Database migrations
│   ├── auth.ts            # Server-side auth utilities
│   ├── auth-client.ts     # Client-side auth utilities
│   ├── middleware.ts      # Authentication middleware
│   └── utils/             # General utilities
├── contexts/              # React contexts
│   ├── AuthContext.tsx    # Authentication context
│   └── ThemeContext.tsx   # Theme management
scripts/                   # Database and maintenance scripts
├── backup-database.js     # Database backup utility
public/                    # Static assets
├── icons/                 # PWA icons and favicons
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker
└── offline.html           # Offline page
```

### Database Files
```
src/lib/db/
├── index.ts               # Database connection and configuration
├── schema.ts              # Complete PostgreSQL schema
├── seed.ts                # Database seeding utilities
└── migrations/            # Drizzle migration files

scripts/
├── backup-database.js     # Comprehensive backup utility
├── export-database-schema.ts  # Schema export with admin setup
└── seed-admin.ts          # Admin user creation
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard:

    ```bash
    NEXTAUTH_SECRET="your-production-secret"
    NODE_ENV="production"
    DATABASE_URL="your-postgresql-url"
    ```
3. <strong>Deploy</strong>: Vercel will automatically build and deploy

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Database
pnpm db:push      # Push schema to database
pnpm db:generate  # Generate migrations
pnpm db:studio    # Open Drizzle Studio
pnpm db:backup    # Create database backup
```

### Database Schema

The project includes a comprehensive database schema for:

* **Users** \- User accounts and authentication
* **Meals** \- Individual meal entries
* **Ingredients** \- Ingredient database
* **Recipes** \- Recipe management
* **Meal Plans** \- Weekly meal planning
* **Shopping Lists** \- Auto\-generated shopping lists
* **Nutritional Goals** \- User nutritional targets

## 🔧 Environment Variables

| Variable | Description | Required | Default |
| -------- | ----------- | -------- | ------- |
| `NEXTAUTH_SECRET` | Secret key for JWT signing | Yes | - |
| `NODE_ENV` | Environment (should be "production") | Yes | production |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature-name`
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

* Built with [Next.js](https://nextjs.org/)
* Styled with [Tailwind CSS](https://tailwindcss.com/)
* Database powered by [Drizzle ORM](https://orm.drizzle.team/)
* Authentication using [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

## 📞 Support

If you have any questions or need help:

1. Check the [Authentication documentation](./AUTHENTICATION.md)
2. Open an issue on GitHub
3. Check the development server logs for errors

***

**Happy meal planning! 🍽️**