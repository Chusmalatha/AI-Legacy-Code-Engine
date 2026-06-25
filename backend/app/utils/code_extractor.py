import re
import ast
from pathlib import Path
import uuid
from typing import List, Dict

# Mapping of file extensions to language identifiers
EXTENSION_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".go": "go",
    ".rs": "rust",
    ".php": "php",
}

# Simple regex patterns for extraction per language
PATTERNS = {
    "python": {
        "function": re.compile(r"^\s*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("),
        "class": re.compile(r"^\s*class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[:(]")
    },
    "javascript": {
        "function": re.compile(r"function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("),
        "class": re.compile(r"class\s+([A-Z][a-zA-Z0-9_]*)")
    },
    "typescript": {
        "function": re.compile(r"function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("),
        "class": re.compile(r"class\s+([A-Z][a-zA-Z0-9_]*)")
    },
    "java": {
        "class": re.compile(r"class\s+([A-Z][a-zA-Z0-9_]*)"),
        "method": re.compile(r"(?:public|protected|private|static|final|synchronized)\s+[\w<>\[\]]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("),
    },
    "c": {
        "function": re.compile(r"^[\w\*]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("),
    },
    "cpp": {
        "function": re.compile(r"^[\w\*]+\s+([a-zA-Z_:][a-zA-Z0-9_:]*)\s*\("),
        "class": re.compile(r"class\s+([A-Z][a-zA-Z0-9_]*)")
    },
    "csharp": {
        "class": re.compile(r"class\s+([A-Z][a-zA-Z0-9_]*)"),
        "method": re.compile(r"(?:public|private|protected|internal)\s+[\w<>\[\]]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("),
    },
    "go": {
        "function": re.compile(r"^func\s+([A-Z]?[a-zA-Z0-9_]*)\s*\("),
    },
    "rust": {
        "function": re.compile(r"fn\s+([a-zA-Z0-9_]+)\s*\("),
        "struct": re.compile(r"struct\s+([A-Z][a-zA-Z0-9_]*)"),
    },
    "php": {
        "function": re.compile(r"function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("),
        "class": re.compile(r"class\s+([A-Z][a-zA-Z0-9_]*)")
    },
}

def detect_language(file_path: Path) -> str:
    return EXTENSION_MAP.get(file_path.suffix.lower())

def extract_python_chunks(file_path: Path, project_id: str) -> List[Dict]:
    chunks = []
    try:
        source = file_path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                start_line = node.lineno - 1
                end_line = node.end_lineno if hasattr(node, "end_lineno") else node.lineno
                code = "\n".join(source.splitlines()[start_line:end_line])
                chunks.append({
                    "chunk_id": str(uuid.uuid4()),
                    "project_id": project_id,
                    "file_path": str(file_path.relative_to(Path.cwd())),
                    "language": "python",
                    "chunk_type": "function",
                    "name": node.name,
                    "code_content": code,
                })
            elif isinstance(node, ast.ClassDef):
                # class chunk
                start_line = node.lineno - 1
                end_line = node.end_lineno if hasattr(node, "end_lineno") else node.lineno
                code = "\n".join(source.splitlines()[start_line:end_line])
                chunks.append({
                    "chunk_id": str(uuid.uuid4()),
                    "project_id": project_id,
                    "file_path": str(file_path.relative_to(Path.cwd())),
                    "language": "python",
                    "chunk_type": "class",
                    "name": node.name,
                    "code_content": code,
                })
    except Exception:
        pass
    return chunks

def extract_generic_chunks(file_path: Path, language: str, project_id: str) -> List[Dict]:
    chunks = []
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception:
        return chunks
    patterns = PATTERNS.get(language, {})
    for chunk_type, regex in patterns.items():
        for match in regex.finditer(content):
            name = match.group(1)
            # naive extraction: take the line where it appears
            line_start = content.rfind('\n', 0, match.start()) + 1
            line_end = content.find('\n', match.end())
            line_end = line_end if line_end != -1 else len(content)
            code = content[line_start:line_end].strip()
            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "project_id": project_id,
                "file_path": str(file_path.relative_to(Path.cwd())),
                "language": language,
                "chunk_type": chunk_type,
                "name": name,
                "code_content": code,
            })
    return chunks

def extract_chunks_from_file(file_path: Path, project_id: str) -> List[Dict]:
    language = detect_language(file_path)
    if not language:
        return []
    if language == "python":
        chunks = extract_python_chunks(file_path, project_id)
        if not chunks:
            # fallback to whole file chunk
            chunks = [{
                "chunk_id": str(uuid.uuid4()),
                "project_id": project_id,
                "file_path": str(file_path.relative_to(Path.cwd())),
                "language": language,
                "chunk_type": "file",
                "name": file_path.name,
                "code_content": file_path.read_text(encoding="utf-8"),
            }]
        return chunks
    else:
        chunks = extract_generic_chunks(file_path, language, project_id)
        if not chunks:
            chunks = [{
                "chunk_id": str(uuid.uuid4()),
                "project_id": project_id,
                "file_path": str(file_path.relative_to(Path.cwd())),
                "language": language,
                "chunk_type": "file",
                "name": file_path.name,
                "code_content": file_path.read_text(encoding="utf-8"),
            }]
        return chunks
