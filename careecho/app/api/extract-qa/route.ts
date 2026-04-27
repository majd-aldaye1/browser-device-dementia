import { NextRequest, NextResponse } from "next/server";
import { createQaExtractorProvider } from "@/lib/extraction/providerFactory";
import { MockQaExtractorProvider } from "@/lib/extraction/providers/mockProvider";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { transcriptChunk?: string };
    const transcriptChunk = body.transcriptChunk?.trim();

    if (!transcriptChunk) {
      return NextResponse.json({ pairs: [] });
    }

    const provider = createQaExtractorProvider();

    try {
      const result = await provider.extract(transcriptChunk);

      if (provider.name !== "mock-rule-based" && (!result.pairs || result.pairs.length === 0)) {
        const fallback = new MockQaExtractorProvider();
        const fallbackResult = await fallback.extract(transcriptChunk);
        return NextResponse.json({
          ...fallbackResult,
          provider: `${provider.name} -> ${fallback.name}`,
          warning: "Primary provider returned no clear pairs. Mock fallback attempted.",
        });
      }

      return NextResponse.json({ ...result, provider: provider.name });
    } catch (providerError) {
      if (provider.name !== "mock-rule-based") {
        const fallback = new MockQaExtractorProvider();
        const result = await fallback.extract(transcriptChunk);
        return NextResponse.json({
          ...result,
          provider: `${provider.name} -> ${fallback.name}`,
          warning: `Provider fallback used: ${(providerError as Error).message}`,
        });
      }
      throw providerError;
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message, pairs: [] },
      { status: 500 },
    );
  }
}
