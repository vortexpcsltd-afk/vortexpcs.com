import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export const config = { runtime: "edge" };

export default async function handler() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "No API key", hasKey: false }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log("🧪 Testing OpenAI connection...");
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: "Say 'OpenAI connection successful' in exactly those words.",
      maxTokens: 50,
    } as any);

    console.log("✅ Test result:", result.text);

    return new Response(
      JSON.stringify({
        success: true,
        response: result.text,
        usage: result.usage,
        model: "gpt-4o-mini",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const errorObj = error as { status?: number; code?: string };
    console.error("❌ Test failed:", {
      message,
      status: errorObj.status,
      code: errorObj.code,
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        status: errorObj.status,
        code: errorObj.code,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
