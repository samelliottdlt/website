# Project Overview

This is a personal website that serves as a portfolio and houses various miscellaneous side projects and interactive tools on whatever I find interesting, useful, or cool. The site is built with modern React/Next.js practices and hosts several diverse projects including calculators, games, utilities, and a blog system.

## Repository Structure

- `/app/`: Next.js App Router pages and components using the new app directory structure
  - `layout.tsx`: Root layout with navigation and analytics
  - `page.tsx`: Homepage with simple greeting and decorative elements
  - `about-me/`: Personal information and bio page
  - `blog/`: MDX-powered blog system with syntax highlighting and post management
  - **Project directories**: Each tool/calculator/game lives in its own directory (e.g., `fusion-calculator/`, `smoothie-calculator/`). New projects should follow this pattern with kebab-case naming.
- `/components/`: Reusable React components (PascalCase naming)
- `/posts/`: MDX blog posts with frontmatter
- `/lib/`: Shared utility functions
- `/styles/`: Global CSS and styling
- `/public/`: Static assets including favicon variants and SVG illustrations
- `/__tests__/`: Jest test files

## Project Types and Patterns

This site hosts various types of interactive projects:
- **Calculators**: Tools that help users compute or determine something (fusion calculator, smoothie calculator)
- **Games**: Interactive entertainment projects
- **Utilities**: Simple tools for generating or manipulating data (random string generator)
- **Informational**: Pages that display curated content (game of the year)

When adding new projects, follow the established pattern of creating a dedicated directory under `/app/` with:
- `page.tsx`: Main component (prefer server components; push interactivity to leaf components)
- `util.ts`: Project-specific logic and calculations (colocate with usage when possible)
- Data files in JSON format (if needed)

## Technology Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS 4+
- **Content**: MDX for blog posts with gray-matter for frontmatter parsing
- **UI Components**: Headless UI for accessible components
- **Icons**: Heroicons for consistent iconography
- **Testing**: Jest with TypeScript support
- **Code Quality**: ESLint, Prettier, and TypeScript for code consistency

## Coding Standards and Conventions

- Use TypeScript for all new code with proper type definitions
- Follow Next.js App Router conventions (server/client components)
- Use functional components with React hooks
- Use Tailwind CSS classes for styling (avoid custom CSS when possible)
- Component names should be PascalCase
- File names should match component names
- Use ESLint and Prettier for code quality and formatting. ESLint is a linting tool that checks for code errors and enforces coding standards; it runs automatically before builds. Prettier is a code formatter that ensures consistent styling; it must be run manually, typically before committing changes.
- Write meaningful component and function names
- Use proper TypeScript interfaces or types (prefer types) for props and data structures
- Prefer small and composable functions that can be reused

## File and Directory Naming

- Pages use kebab-case for URLs (`fusion-calculator`, `game-of-the-year`)
- Components use PascalCase (`Navbar.tsx`, `YoutubeEmbed.tsx`)
- Utility files use camelCase (`util.ts`, `parser.tsx`)
- JSON data files use kebab-case (`card.json`, `ingredients.json`)

## Component Patterns

- Server components by default for static content and data fetching
- Push "use client" directive to the edges of the component tree to maximize server-side rendering
- Keep top-level pages as server components when possible; move interactivity to leaf components
- Props should be properly typed with TypeScript interfaces
- Use React.Fragment or `<>` for multiple elements without wrapper divs
- Implement proper error boundaries and loading states

## Code Organization

- Colocate utility functions with their usage when possible
- Move utility functions to `/lib/` only for very general-purpose functions that can be used across multiple pages
- Prefer project-specific utility files over populating a single generic util file

## Data and State Management

- Lean towards using local state management with useState and useReducer hooks
- JSON files for static data (cards, ingredients, game data)
- MDX with frontmatter for blog content
- Use useMemo for expensive calculations

## Styling Guidelines

- Tailwind CSS utility classes for all styling
- Responsive design using Tailwind's responsive prefixes
- Consistent spacing and color schemes
- Dark/light mode considerations (check existing implementations)

## Testing

- Jest configuration with TypeScript support
- Test files in `__tests__/` directory with `.spec.ts` extension
- Write unit tests for core logic and complex calculations of any new additions
- Focus on testing utility functions and business logic
- Use meaningful test descriptions and assertions
- Test edge cases and error conditions

## Development Workflow

- `npm run dev`: Start development server with hot reload
- `npm run build`: Production build (includes automatic linting)
- `npm run lint`: Run ESLint checks
- `npm run prettier`: Check code formatting
- `npm run test`: Run Jest test suite
- Vercel deployment for production hosting

## Performance Considerations

- Implement proper loading states for dynamic content
- Use React.memo for expensive re-renders when appropriate
- Consider code splitting for large interactive components
