import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { getWeatherByCity } from "./weatherApi.js";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    isCancel: vi.fn(() => false),
  },
}));

describe("getWeatherByCity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("geocodes a city and normalizes current and daily forecast data", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          results: [{ name: "Curitiba", admin1: "Paraná", country: "Brasil", latitude: -25.4, longitude: -49.3 }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          timezone: "America/Sao_Paulo",
          current: {
            temperature_2m: 22.4,
            relative_humidity_2m: 68,
            apparent_temperature: 23.1,
            is_day: 1,
            precipitation: 0,
            weather_code: 2,
            wind_speed_10m: 8.2,
          },
          daily: {
            time: ["2026-10-18"],
            weather_code: [2],
            temperature_2m_max: [25],
            temperature_2m_min: [16],
            precipitation_probability_max: [20],
            sunrise: ["2026-10-18T05:30"],
            sunset: ["2026-10-18T18:15"],
          },
        },
      });

    await expect(getWeatherByCity(" Curitiba ")).resolves.toMatchObject({
      location: { name: "Curitiba", region: "Paraná", country: "Brasil" },
      current: { temperature: 22.4, humidity: 68, weatherCode: 2 },
      daily: [{ date: "2026-10-18", high: 25, low: 16, precipitationProbability: 20 }],
    });
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get.mock.calls[0][1].params.name).toBe("Curitiba");
  });

  it("returns a specific message when geocoding finds no city", async () => {
    axios.get.mockResolvedValueOnce({ data: { results: [] } });

    await expect(getWeatherByCity("Cidade inexistente")).rejects.toThrow(
      'Não encontramos a cidade "Cidade inexistente"',
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("returns a connection message when the weather service is unavailable", async () => {
    axios.get.mockRejectedValueOnce(new Error("network error"));

    await expect(getWeatherByCity("Curitiba")).rejects.toThrow(
      "Não foi possível consultar o clima.",
    );
  });
});