import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import {
  GeminiIncompleteResponseError,
  GeminiNotConfiguredError,
} from "./weatherAdvice.js";

const weather = {
  location: { name: "Curitiba", region: "Paraná", country: "Brasil" },
  current: {
    temperature: 20,
    feelsLike: 19,
    humidity: 65,
    isDay: true,
    precipitation: 0,
    weatherCode: 1,
    windSpeed: 8,
  },
  daily: [
    {
      date: "2026-10-18",
      weatherCode: 1,
      high: 25,
      low: 15,
      precipitationProbability: 20,
      sunrise: "2026-10-18T05:30",
      sunset: "2026-10-18T18:15",
    },
  ],
};

const advice = {
  title: "Leve um guarda-chuva",
  recommendation: "com_cautela",
  summary: "Há possibilidade de chuva hoje.",
  reasons: ["A previsão indica 20% de chance de chuva."],
};

describe("POST /api/weather/advice", () => {
  it("validates input and returns structured advice", async () => {
    const generateAdvice = vi.fn().mockResolvedValue(advice);
    const app = createApp({ generateAdvice });

    const response = await request(app)
      .post("/api/weather/advice")
      .send({ question: "Preciso de guarda-chuva?", weather });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(advice);
    expect(generateAdvice).toHaveBeenCalledWith({
      question: "Preciso de guarda-chuva?",
      weather,
    });
  });

  it("rejects invalid request data before calling Gemini", async () => {
    const generateAdvice = vi.fn();
    const app = createApp({ generateAdvice });

    const response = await request(app)
      .post("/api/weather/advice")
      .send({ question: "oi", weather: {} });

    expect(response.status).toBe(400);
    expect(generateAdvice).not.toHaveBeenCalled();
  });

  it("returns a setup message when the API key is missing", async () => {
    const generateAdvice = vi.fn().mockRejectedValue(new GeminiNotConfiguredError());
    const app = createApp({ generateAdvice });

    const response = await request(app)
      .post("/api/weather/advice")
      .send({ question: "Como está para caminhar?", weather });

    expect(response.status).toBe(503);
    expect(response.body.error).toContain("GEMINI_API_KEY");
  });

  it("explains when Gemini truncates its response", async () => {
    const generateAdvice = vi.fn().mockRejectedValue(new GeminiIncompleteResponseError());
    const app = createApp({ generateAdvice });

    const response = await request(app)
      .post("/api/weather/advice")
      .send({ question: "Como está para caminhar?", weather });

    expect(response.status).toBe(502);
    expect(response.body.error).toContain("incompleta");
  });

  it("limits repeated calls from the same client", async () => {
    const app = createApp({ generateAdvice: vi.fn().mockResolvedValue(advice) });
    let response;

    for (let call = 0; call < 13; call += 1) {
      response = await request(app)
        .post("/api/weather/advice")
        .send({ question: "Como está para caminhar?", weather });
    }

    expect(response.status).toBe(429);
    expect(response.body.error).toContain("Muitas consultas");
  });
});