# Product Shot Generation Backend

FastAPI backend for generating professional product shots using AI background removal and generation.

## Features

- 🎨 **Background Removal**: Remove backgrounds using RMBG-2.0 model
- 🤖 **AI Background Generation**: Create custom backgrounds with DALL-E 3
- 🖼️ **Image Compositing**: Seamlessly blend products with generated backgrounds
- ⚡ **GPU Acceleration**: Automatic CUDA support for faster processing
- 🚀 **REST API**: Simple HTTP endpoints for easy integration

## Quick Start

### 1. Install Dependencies

```bash
# Install using uv (recommended)
uv sync

# Or using pip
pip install -r requirements.txt
```

### 2. Set Environment Variables (Optional)

For background generation, set your OpenAI API key:

```bash
export OPENAI_API_KEY="sk-your-api-key-here"
```

### 3. Run the Server

```bash
# Using uv
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Or directly with Python
python src/main.py
```

The API will be available at `http://localhost:8000`

### 4. View API Documentation

Once the server is running, visit:

- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/remove-bg` | POST | Remove background from image |
| `/generate-bg` | POST | Generate AI background with DALL-E 3 |
| `/mix` | POST | Composite product with background |

## Quick Test

### Test Background Removal

```bash
curl -X POST \
  -F "image=@your_product.jpg" \
  http://localhost:8000/remove-bg \
  -o result.json
```

### Test Background Generation

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt": "modern studio lighting"}' \
  http://localhost:8000/generate-bg \
  -o background.json
```

## Project Structure

```
backend/
├── src/
│   └── main.py           # FastAPI application
├── pyproject.toml        # Dependencies
├── requirements.txt      # Generated requirements
├── README.md            # This file
└── API_DOCUMENTATION.md # Detailed API docs
```

## System Requirements

- **Python**: 3.12 or higher
- **GPU**: Optional but recommended (CUDA-compatible)
- **Memory**: 4GB+ RAM (8GB+ recommended)
- **Disk**: 2GB for models

## Dependencies

Main dependencies:
- FastAPI - Web framework
- Uvicorn - ASGI server
- PyTorch - Deep learning framework
- Transformers - Model loading
- Pillow - Image processing
- OpenAI - DALL-E 3 integration

## Performance

- **First request**: 5-10 seconds (model loading)
- **Subsequent requests**: 1-2 seconds (CPU) / <1 second (GPU)
- **GPU speedup**: ~5-10x faster than CPU

## Documentation

For detailed API documentation, client examples, and workflow guides, see:

📖 **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)**

## Troubleshooting

### CUDA Out of Memory

If you encounter CUDA memory errors:

```python
# Edit src/main.py and change:
device = 'cpu'  # Force CPU usage
```

### Model Download Issues

Models are downloaded automatically on first run. If download fails:

```bash
# Pre-download the model
python -c "from transformers import AutoModelForImageSegmentation; AutoModelForImageSegmentation.from_pretrained('briaai/RMBG-2.0', trust_remote_code=True)"
```

### OpenAI API Key Not Working

Ensure your key is set:

```bash
# Check if set
echo $OPENAI_API_KEY

# Set temporarily
export OPENAI_API_KEY="sk-..."

# Or create a .env file
echo "OPENAI_API_KEY=sk-..." > .env
```

## License

See the main project LICENSE file.

## Credits

- Background removal: [RMBG-2.0](https://huggingface.co/briaai/RMBG-2.0) by BRIA AI
- Background generation: [DALL-E 3](https://openai.com/dall-e-3) by OpenAI
