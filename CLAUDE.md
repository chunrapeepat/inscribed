# CLAUDE.md - Development Guide for Inscribed App

## Build Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm deploy` - Deploy to Firebase
- `pnpm lint` - Run ESLint for code quality
- `pnpm preview` - Preview production build

## Code Style Guidelines
- **TypeScript**: Strict typing, avoid any, use proper interfaces/types
- **React**: Functional components with TypeScript FC type
- **State Management**: Zustand for global state
- **CSS**: TailwindCSS for styling, with custom classes as needed
- **Imports**: Group imports by external/internal, sort alphabetically
- **Naming**: PascalCase for components, camelCase for variables/functions
- **File Structure**: Components in src/components, pages in src/pages
- **Canvas**: Excalidraw powers the drawing functionality
- **Error Handling**: Use try/catch for async operations, proper error states

## Key Libraries
- React 18+, TypeScript 5+
- Excalidraw for drawing canvas
- Zustand for state management
- TailwindCSS for styling