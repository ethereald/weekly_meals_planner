# Weekly Meals Planner

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Package Manager**: pnpm
- **Deployment**: Optimized for Vercel

## Project Structure

```
src/
├── app/          # Next.js 15 App Router pages
│   └── api/     # API routes
├── components/   # Reusable UI components
│   └── ui/      # Base UI components
└── lib/         # Utility functions and shared code
    └── db/      # Database schema and utilities
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM. See [DATABASE.md](./DATABASE.md) for detailed setup instructions.

### Quick Database Setup

1. Set up your PostgreSQL database
2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Update `DATABASE_URL` in `.env.local`
4. Push database schema:
   ```bash
   pnpm db:push
   ```
5. Seed initial data:
   ```bash
   pnpm db:seed
   ```

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- pnpm package manager

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update the `DATABASE_URL` with your PostgreSQL connection string.

3. Set up the database:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Test the setup:
   Visit http://localhost:3000/api/health to check database connectivity.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
