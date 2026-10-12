# Agent Configuration for React Learning App

## Commands
- **Dev**: `npm run dev` (starts Vite dev server on port 3000)
- **Build**: `npm run build` (Vite production build)
- **Test**: `npm run test` (Vitest test runner with jsdom)
- **Test Single**: `npm run test -- FileName.test.jsx` (run specific test file)
- **Lint**: `npm run lint` (ESLint with React hooks rules)

## Architecture
- **Frontend**: React 19 + Vite + React Router DOM
- **UI**: React Bootstrap 5.3 + Bootstrap Icons
- **Auth**: Firebase Authentication with Google OAuth
- **Charts**: Recharts for data visualization
- **Speech**: react-speech-recognition for pronunciation features
- **Testing**: Vitest + Testing Library + jsdom environment

## Code Style
- **Components**: PascalCase (Login.jsx), default export
- **Imports**: React first, then libraries, then local imports
- **State**: useState hooks with descriptive names (`email`, `password`, `error`, `loading`)
- **Handlers**: `handle` prefix (handleSubmit, handleGoogleSignIn)
- **Styling**: Inline styles for custom components, Bootstrap classes for layout
- **Error Handling**: try/catch with user-friendly error messages
- **Loading States**: Separate loading states for different async operations
