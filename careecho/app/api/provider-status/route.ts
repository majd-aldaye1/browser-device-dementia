import { NextResponse } from "next/server";
import { createQaExtractorProvider } from "@/lib/extraction/providerFactory";

export async function GET() {
  const provider = createQaExtractorProvider();
  return NextResponse.json({ provider: provider.name });
}
