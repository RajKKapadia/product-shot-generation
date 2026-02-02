# Product Shot Generation - Frontend

A modern Next.js application for creating professional product shots with AI-powered background removal and generation.

## Features

- **Step-by-step wizard interface** - Guided workflow from upload to final image
- **Background removal** - AI-powered background removal using the backend API
- **Background generation** - Generate custom backgrounds using AI based on text prompts
- **Background upload** - Upload your own background images
- **Black & white design** - Clean, professional monochrome UI
- **shadcn/ui components** - Built with high-quality, accessible components

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **React Context** - State management for wizard flow

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- Backend API running on `http://localhost:8000` (or configure `NEXT_PUBLIC_API_URL`)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
pnpm start
```

## Application Flow

1. **Home Page** (`/`) - Introduction and "Get Started" button
2. **Upload Page** (`/upload`) - Upload product image and remove background
3. **Background Page** (`/background`) - Choose or generate background
4. **Final Page** (`/final`) - View composite result and download

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── upload/               # Upload & background removal
│   ├── background/           # Background selection/generation
│   ├── final/                # Final result & download
│   ├── layout.tsx            # Root layout with WizardProvider
│   └── globals.css           # Global styles & theme
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── ProgressStepper.tsx   # Wizard step indicator
│   ├── ImagePreview.tsx      # Image display component
│   └── FileUpload.tsx        # Drag & drop file upload
├── contexts/
│   └── WizardContext.tsx     # Wizard state management
└── lib/
    ├── api.ts                # API client functions
    ├── types.ts              # TypeScript types
    └── utils.ts              # Utility functions (shadcn)
```

## API Integration

The frontend communicates with the backend API through three main endpoints:

- `POST /remove-bg` - Remove background from uploaded image
- `POST /generate-bg` - Generate background using AI
- `POST /mix` - Composite foreground with background

See `src/lib/api.ts` for implementation details.

## Design System

### Colors
- **Black**: `#000000` - Primary actions, text, borders
- **White**: `#FFFFFF` - Backgrounds, text on dark
- **Grayscale**: Subtle UI elements and hover states

### Typography
- **Geist Sans** - Primary font
- **Geist Mono** - Monospace font

### Components
All UI components use shadcn/ui for consistency and accessibility, themed to match the monochrome design.

## Development

### Adding New shadcn Components

```bash
npx shadcn@latest add [component-name]
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm type-check
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: `http://localhost:8000`)

## License

MIT
