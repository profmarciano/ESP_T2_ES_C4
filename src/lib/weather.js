export function getWeatherCondition(code, isDay = true) {
  if (code === 0) {
    return { label: "Céu limpo", icon: isDay ? "sun" : "moon" };
  }

  if ([1, 2].includes(code)) {
    return { label: "Parcialmente nublado", icon: isDay ? "partly" : "cloud" };
  }

  if (code === 3) return { label: "Nublado", icon: "cloud" };
  if ([45, 48].includes(code)) return { label: "Neblina", icon: "fog" };
  if ([51, 53, 55, 56, 57].includes(code)) {
    return { label: "Garoa", icon: "drizzle" };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { label: "Chuva", icon: "rain" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { label: "Neve", icon: "snow" };
  }

  if ([95, 96, 99].includes(code)) {
    return { label: "Trovoada", icon: "storm" };
  }

  return { label: "Condição variável", icon: "cloud" };
}

export function formatForecastDay(date, index) {
  if (index === 0) return "Hoje";

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "");
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}