# Scriba ✍️

Smart note-taking platform with markdown support, intelligent groupings, and a clean dark UI.

## Stack

- **Frontend**: React + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (via better-sqlite3)
- **Testing**: Vitest + React Testing Library

## Getting Started

```bash
# Install root dependencies
npm install

# Install all dependencies
cd server && npm install && cd ../client && npm install && cd ..

# Run in development mode
npm run dev

# Run tests
npm run test
```

## Git Flow

- `main` — production-ready code
- `develop` — integration branch
- `feature/*` — feature branches (branch off develop)
- `hotfix/*` — urgent fixes (branch off main)

## Project Structure

```
scriba/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── styles/
│   └── ...
├── server/          # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── database/
│   └── ...
└── package.json     # Root monorepo config
```
