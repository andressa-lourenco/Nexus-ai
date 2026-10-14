import "server-only";

export type AIProvider = "gemini" | "openai" | "custom";

function intFromEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Server-only configuration. The API key never leaves this module's consumers. */
export function getServerConfig() {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || null;
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || null;

  const isGemini =
    explicitProvider === "gemini" ||
    (Boolean(geminiKey) && explicitProvider !== "openai" && (!openaiKey || explicitProvider !== "openai"));

  const provider: AIProvider = isGemini ? "gemini" : (explicitProvider === "custom" ? "custom" : "openai");
  const apiKey = isGemini ? geminiKey : openaiKey;

  const defaultBaseUrl = isGemini
    ? "https://generativelanguage.googleapis.com/v1beta"
    : "https://api.openai.com/v1";
  const defaultChatModel = isGemini ? "gemini-3.5-flash" : "gpt-4o-mini";
  const defaultEmbeddingModel = isGemini ? "gemini-embedding-001" : "text-embedding-3-small";
  const defaultDimensions = isGemini ? 3072 : 512;

  const baseUrl = (
    process.env.GEMINI_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    defaultBaseUrl
  ).replace(/\/+$/, "");

  const chatModel = process.env.CHAT_MODEL?.trim() || defaultChatModel;
  const embeddingModel = process.env.EMBEDDING_MODEL?.trim() || defaultEmbeddingModel;
  const dimensions = intFromEnv("EMBEDDING_DIMENSIONS", defaultDimensions);
  const rateLimitPerMinute = intFromEnv("RATE_LIMIT_PER_MINUTE", 30);

  return {
    provider,
    apiKey,
    baseUrl,
    chatModel,
    embeddingModel,
    dimensions,
    rateLimitPerMinute,
  };
}
