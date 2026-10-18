import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { getWeatherAdvice } from "./services/adviceApi.js";
import { getWeatherByCity } from "./services/weatherApi.js";

vi.mock("./services/adviceApi.js", () => ({
  getWeatherAdvice: vi.fn(),
}));

vi.mock("./services/weatherApi.js", () => ({
  getWeatherByCity: vi.fn(),
}));

const curitibaWeather = {
  location: { name: "Curitiba", region: "Paraná", country: "Brasil" },
  timezone: "America/Sao_Paulo",
  current: {
    temperature: 23,
    feelsLike: 21,
    humidity: 66,
    isDay: true,
    precipitation: 0,
    weatherCode: 1,
    windSpeed: 10,
  },
  daily: [
    {
      date: "2026-10-18",
      weatherCode: 1,
      high: 25,
      low: 16,
      precipitationProbability: 15,
      sunrise: "2026-10-18T05:30",
      sunset: "2026-10-18T18:15",
    },
  ],
};

const weatherAdvice = {
  title: "Leve um guarda-chuva",
  recommendation: "com_cautela",
  summary: "A previsão indica possibilidade de chuva em Curitiba.",
  reasons: ["Chance de chuva de 15% hoje."],
};

describe("weather dashboard", () => {
  beforeEach(() => {
    getWeatherAdvice.mockReset();
    getWeatherByCity.mockReset();
    getWeatherByCity.mockResolvedValue(curitibaWeather);
  });

  it("shows current conditions after the initial city loads", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Curitiba" })).toBeInTheDocument();
    expect(screen.getAllByText("Parcialmente nublado")).toHaveLength(2);
    expect(screen.getByText("66")).toBeInTheDocument();
    expect(getWeatherByCity).toHaveBeenCalledWith("Curitiba", expect.any(AbortSignal));
  });

  it("searches for the city entered by the user", async () => {
    getWeatherByCity.mockResolvedValueOnce(curitibaWeather).mockResolvedValueOnce({
      ...curitibaWeather,
      location: { name: "São Paulo", region: "São Paulo", country: "Brasil" },
    });
    render(<App />);

    await screen.findByRole("heading", { name: "Curitiba" });
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar cidade" }), {
      target: { value: "São Paulo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar cidade" }));

    expect(await screen.findByRole("heading", { name: "São Paulo" })).toBeInTheDocument();
    expect(getWeatherByCity).toHaveBeenLastCalledWith("São Paulo");
  });

  it("shows a clear error when the search fails", async () => {
    getWeatherByCity.mockResolvedValueOnce(curitibaWeather).mockRejectedValueOnce(
      new Error("Cidade não encontrada."),
    );
    render(<App />);

    await screen.findByRole("heading", { name: "Curitiba" });
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar cidade" }), {
      target: { value: "Atlantis" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar cidade" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cidade não encontrada.");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Curitiba" })).toBeInTheDocument());
  });

  it("sends the user's question and current forecast to the assistant", async () => {
    getWeatherAdvice.mockResolvedValueOnce(weatherAdvice);
    render(<App />);

    await screen.findByRole("heading", { name: "Curitiba" });
    fireEvent.change(screen.getByRole("textbox", { name: "Sua pergunta sobre o clima" }), {
      target: { value: "Preciso levar guarda-chuva?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Perguntar" }));

    expect(await screen.findByRole("heading", { name: "Leve um guarda-chuva" })).toBeInTheDocument();
    expect(screen.getByText("Chance de chuva de 15% hoje.")).toBeInTheDocument();
    expect(getWeatherAdvice).toHaveBeenCalledWith("Preciso levar guarda-chuva?", curitibaWeather);
  });

  it("shows setup errors without hiding the weather dashboard", async () => {
    getWeatherAdvice.mockRejectedValueOnce(
      new Error("Assistente indisponível: configure GEMINI_API_KEY no backend."),
    );
    render(<App />);

    await screen.findByRole("heading", { name: "Curitiba" });
    fireEvent.change(screen.getByRole("textbox", { name: "Sua pergunta sobre o clima" }), {
      target: { value: "Posso caminhar hoje?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Perguntar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("configure GEMINI_API_KEY");
    expect(screen.getByRole("heading", { name: "Curitiba" })).toBeInTheDocument();
  });
});