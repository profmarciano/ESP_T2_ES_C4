import { describe, expect, it, vi } from "vitest";
import {
  createGeminiAdvisor,
  GeminiIncompleteResponseError,
  GeminiNotConfiguredError,
  GeminiProviderError,
} from "./weatherAdvice.js";

const weather = {
  location: { name: "Curitiba", region: "Paraná", country: "Brasil" },
  current: { temperature: 20, humidity: 65 },
  daily: [{ date: "2026-10-18", high: 25, low: 15, precipitationProbability: 20 }],
};

const validResponse = {
  title: "Leve um guarda-chuva",
  recommendation: "com_cautela",
  summary: "Há possibilidade de chuva hoje.",
  reasons: ["A previsão indica 20% de chance de chuva."],
};

describe("Gemini weather advisor", () => {
  it("requests stateless structured advice from Gemini 3.8 Flash", async () => {
    const create = vi.fn().mockResolvedValue({
      status: "completed",
      output_text: JSON.stringify(validResponse),
    });
    const generateAdvice = createGeminiAdvisor({
      apiKey: "test-key",
      client: { interactions: { create } },
    });

    await expect(generateAdvice({ question: "Preciso de guarda-chuva?", weather })).resolves.toEqual(
      validResponse,
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.8-flash",
        store: false,
        generation_config: expect.objectContaining({
          thinking_level: "low",
          max_output_tokens: 512,
        }),
        response_format: expect.objectContaining({
          mime_type: "application/json",
          schema: expect.objectContaining({ required: ["title", "recommendation", "summary", "reasons"] }),
        }),
      }),
    );
  });

  it("fails clearly when no Gemini key is configured", async () => {
    const generateAdvice = createGeminiAdvisor();

    await expect(generateAdvice({ question: "Posso caminhar?", weather })).rejects.toBeInstanceOf(
      GeminiNotConfiguredError,
    );
  });

  it("rejects invalid structured model output", async () => {
    const create = vi.fn().mockResolvedValue({ status: "completed", output_text: "not JSON" });
    const generateAdvice = createGeminiAdvisor({
      apiKey: "test-key",
      client: { interactions: { create } },
    });

    await expect(generateAdvice({ question: "Posso caminhar?", weather })).rejects.toBeInstanceOf(
      GeminiProviderError,
    );
  });

  it("reports a truncated response without attempting to parse partial JSON", async () => {
    const create = vi.fn().mockResolvedValue({ status: "incomplete", output_text: "{" });
    const generateAdvice = createGeminiAdvisor({
      apiKey: "test-key",
      client: { interactions: { create } },
    });

    await expect(generateAdvice({ question: "Posso caminhar?", weather })).rejects.toBeInstanceOf(
      GeminiIncompleteResponseError,
    );
  });
});