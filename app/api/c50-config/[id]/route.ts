import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const ID_TO_FILENAME: Record<string, string> = {
  'A1-B1-C1-D1-E2': '3-KABINEN-VERSION (A1–B1-C1–D1–E2).png',
  'A1-B1-C1-D3-E2': '3-KABINEN-VERSION (A1–B1-C1–D3–E2).png',
  'A1-B1-C1-D2-E2': '4-KABINEN-VERSION (A1–B1-C1–D2–E2).png',
  'A1-B2-C1-D1-E2': '4-KABINEN-VERSION (A1–B2-C1–D1–E2).png',
  'A1-B2-C1-D3-E2': '4-KABINEN-VERSION (A1–B2-C1–D3–E2).png',
  'A2-B1-C1-D1-E2': '4-KABINEN-VERSION (A2–B1-C1–D1–E2).png',
  'A2-B1-C1-D3-E2': '4-KABINEN-VERSION (A2–B1-C1–D3–E2).png',
  'A2-B2-C1-D3-E2': '4-KABINEN-VERSION (A2–B2-C1–D3–E2).png',
  'A1-B2-C1-D2-E2': '5-KABINEN-VERSION (A1–B2-C1–D2–E2).png',
  'A2-B2-C1-D1-E2': '5-KABINEN-VERSION (A2–B2-C1–D1–E2).png',
  'A2-B2-C1-D2-E2': '6-KABINEN-VERSION (A2–B2-C1–D2–E2).png',
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filename = ID_TO_FILENAME[id];
  if (!filename) return new NextResponse('Not found', { status: 404 });

  const filePath = path.join(process.cwd(), 'Manuals', 'C50 Configurations', filename);
  const data = await readFile(filePath);
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
