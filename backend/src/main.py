import warnings
import base64
import os
from io import BytesIO
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageFilter
import torch
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv

# Ignore warnings
warnings.filterwarnings("ignore")

# Load environment variables
load_dotenv(find_dotenv())

# Global variables
device = None
model = None
transform_image = None
openai_client = None

# Pydantic models
class BackgroundRequest(BaseModel):
    prompt: str
    size: Optional[str] = "1024x1024"


class BackgroundResponse(BaseModel):
    background_image: str
    url: Optional[str] = None


class RemoveBackgroundResponse(BaseModel):
    mask: str
    image_with_alpha: str


class MixResponse(BaseModel):
    final_image: str


# Utility functions
def pil_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string with data URI prefix."""
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"


def base64_to_pil(b64_string: str) -> Image.Image:
    """Convert base64 string to PIL Image (handles data URI prefix)."""
    if b64_string.startswith("data:image"):
        b64_string = b64_string.split(",")[1]
    img_data = base64.b64decode(b64_string)
    return Image.open(BytesIO(img_data))


def bytes_to_pil(file_bytes: bytes) -> Image.Image:
    """Convert bytes to PIL Image."""
    return Image.open(BytesIO(file_bytes))


def composite_with_mask(
    foreground: Image.Image, background: Image.Image, mask: Image.Image
) -> Image.Image:
    """Composite foreground and background using mask with edge smoothing."""
    # Ensure all images are in the correct mode
    if foreground.mode != "RGBA":
        foreground = foreground.convert("RGBA")
    if background.mode != "RGB":
        background = background.convert("RGB")
    if mask.mode != "L":
        mask = mask.convert("L")

    # Resize background to match foreground dimensions
    if background.size != foreground.size:
        background = background.resize(foreground.size, Image.Resampling.LANCZOS)

    # Resize mask to match foreground dimensions
    if mask.size != foreground.size:
        mask = mask.resize(foreground.size, Image.Resampling.LANCZOS)

    # Apply slight blur to mask edges for smoother blending
    mask = mask.filter(ImageFilter.GaussianBlur(radius=2))

    # Convert background to RGBA
    background = background.convert("RGBA")

    # Composite the images
    result = Image.composite(foreground, background, mask)

    return result


def remove_background_from_image(image: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Remove background from image and return mask and image with alpha channel."""
    global model, transform_image, device

    # Store original size
    original_size = image.size

    # Convert to RGB if necessary
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Transform and prepare for model
    input_tensor = transform_image(image).unsqueeze(0).to(device)

    # Prediction
    with torch.no_grad():
        preds = model(input_tensor)[-1].sigmoid().cpu()

    # Process prediction
    pred = preds[0].squeeze()
    pred_pil = transforms.ToPILImage()(pred)
    mask = pred_pil.resize(original_size, Image.Resampling.LANCZOS)

    # Create image with alpha channel
    image_with_alpha = image.copy()
    image_with_alpha.putalpha(mask)

    return mask, image_with_alpha


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize models and resources on startup."""
    global device, model, transform_image, openai_client

    print("🚀 Starting up Product Shot Generation API...")

    # Initialize device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"📱 Using device: {device}")

    # Load RMBG model
    print("🔧 Loading RMBG-2.0 model...")
    model = AutoModelForImageSegmentation.from_pretrained(
        "briaai/RMBG-2.0", trust_remote_code=True
    )
    model.eval().to(device)
    print("✅ RMBG-2.0 model loaded successfully")

    # Setup image transformation
    image_size = (1024, 1024)
    transform_image = transforms.Compose(
        [
            transforms.Resize(image_size),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )

    # Initialize OpenAI client
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        openai_client = OpenAI(api_key=api_key)
        print("✅ OpenAI client initialized")
    else:
        print("⚠️  Warning: OPENAI_API_KEY not found in environment variables")

    print("🎉 API ready to handle requests!")
    yield
    print("🛑 Shutting down Product Shot Generation API...")
    if model:
        del model
    if transform_image:
        del transform_image
    if openai_client:
        del openai_client
    if device:
        del device


# FastAPI app
app = FastAPI(
    title="Product Shot Generation API",
    description="API for removing backgrounds, generating backgrounds with AI, and compositing images",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "Product Shot Generation API is running",
        "endpoints": ["/remove-bg", "/generate-bg", "/mix"],
    }


# Endpoint 1: Remove background
@app.post("/remove-bg", response_model=RemoveBackgroundResponse)
async def remove_background_endpoint(image: UploadFile = File(...)):
    """
    Remove background from an uploaded image.

    Returns both the mask and the image with alpha channel.
    """
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read and process image
        contents = await image.read()
        pil_image = bytes_to_pil(contents)

        # Remove background
        mask, image_with_alpha = remove_background_from_image(pil_image)

        # Convert to base64
        mask_b64 = pil_to_base64(mask)
        image_alpha_b64 = pil_to_base64(image_with_alpha)

        return RemoveBackgroundResponse(mask=mask_b64, image_with_alpha=image_alpha_b64)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


# Endpoint 2: Generate background
@app.post("/generate-bg", response_model=BackgroundResponse)
async def generate_background(request: BackgroundRequest):
    """
    Generate a background image using OpenAI DALL-E 3.

    Requires OPENAI_API_KEY environment variable to be set.
    """
    global openai_client

    if not openai_client:
        raise HTTPException(
            status_code=503,
            detail="OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.",
        )

    try:
        # Validate size
        valid_sizes = ["1024x1024", "1024x1792", "1792x1024"]
        if request.size not in valid_sizes:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid size. Must be one of: {', '.join(valid_sizes)}",
            )

        # Generate image with DALL-E 3
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=f"Generate a background image for a product shot with the following prompt: {request.prompt}",
            size=request.size,
            quality="standard",
            response_format="b64_json",
            n=1,
        )

        # Format base64 with data URI prefix to match other endpoints
        b64_data = response.data[0].b64_json
        formatted_image = f"data:image/png;base64,{b64_data}"

        return BackgroundResponse(background_image=formatted_image, url=None)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating background: {str(e)}"
        )


# Endpoint 3: Mix images
@app.post("/mix", response_model=MixResponse)
async def mix_images(
    image: UploadFile = File(
        ..., description="Product image with alpha channel (RGBA)"
    ),
    mask: UploadFile = File(..., description="Mask image (grayscale)"),
    background: UploadFile = File(..., description="Background image"),
):
    """
    Composite the product image with the generated background using the mask.

    All three images should be uploaded as files.
    """
    try:
        # Validate file types
        for file in [image, mask, background]:
            if not file.content_type or not file.content_type.startswith("image/"):
                raise HTTPException(
                    status_code=400, detail=f"File {file.filename} must be an image"
                )

        # Read all images
        image_contents = await image.read()
        mask_contents = await mask.read()
        background_contents = await background.read()

        # Convert to PIL images
        pil_image = bytes_to_pil(image_contents)
        pil_mask = bytes_to_pil(mask_contents)
        pil_background = bytes_to_pil(background_contents)

        # Composite images
        final_image = composite_with_mask(pil_image, pil_background, pil_mask)

        # Convert to base64
        final_b64 = pil_to_base64(final_image)

        return MixResponse(final_image=final_b64)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error mixing images: {str(e)}")
