import os
from dotenv import load_dotenv
from typing import List
from huggingface_hub import InferenceClient

load_dotenv()

HF_API_KEY = os.getenv("HF_API_KEY") or os.getenv("HF_TOKEN")
if not HF_API_KEY:
    raise RuntimeError("HF_API_KEY or HF_TOKEN environment variable not set")

# Initialize InferenceClient
_client = InferenceClient(token=HF_API_KEY)

def embed_text(text: str) -> List[float]:
    """Return a 384‑dim embedding for the given text using the Hugging Face InferenceClient."""
    try:
        embedding = _client.feature_extraction(
            text=text,
            model="sentence-transformers/all-MiniLM-L6-v2"
        )
        # Verify result is a list
        if isinstance(embedding, list):
            if len(embedding) > 0 and isinstance(embedding[0], list):
                return embedding[0]
            return embedding
        # If it returns numpy array, convert to list
        import numpy as np
        if isinstance(embedding, np.ndarray):
            if len(embedding.shape) > 1:
                return embedding[0].tolist()
            return embedding.tolist()
        raise RuntimeError(f"Unexpected embedding type: {type(embedding)}")
    except Exception as e:
        if "Inference Providers" in str(e) or "authentication" in str(e).lower() or "403" in str(e):
            raise RuntimeError(
                "Hugging Face Token Permission Error: Your access token lacks "
                "'Make calls to Inference Providers' permission. Please enable this scope "
                "under settings at https://huggingface.co/settings/tokens or use a standard 'Read' token."
            )
        raise RuntimeError(f"Embedding failed: {e}")

