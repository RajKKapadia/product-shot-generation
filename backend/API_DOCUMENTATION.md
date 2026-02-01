# Product Shot Generation API Documentation

## Overview

This FastAPI application provides three endpoints for generating professional product shots by removing backgrounds, generating AI backgrounds, and compositing images.

## Base URL

```
http://localhost:8000
```

## Setup

### Installation

```bash
cd backend
uv sync
```

### Environment Variables

- `OPENAI_API_KEY` (required for `/generate-bg` endpoint)

### Running the Server

```bash
cd backend
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Or simply:

```bash
cd backend
python src/main.py
```

## Endpoints

### 1. Health Check

**GET** `/`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Product Shot Generation API is running",
  "endpoints": ["/remove-bg", "/generate-bg", "/mix"]
}
```

---

### 2. Remove Background

**POST** `/remove-bg`

Remove the background from an uploaded image using the RMBG-2.0 model.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: 
  - `image`: Image file (JPEG, PNG)

**cURL Example:**
```bash
curl -X POST \
  -F "image=@your_image.jpg" \
  http://localhost:8000/remove-bg \
  -o response.json
```

**Response:**
```json
{
  "mask": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "image_with_alpha": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Response Fields:**
- `mask`: Base64-encoded grayscale mask image (PNG)
- `image_with_alpha`: Base64-encoded RGBA image with transparency (PNG)

**Status Codes:**
- `200`: Success
- `400`: Invalid file type or format
- `500`: Server error during processing

---

### 3. Generate Background

**POST** `/generate-bg`

Generate a background image using OpenAI's DALL-E 3 model.

**Requirements:**
- `OPENAI_API_KEY` environment variable must be set

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:
```json
{
  "prompt": "beautiful beach sunset with palm trees",
  "size": "1024x1024"  // optional, default: "1024x1024"
}
```

**Valid Sizes:**
- `1024x1024` (default)
- `1024x1792` (portrait)
- `1792x1024` (landscape)

**cURL Example:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt": "modern minimalist studio with white background", "size": "1024x1024"}' \
  http://localhost:8000/generate-bg \
  -o background_response.json
```

**Response:**
```json
{
  "background_image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "url": "https://oaidalleapiprodscus.blob.core.windows.net/..."
}
```

**Response Fields:**
- `background_image`: Base64-encoded generated background (PNG)
- `url`: Original OpenAI image URL (temporary, expires after ~1 hour)

**Status Codes:**
- `200`: Success
- `400`: Invalid size or prompt
- `503`: OpenAI client not initialized (missing API key)
- `500`: Server error or OpenAI API error

---

### 4. Mix Images

**POST** `/mix`

Composite a product image with a background using a mask.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `image`: Product image with alpha channel (RGBA PNG)
  - `mask`: Grayscale mask image (PNG)
  - `background`: Background image (JPEG/PNG)

**cURL Example:**
```bash
curl -X POST \
  -F "image=@product_alpha.png" \
  -F "mask=@mask.png" \
  -F "background=@background.jpg" \
  http://localhost:8000/mix \
  -o final_response.json
```

**Response:**
```json
{
  "final_image": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Response Fields:**
- `final_image`: Base64-encoded composited final image (PNG)

**Processing Details:**
- Background is resized to match product image dimensions
- Mask is resized to match product image dimensions
- Gaussian blur (radius=2) applied to mask edges for smoother blending
- Images composited using PIL's `Image.composite()` method

**Status Codes:**
- `200`: Success
- `400`: Invalid file type or format
- `500`: Server error during compositing

---

## Complete Workflow Example

### Step 1: Remove Background

```bash
# Upload product image
curl -X POST \
  -F "image=@product.jpg" \
  http://localhost:8000/remove-bg \
  -o step1_response.json

# Extract the images (using jq or Python)
jq -r '.mask' step1_response.json | base64 -d > mask.png
jq -r '.image_with_alpha' step1_response.json | base64 -d > product_alpha.png
```

### Step 2: Generate Background

```bash
# Generate AI background
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt": "luxury marble surface with soft lighting"}' \
  http://localhost:8000/generate-bg \
  -o step2_response.json

# Extract background
jq -r '.background_image' step2_response.json | base64 -d > background.png
```

### Step 3: Mix Images

```bash
# Create final composite
curl -X POST \
  -F "image=@product_alpha.png" \
  -F "mask=@mask.png" \
  -F "background=@background.png" \
  http://localhost:8000/mix \
  -o step3_response.json

