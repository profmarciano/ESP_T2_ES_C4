import express from "express";
import rateLimit from "express-rate-limit";
import {
  weatherAdviceRequestSchema,
  weatherAdviceResponseSchema,
} from "./schemas.js";
import {
  GeminiIncompleteResponseError,
  GeminiNotConfiguredError,
} from "./weatherAdvice.js";

export function createApp({ generateAdvice }) {
  const app = express();
  app.use(express.json({ limit: "12kb" }));

  app.post(
    "/api/weather/advice",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 12,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_request, response) => {
        response.status(429).json({
          error: "Muitas consultas em pouco tempo. Aguarde alguns minutos e tente novamente.",
        });
      },
    }),
    async (request, response) => {
      const input = weatherAdviceRequestSchema.safeParse(request.body);
      if (!input.success) {
        return response.status(400).json({
          error: "Pergunta ou dados meteorológicos inválidos.",
        });
      }

      try {
        const advice = await generateAdvice(input.data);
        const output = weatherAdviceResponseSchema.safeParse(advice);
        if (!output.success) {
          return response.status(502).json({
            error: "O assistente retornou uma resposta inválida. Tente novamente.",
          });
        }

        return response.json(output.data);
      } catch (error) {
        if (error instanceof GeminiNotConfiguredError) {
          return response.status(503).json({
            error: "Assistente indisponível: configure GEMINI_API_KEY no backend.",
          });
        }
        if (error instanceof GeminiIncompleteResponseError) {
          return response.status(502).json({
            error: "A resposta do assistente ficou incompleta. Tente novamente.",
          });
        }

        return response.status(502).json({
          error: "Não foi possível gerar uma recomendação agora. Tente novamente.",
        });
      }
    },
  );

  app.use((error, _request, response, _next) => {
    if (error.type === "entity.too.large") {
      return response.status(413).json({ error: "A solicitação excede o tamanho permitido." });
    }
    if (error instanceof SyntaxError && "body" in error) {
      return response.status(400).json({ error: "O corpo da solicitação não contém JSON válido." });
    }
    return response.status(500).json({ error: "Erro interno do servidor." });
  });

  return app;
}