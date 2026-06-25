import os
from dotenv import load_dotenv
from typing import List, Dict
from huggingface_hub import InferenceClient

load_dotenv()

# Hugging Face API configuration – uses the HF_API_KEY environment variable.
HF_API_KEY = os.getenv("HF_API_KEY") or os.getenv("HF_TOKEN")
if not HF_API_KEY:
    raise RuntimeError("HF_API_KEY or HF_TOKEN environment variable not set")

# Initialize InferenceClient
_client = InferenceClient(token=HF_API_KEY)

# System prompt guiding the LLM to answer based on provided context only.
SYSTEM_PROMPT = (
    "You are a friendly, professional codebase assistant. First, analyze the user's input:\n"
    "1. If the user is greeting you (e.g., 'hello', 'hi'), thanking you (e.g., 'thank you', 'thanks'), "
    "expressing gratitude, or engaging in casual/general chitchat, respond warmly and conversationally as a helpful assistant. "
    "Do NOT refer to the codebase context or try to find code matching these conversational phrases.\n"
    "2. If the user is asking a technical question about the codebase, answer it clearly and accurately using ONLY the provided codebase context. "
    "Explain functions, classes, modules, and business logic. Mention specific source file names and function names. "
    "If the context does not contain the answer or you lack information, state clearly that you don't know based on the uploaded code. Never hallucinate code or explanations."
)

def call_llm(question: str, contexts: List[Dict]) -> str:
    """Send the messages payload to Hugging Face chat completion endpoint using InferenceClient."""
    context_text = ""
    for ctx in contexts:
        context_text += (
            f"File: {ctx.get('file_path')}\n"
            f"Chunk name: {ctx.get('name')} ({ctx.get('chunk_type')})\n"
            f"{ctx.get('code_content')}\n"
            f"--- END FILE: {ctx.get('file_path')} ---\n\n"
        )
    
    user_content = f"Context:\n{context_text}\n\nQuestion: {question}"
    
    try:
        response = _client.chat_completion(
            model="meta-llama/Meta-Llama-3-8B-Instruct",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            max_tokens=1024,
            temperature=0.2
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        if "Inference Providers" in str(e) or "authentication" in str(e).lower() or "403" in str(e):
            raise RuntimeError(
                "Hugging Face Token Permission Error: Your access token lacks "
                "'Make calls to Inference Providers' permission. Please enable this scope "
                "under settings at https://huggingface.co/settings/tokens or use a standard 'Read' token."
            )
        raise RuntimeError(f"LLM call failed: {e}")
