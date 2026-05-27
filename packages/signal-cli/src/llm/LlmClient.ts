export interface LlmDraftRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export interface LlmClient {
  readonly name: string;
  readonly available: boolean;
  complete(req: LlmDraftRequest): Promise<string>;
}

export class NullLlmClient implements LlmClient {
  readonly name = "null";
  readonly available = false;
  async complete(_: LlmDraftRequest): Promise<string> {
    throw new Error("No LLM client configured. Use --with-llm + ANTHROPIC_API_KEY (BYOK) or invoke from an IDE skill.");
  }
}

export function pickLlmClient(opts: { withLlm: boolean }): LlmClient {
  if (!opts.withLlm) return new NullLlmClient();
  // Lazy require so users without the SDK still install
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    // Dynamic import keeps the dependency optional
    return new BYOKAnthropicClient(apiKey);
  }
  if (process.env.TUCAKEN_IDE_BRIDGE === "1") {
    return new IdeBridgeClient();
  }
  return new NullLlmClient();
}

class BYOKAnthropicClient implements LlmClient {
  readonly name = "anthropic-byok";
  readonly available = true;
  constructor(private readonly apiKey: string) {}
  async complete(req: LlmDraftRequest): Promise<string> {
    // The Anthropic SDK is intentionally not a hard dependency.
    // We invoke via fetch to avoid forcing every CLI user to install it.
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: req.maxTokens ?? 1500,
        system: req.systemPrompt,
        messages: [{ role: "user", content: req.userPrompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { content?: Array<{ text?: string }> };
    return json.content?.map((c) => c.text ?? "").join("") ?? "";
  }
}

class IdeBridgeClient implements LlmClient {
  readonly name = "ide-bridge";
  readonly available = true;
  async complete(_: LlmDraftRequest): Promise<string> {
    // When invoked from an IDE skill, the host already has an LLM session.
    // The skill is expected to take the request shape from stderr and feed
    // it back; this stub returns a marker so callers can detect bridge mode.
    return "__IDE_BRIDGE__";
  }
}
