# Email Address Scraper

A robust web application designed to recursively scrape websites securely and efficiently for nested email addresses. Built with a React/Vite frontend using modern Tailwind CSS design, and an Express Node.js backend using Server-Sent Events to pipe discovered emails organically back to the browser in real-time.

## Project Structure

This project follows a modern monorepo layout logic. It acts as one application separated into two specific directories:

- `frontend/` - Contains the React Vite SPA. Responsible for rendering the UI, taking target inputs, drawing results, and maintaining connection listeners over SSE streams.
- `backend/` - Contains the Express node service. Processes recursion tasks relying on `axios` for routing networks and following redirects, and `cheerio` for mapping HTML node elements to fetch links and execute custom Regex queries against raw payload bodies.

## Prerequisites
- **Node.js** (v18.x or above natively recommended)
- **npm** (Node package manager)

## Installation & Running

Follow these instructions to quickly boot the application from a raw source folder.

### 1. Booting the Backend Server

Navigate into the backend directory relative to the repository root:
```bash
cd backend
npm install
npm start
```
The backend API handles all requests universally bound to `http://localhost:3001`.

Use the API directly:

http://localhost:3001/api/scrape?url=https://google.com&maxDepth=1


### 2. Booting the Frontend Client

Open a completely separate terminal tab to maintain dual lifecycles simultaneously, and execute:
```bash
cd frontend
npm install
npm run dev
```
The interface is visible actively at standard vite deployment port `http://localhost:5173`.

> [!TIP]
> Navigating directly to the local host vite server handles everything you need. Ensure no firewalls are aggressively blocking cross-origin connections between `5173` and `3001`!

## Running the Verification Test Suites

Both the frontend and the backend implement rigorous unit tests using `Jest` inside the backend architecture, and high-performance `Vitest` rendering React DOM components explicitly in the frontend layout.

### Backend Tests

To inspect scraping bounds handling and test API connection logics iteratively:

```bash
cd backend
npm test
```

### Frontend Tests

To run the Vitest engine against the App interfaces safely:

```bash
cd frontend
npm test
```
