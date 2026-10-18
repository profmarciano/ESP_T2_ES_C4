import axios from "axios";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function getWeatherByCity(city, signal) {
  const query = city.trim();
  if (!query) throw new Error("Digite o nome de uma cidade.");

  try {
    const locationResponse = await axios.get(GEOCODING_URL, {
      params: { name: query, count: 1, language: "pt", format: "json" },
      signal,
    });
    const location = locationResponse.data.results?.[0];

    if (!location) {
      throw new Error(`Não encontramos a cidade "${query}". Confira o nome e tente novamente.`);
    }

    const forecastResponse = await axios.get(FORECAST_URL, {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
        forecast_days: 6,
        timezone: "auto",
      },
      signal,
    });

    const { current, daily, timezone } = forecastResponse.data;
    if (!current || !Array.isArray(daily?.time)) {
      throw new Error("A API retornou dados incompletos. Tente novamente mais tarde.");
    }

    return {
      location: {
        name: location.name,
        region: location.admin1 ?? "",
        country: location.country ?? "",
      },
      timezone,
      current: {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        isDay: Boolean(current.is_day),
        precipitation: current.precipitation,
        weatherCode: current.weather_code,
        windSpeed: current.wind_speed_10m,
      },
      daily: daily.time.map((date, index) => ({
        date,
        weatherCode: daily.weather_code[index],
        high: daily.temperature_2m_max[index],
        low: daily.temperature_2m_min[index],
        precipitationProbability: daily.precipitation_probability_max?.[index] ?? 0,
        sunrise: daily.sunrise?.[index] ?? "",
        sunset: daily.sunset?.[index] ?? "",
      })),
    };
  } catch (error) {
    if (signal?.aborted || axios.isCancel(error)) throw error;
    if (error.message.startsWith("Não encontramos") || error.message.startsWith("A API retornou")) {
      throw error;
    }

    throw new Error("Não foi possível consultar o clima. Verifique sua conexão e tente novamente.");
  }
}