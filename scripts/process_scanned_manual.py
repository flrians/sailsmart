#!/usr/bin/env python3
"""
Process a scanned (image-based) PDF using Tesseract OCR (free, no OpenAI).
Falls back to PyMuPDF text extraction first; uses Tesseract only for image pages.

Usage:
  python3 scripts/process_scanned_manual.py <pdf_path>
      --title "Manual Title"
      --boat-type-name "Bavaria C50"
      [--engine-model "Yanmar 4JH80"]
"""

import sys
import os
import argparse
import fitz  # PyMuPDF
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OPENAI_KEY   = os.environ["OPENAI_API_KEY"]

openai_client = OpenAI(api_key=OPENAI_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def extract_page_text(page):
    """Extract text from a PDF page using PyMuPDF. Returns empty string for image-only pages."""
    text = page.get_text("text").strip()
    return text


def ocr_page_tesseract(page, dpi=150):
    """Render page as image and OCR with Tesseract (pytesseract). Returns extracted text."""
    try:
        import pytesseract
        from PIL import Image
        import io

        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_bytes))
        text = pytesseract.image_to_string(img)
        return text.strip()
    except ImportError:
        print("  Warning: pytesseract not installed. Skipping OCR for this page.", file=sys.stderr)
        print("  Install with: pip install pytesseract pillow && brew install tesseract", file=sys.stderr)
        return ""


def get_boat_type_id(boat_type_name):
    result = supabase.table("boat_types").select("id").eq("name", boat_type_name).single().execute()
    if not result.data:
        print(f'Error: boat type "{boat_type_name}" not found.', file=sys.stderr)
        sys.exit(1)
    return result.data["id"]


def embed_and_store(chunks, manual_id, boat_type_id):
    BATCH = 50
    total = 0
    for i in range(0, len(chunks), BATCH):
        batch = chunks[i:i + BATCH]
        texts = [c["text"] for c in batch]
        print(f"  Embedding batch {i // BATCH + 1} / {-(-len(chunks) // BATCH)}...")
        emb = openai_client.embeddings.create(model="text-embedding-3-small", input=texts)
        records = [
            {
                "manual_id": manual_id,
                "boat_type_id": boat_type_id,
                "page_number": batch[j]["page"],
                "content": texts[j],
                "embedding": emb.data[j].embedding,
            }
            for j in range(len(batch))
        ]
        supabase.table("manual_chunks").insert(records).execute()
        total += len(records)
    return total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf_path")
    parser.add_argument("--title", default=None)
    parser.add_argument("--boat-type-name", default=None)
    parser.add_argument("--engine-model", default=None)
    args = parser.parse_args()

    pdf_path = args.pdf_path
    title = args.title or os.path.splitext(os.path.basename(pdf_path))[0]

    if not os.path.exists(pdf_path):
        print(f"Error: file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    boat_type_id = None
    if args.boat_type_name:
        boat_type_id = get_boat_type_id(args.boat_type_name)
        print(f"Boat type: {args.boat_type_name} ({boat_type_id})")

    if args.engine_model and boat_type_id:
        supabase.table("boat_types").update({"engine_model": args.engine_model}).eq("id", boat_type_id).execute()
        print(f"Engine model set: {args.engine_model}")

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"Opened '{pdf_path}': {total_pages} pages.")

    chunks = []
    for page_num in range(total_pages):
        page = doc[page_num]
        print(f"  Page {page_num + 1}/{total_pages}...", end=" ", flush=True)

        text = extract_page_text(page)

        if len(text) < 30:
            # Likely a scanned/image page — try Tesseract
            text = ocr_page_tesseract(page)

        if len(text) < 30:
            print("skipped (no content)")
            continue

        chunks.append({"page": page_num + 1, "text": text})
        print(f"ok ({len(text)} chars)")

    doc.close()
    print(f"\n{len(chunks)} pages with content.")

    if not chunks:
        print("Nothing to store. Exiting.")
        sys.exit(1)

    result = supabase.table("manuals").insert({
        "title": title,
        "filename": os.path.basename(pdf_path),
        "boat_type_id": boat_type_id,
    }).execute()
    manual_id = result.data[0]["id"]
    print(f"Manual record created: {manual_id}")

    stored = embed_and_store(chunks, manual_id, boat_type_id)
    print(f"\nDone! Stored {stored} chunks for '{title}'.")


if __name__ == "__main__":
    main()
