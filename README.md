# Product Shot Generation

AI-powered tool for creating professional product photos with custom backgrounds.

## Features

- **Background Removal** — Automatically removes backgrounds from product images using RMBG-2.0
- **AI Background Generation** — Creates custom backgrounds using OpenAI DALL-E 3
- **Image Compositing** — Seamlessly blends products with generated backgrounds

## Tech Stack

**Frontend**
- Next.js 16 / React 19
- TypeScript
- Tailwind CSS
- Radix UI

**Backend**
- FastAPI
- PyTorch / Transformers
- RMBG-2.0 (briaai)
- OpenAI API

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- OpenAI API key

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Start the server
python run.py
```

The API will be available at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/remove-bg` | POST | Remove background from an image |
| `/generate-bg` | POST | Generate a background using DALL-E 3 |
| `/mix` | POST | Composite product with background |

## Usage

1. **Upload** — Select a product image
2. **Remove Background** — AI automatically isolates the product
3. **Generate Background** — Describe your desired background
4. **Download** — Save your professional product shot

## License

MIT
