![Weekly Meals Planner Logo](./public/icons/icon.svg)

# Weekly Meals Planner

A comprehensive meal planning application built with Next.js 15, TypeScript, and Tailwind CSS. Features multi-user authentication, dual database support (SQLite for development, PostgreSQL for production), and a complete meal planning system.

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
* <strong>Database</strong>: SQLite (development) / PostgreSQL (production)
* <strong>ORM</strong>: Drizzle ORM
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
    NODE_ENV="development"  # Uses SQLite for development
    
    # For production (PostgreSQL)
    # NODE_ENV="production"
    # DATABASE_URL="postgresql://username:password@host:port/database"
    ```
4. **Initialize the database**

    ```bash
    pnpm db:push
    ```
5. **Start the development server**

    ```bash
    pnpm dev
    ```
6. **Open your browser**
    Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

This project supports dual database environments:

### Local Development (SQLite)

* <strong>Automatic</strong>: Works out of the box with `NODE_ENV="development"`
* <strong>File</strong>: Database stored in `./sqlite.db`
* <strong>No setup required</strong>: Database file is created automatically

### Production (PostgreSQL)

1. **Set up PostgreSQL** (e.g., on Vercel, Railway, or Supabase)
2. <strong>Update environment variables</strong>:

    ```bash
    NODE_ENV="production"
    DATABASE_URL="postgresql://username:password@host:port/database"
    ```
3. <strong>Push schema to production</strong>:

    ```bash
    pnpm db:push
    ```

### Database Commands

```bash
# Push schema to current database
pnpm db:push

# Generate migrations
pnpm db:generate

# View database in Drizzle Studio
pnpm db:studio
```

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

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   ├── auth/              # Authentication demo page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   └── auth/              # Authentication components
├── lib/                   # Utilities and configuration
│   ├── db/                # Database configuration
│   │   ├── db.ts          # Database setup
│   │   └── schema.ts      # Database schema
│   ├── auth.ts            # Server-side auth utilities
│   ├── auth-client.ts     # Client-side auth utilities
│   ├── middleware.ts      # Authentication middleware
│   └── utils.ts           # General utilities
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
| `NODE_ENV` | Environment (development/production) | Yes | development |
| `DATABASE_URL` | PostgreSQL connection string | Production only | - |

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