import { NextRequest, NextResponse } from "next/server";
import { AIModel } from "@/types";

/**
 * POST /api/test-key
 * Tests if an API key is valid by making a minimal API call.
 */
export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = (await request.json()) as {
      provider: AIModel;
      apiKey: string;
    };

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: "No API key provided" });
    }

    switch (provider) {
      case "claude":
        return await testClaude(apiKey);
      case "openai":
        return await testOpenAI(apiKey);
      case "gemini":
        return await testGemini(apiKey);
      default:
        return NextResponse.json({ valid: false, error: "Unknown provider" });
    }
  } catch (err) {
    return NextResponse.json({
      valid: false,
      error: err instanceof Error ? err.message : "Test failed",
    });
  }
}

async function testClaude(apiKey: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 10,
      messages: [{ role: "user", content: "hi" }],
    }),
  });

  if (res.ok) {
    return NextResponse.json({ valid: true, message: "Anthropic API key is valid" });
  }

  const data = await res.json().catch(() => ({}));
  const errMsg = (data as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
  return NextResponse.json({ valid: false, error: errMsg });
}

async function testOpenAI(apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (res.ok) {
    return NextResponse.json({ valid: true, message: "OpenAI API key is valid" });
  }

  const data = await res.json().catch(() => ({}));
  const errMsg = (data as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
  return NextResponse.json({ valid: false, error: errMsg });
}

async function testGemini(apiKey: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  if (res.ok) {
    return NextResponse.json({ valid: true, message: "Gemini API key is valid" });
  }

  const data = await res.json().catch(() => ({}));
  const errMsg = (data as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
  return NextResponse.json({ valid: false, error: errMsg });
}
