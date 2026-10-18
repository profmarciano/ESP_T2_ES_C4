import { z } from "zod";

const locationSchema = z.object({
  name: z.string().min(1).max(100),
  region: z.string().max(100),
  country: z.string().max(100),
});

const currentWeatherSchema = z.object({
  temperature: z.number().finite(),
  feelsLike: z.number().finite(),
  humidity: z.number().int().min(0).max(100),
  isDay: z.boolean(),
  precipitation: z.number().finite().min(0),
  weatherCode: z.number().int().min(0),
  windSpeed: z.number().finite().min(0),
});

const forecastDaySchema = z.object({
  date: z.string().min(10).max(10),
  weatherCode: z.number().int().min(0),
  high: z.number().finite(),
  low: z.number().finite(),
  precipitationProbability: z.number().min(0).max(100),
  sunrise: z.string().max(40),
  sunset: z.string().max(40),
});

export const weatherAdviceRequestSchema = z.object({
  question: z.string().trim().min(5).max(280),
  weather: z.object({
    location: locationSchema,
    current: currentWeatherSchema,
    daily: z.array(forecastDaySchema).min(1).max(6),
  }),
});

export const weatherAdviceResponseSchema = z.object({
  title: z.string().min(1).max(60),
  recommendation: z.enum(["favoravel", "com_cautela", "evitar"]),
  summary: z.string().min(1).max(280),
  reasons: z.array(z.string().min(1).max(140)).min(1).max(3),
});

export const geminiResponseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    recommendation: {
      type: "string",
      enum: ["favoravel", "com_cautela", "evitar"],
    },
    summary: { type: "string" },
    reasons: { type: "array", items: { type: "string" } },
  },
  required: ["title", "recommendation", "summary", "reasons"],
  additionalProperties: false,
};