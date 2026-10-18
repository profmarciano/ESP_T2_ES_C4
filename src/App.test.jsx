import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { getWeatherByCity } from "./services/weatherApi.js";

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

describe("weather dashboard", () => {
  beforeEach(() => {
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
});