import { extractJsonObject, unknownToString } from '../utils/json.util';

export function parseOpenAiResponse(data: Record<string, unknown>): string {
  const content = (
    (data.choices as Array<Record<string, unknown>> | undefined)?.[0]
      ?.message as Record<string, unknown> | undefined
  )?.content;
  return unknownToString(content);
}

export function parseAnthropicResponse(data: Record<string, unknown>): string {
  const contentBlocks = (data.content as Array<Record<string, unknown>>) ?? [];
  return unknownToString(contentBlocks[0]?.text);
}

export function parseGeminiResponse(data: Record<string, unknown>): string {
  const text = (
    (
      (data.candidates as Array<Record<string, unknown>> | undefined)?.[0]
        ?.content as Record<string, unknown> | undefined
    )?.parts as Array<Record<string, unknown>> | undefined
  )?.[0]?.text;
  return unknownToString(text);
}

export function parseOllamaResponse(data: Record<string, unknown>): string {
  // Chat API: { message: { content: "..." } }
  const message = data.message as Record<string, unknown> | undefined;
  if (message?.content != null) {
    return unknownToString(message.content);
  }
  // Generate API / stream final: { response: "..." }
  if (data.response != null) {
    return unknownToString(data.response);
  }
  return '';
}

export function parseOpenRouterResponse(data: Record<string, unknown>): string {
  return parseOpenAiResponse(data);
}

export function parseGroqResponse(data: Record<string, unknown>): string {
  return parseOpenAiResponse(data);
}

export function parseHuggingFaceResponse(
  data: Record<string, unknown>,
): string {
  // OpenAI-compatible router
  const openAiStyle = parseOpenAiResponse(data);
  if (openAiStyle) return openAiStyle;
  // Legacy text-generation: [{ generated_text: "..." }]
  if (Array.isArray(data) && data[0] && typeof data[0] === 'object') {
    return unknownToString((data[0] as Record<string, unknown>).generated_text);
  }
  if (typeof data.generated_text === 'string') {
    return data.generated_text;
  }
  return '';
}

export function parseCloudflareResponse(data: Record<string, unknown>): string {
  const result = data.result as Record<string, unknown> | undefined;
  if (result?.response != null) {
    return unknownToString(result.response);
  }
  if (typeof data.response === 'string') {
    return data.response;
  }
  return '';
}

export function parseProviderJsonContent(
  rawText: string,
): Record<string, unknown> {
  return extractJsonObject(rawText);
}