# Extract final image
jq -r '.final_image' step3_response.json | base64 -d > final_product_shot.png
```

---

## Python Client Example

```python
import requests
import base64
from io import BytesIO
from PIL import Image

BASE_URL = "http://localhost:8000"

def remove_background(image_path):
    """Remove background from image."""
    with open(image_path, 'rb') as f:
        response = requests.post(
            f"{BASE_URL}/remove-bg",
            files={"image": f}
        )
    response.raise_for_status()
    return response.json()

def generate_background(prompt, size="1024x1024"):
    """Generate background using DALL-E."""
    response = requests.post(
        f"{BASE_URL}/generate-bg",
        json={"prompt": prompt, "size": size}
    )
    response.raise_for_status()
    return response.json()

def mix_images(image_path, mask_path, background_path):
    """Composite images together."""
    with open(image_path, 'rb') as img, \
         open(mask_path, 'rb') as mask, \
         open(background_path, 'rb') as bg:
        response = requests.post(
            f"{BASE_URL}/mix",
            files={
                "image": img,
                "mask": mask,
                "background": bg
            }
        )
    response.raise_for_status()
    return response.json()

def base64_to_image(b64_string):
    """Convert base64 string to PIL Image."""
    if b64_string.startswith("data:image"):
        b64_string = b64_string.split(",")[1]
    img_data = base64.b64decode(b64_string)
    return Image.open(BytesIO(img_data))

# Example usage
if __name__ == "__main__":
    # Step 1: Remove background
    result1 = remove_background("product.jpg")
    mask_img = base64_to_image(result1["mask"])
    alpha_img = base64_to_image(result1["image_with_alpha"])
    mask_img.save("mask.png")
    alpha_img.save("product_alpha.png")
    
    # Step 2: Generate background
    result2 = generate_background("modern studio with soft lighting")
    bg_img = base64_to_image(result2["background_image"])
    bg_img.save("background.png")
    
    # Step 3: Mix images
    result3 = mix_images("product_alpha.png", "mask.png", "background.png")
    final_img = base64_to_image(result3["final_image"])
    final_img.save("final_product_shot.png")
    
    print("✅ Product shot generation complete!")
```

---

## JavaScript/TypeScript Client Example

```typescript
// Step 1: Remove background
async function removeBackground(imageFile: File) {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch('http://localhost:8000/remove-bg', {
    method: 'POST',
    body: formData,
  });
  
  return await response.json();
}

// Step 2: Generate background
async function generateBackground(prompt: string, size = '1024x1024') {
  const response = await fetch('http://localhost:8000/generate-bg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, size }),
  });
  
  return await response.json();
}

// Step 3: Mix images
async function mixImages(imageFile: File, maskFile: File, backgroundFile: File) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('mask', maskFile);
  formData.append('background', backgroundFile);
  
  const response = await fetch('http://localhost:8000/mix', {
    method: 'POST',
    body: formData,
  });
  
  return await response.json();
}

// Helper: Convert base64 to Blob
function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

// Example usage
async function createProductShot(productImage: File) {
  // Remove background
  const { mask, image_with_alpha } = await removeBackground(productImage);
  
  // Generate background
  const { background_image } = await generateBackground(
    'professional studio with soft lighting'
  );
  
  // Convert base64 to Files for mixing
  const maskBlob = base64ToBlob(mask);
  const alphaBlob = base64ToBlob(image_with_alpha);
  const bgBlob = base64ToBlob(background_image);
  
  const maskFile = new File([maskBlob], 'mask.png');
  const alphaFile = new File([alphaBlob], 'alpha.png');
  const bgFile = new File([bgBlob], 'background.png');
  
  // Mix images
  const { final_image } = await mixImages(alphaFile, maskFile, bgFile);
  
  return final_image; // base64 data URL
}
```

---

## Performance Notes

- **First Request**: May take 5-10 seconds as the RMBG-2.0 model loads into memory
- **Subsequent Requests**: ~1-2 seconds for background removal
- **GPU Acceleration**: Automatically uses CUDA if available (significantly faster)
- **Background Generation**: 10-30 seconds depending on OpenAI API response time

## Model Information

- **Background Removal**: RMBG-2.0 by BRIA AI
- **Background Generation**: DALL-E 3 by OpenAI
- **Image Processing**: PIL (Pillow)

## Error Handling

All endpoints return proper HTTP status codes and error messages:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common error codes:
- `400`: Bad request (invalid input)
- `500`: Internal server error
- `503`: Service unavailable (e.g., missing API key)

## License

This API uses:
- RMBG-2.0 model (check BRIA AI license terms)
- OpenAI DALL-E 3 (requires valid API key and credits)
