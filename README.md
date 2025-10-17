# Workflow Builder UI

## Prerequisites

- Node.js 18+ and npm 9+ installed

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Configure environment variables by creating a `.env` file in the project root:

   ```
   VITE_API_BASE=http://localhost:8000/api
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the app: `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The build output will be generated in `dist/`.

## Preview Production Build

```bash
npm run preview
```

This serves the content from `dist/` locally for verification.

## Project Scripts

- `npm run dev`: Start Vite dev server
- `npm run build`: Type-check with TypeScript and build with Vite
- `npm run preview`: Preview the production build

## Folder Structure

- `src/`: Application source code
- `src/pages/`: Pages like `Home` and `WorkflowBuilder`
- `src/components/`: UI components
- `src/store/`: State management with Zustand
- `src/api/`: API utilities
- `src/styles/`: Stylesheets

## Notes

- Ensure the backend API (if any) is reachable at `VITE_API_BASE`.
- If the dev server port is in use, Vite will select another port and print it in the console.
