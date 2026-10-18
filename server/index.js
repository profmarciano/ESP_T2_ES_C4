import { existsSync } from "node:fs";
import express from "express";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createGeminiAdvisor } from "./weatherAdvice.js";

const app = createApp({
  generateAdvice: createGeminiAdvisor({ apiKey: process.env.GEMINI_API_KEY }),
});

const distDirectory = fileURLToPath(new URL("../dist/", import.meta.url));
const indexFile = fileURLToPath(new URL("../dist/index.html", import.meta.url));
if (existsSync(indexFile)) {
  app.use(express.static(distDirectory));
  app.get(/.*/, (_request, response) => response.sendFile(indexFile));
}

const port = Number(process.env.PORT) || 3001;
app.listen(port, "127.0.0.1", () => {
  console.log(`Weather API listening on http://127.0.0.1:${port}`);
});