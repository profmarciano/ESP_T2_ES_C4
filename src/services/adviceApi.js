import axios from "axios";

export async function getWeatherAdvice(question, weather) {
  try {
    const { data } = await axios.post("/api/weather/advice", { question, weather });
    return data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ??
        "O assistente está indisponível no momento. Tente novamente.",
    );
  }
}