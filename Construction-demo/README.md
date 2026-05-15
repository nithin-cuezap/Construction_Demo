# Construction Demo - Tender Package Management System

A modern React application for managing construction tender packages, contractor selection, bid invitations, and contract awarding workflows.

## Features

- **Tender Package Management**: Create and manage construction tender packages
- **Contractor Selection**: Review and shortlist subcontractors for work items
- **Bid Invitation**: Send invitations and track bidding status
- **Contract Awarding**: Award contracts and manage decision workflows
- **Offline Support**: Full offline functionality with IndexedDB persistence
- **PWA Ready**: Progressive Web App capabilities for mobile and desktop

## Technology Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Dexie.js** for IndexedDB persistence
- **@dnd-kit** for drag-and-drop functionality

## Data Persistence

The application uses **IndexedDB** (via Dexie.js) for automatic data persistence:

- All data is saved locally in your browser
- Works offline - no internet connection required after first load
- Data persists across browser sessions and refreshes
- Automatically syncs all changes in the background

### Data Management

- Data is stored in an in-memory cache for fast synchronous access
- All changes automatically persist to IndexedDB
- On startup, data is loaded from IndexedDB if available
- First run initializes with demo/seed data

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── mockDb.ts           # Main database API with IndexedDB persistence
├── indexedDb.ts        # Dexie.js wrapper for IndexedDB operations
├── types.ts            # TypeScript type definitions
├── *.ops.ts            # Data operations layer (business logic)
├── components/         # Reusable UI components
├── views/              # Page-level components
├── contexts/           # React context providers
└── initial-data/       # Seed data for first run
```

## Architecture

The application follows a strict data layer separation:

- **`.ops.ts` files**: Data operations, business logic, database access
- **`.tsx` files**: UI components, React state, user interactions
- **`mockDb`**: In-memory database with automatic IndexedDB persistence

See [mockdb.instructions.md](./mockdb.instructions.md) for detailed data management rules.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
