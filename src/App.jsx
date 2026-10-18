import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  MapPin,
  Moon,
  Search,
  Send,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { formatDate, formatForecastDay, getWeatherCondition } from "./lib/weather.js";
import { getWeatherAdvice } from "./services/adviceApi.js";
import { getWeatherByCity } from "./services/weatherApi.js";

const weatherIcons = {
  sun: Sun,
  moon: Moon,
  partly: CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

function WeatherIcon({ code, isDay = true, size = 32 }) {
  const condition = getWeatherCondition(code, isDay);
  const Icon = weatherIcons[condition.icon] ?? Cloud;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.6} />;
}

function App() {
  const [weather, setWeather] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getWeatherByCity("Curitiba", controller.signal)
      .then(setWeather)
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    const city = search.trim();
    if (!city || loading) return;

    setLoading(true);
    setError("");

    try {
      setWeather(await getWeatherByCity(city));
      setAssistantAnswer(null);
      setAssistantError("");
      setSearch("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssistantSubmit(event) {
    event.preventDefault();
    const question = assistantQuestion.trim();
    if (!question || !weather || assistantLoading) return;

    setAssistantLoading(true);
    setAssistantError("");
    setAssistantAnswer(null);

    try {
      setAssistantAnswer(await getWeatherAdvice(question, weather));
      setAssistantQuestion("");
    } catch (requestError) {
      setAssistantError(requestError.message);
    } finally {
      setAssistantLoading(false);
    }
  }

  const today = weather?.daily[0];
  const condition = weather
    ? getWeatherCondition(weather.current.weatherCode, weather.current.isDay)
    : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Clima, início">
          <span className="brand-mark"><CloudSun size={22} strokeWidth={1.8} /></span>
          <span>clima<span className="brand-dot">.</span></span>
        </a>
        <form className="search-form" onSubmit={handleSearch} role="search">
          <Search aria-hidden="true" size={18} />
          <input
            aria-label="Buscar cidade"
            autoComplete="off"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cidade"
            value={search}
          />
          <button aria-label="Buscar cidade" disabled={loading || !search.trim()} type="submit">
            <span>Buscar</span>
            <Search aria-hidden="true" className="search-button-icon" size={17} />
          </button>
        </form>
      </header>

      <main id="inicio" className="dashboard">
        <div className="page-heading">
          <div>
            <p className="overline">SEU TEMPO, EM TEMPO REAL</p>
            <h1>Clima de hoje</h1>
          </div>
          <p className="updated-label"><span className="live-dot" /> Dados atualizados pela API</p>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button aria-label="Dispensar mensagem" onClick={() => setError("")} type="button">×</button>
          </div>
        )}

        {loading && !weather ? (
          <div className="loading-panel" role="status">
            <span className="loading-spinner" />
            <span>Consultando as condições do tempo...</span>
          </div>
        ) : weather ? (
          <div className="dashboard-grid grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.85fr)]">
            <section className="main-column" aria-label="Clima atual">
              <article className="current-panel">
                <div className="current-topline">
                  <div className="location-label">
                    <MapPin size={16} aria-hidden="true" />
                    <span>{[weather.location.region, weather.location.country].filter(Boolean).join(", ")}</span>
                  </div>
                  <span className="current-badge">AGORA</span>
                </div>
                <div className="current-weather">
                  <div>
                    <h2>{weather.location.name}</h2>
                    <p className="current-date">{today ? formatDate(today.date) : ""}</p>
                    <p className="current-condition">{condition.label}</p>
                  </div>
                  <div className="temperature-wrap">
                    <WeatherIcon code={weather.current.weatherCode} isDay={weather.current.isDay} size={72} />
                    <p className="temperature">{Math.round(weather.current.temperature)}<span>°</span></p>
                  </div>
                </div>
                <p className="feels-like">Sensação térmica de {Math.round(weather.current.feelsLike)}°</p>
                <div className="sun-track" aria-hidden="true">
                  <span className="sun-track-line" />
                  <Sun className="sun-track-icon" size={17} />
                  <span className="sun-track-label">{today?.sunrise.slice(-5) || "--:--"}</span>
                  <span className="sun-track-label sun-track-evening">{today?.sunset.slice(-5) || "--:--"}</span>
                </div>
              </article>

              <section className="details-section" aria-labelledby="details-heading">
                <div className="section-heading">
                  <div>
                    <p className="overline">AGORA</p>
                    <h2 id="details-heading">Condições atuais</h2>
                  </div>
                </div>
                <div className="details-grid">
                  <article className="detail-item">
                    <span className="detail-icon detail-icon-coral"><Thermometer size={18} /></span>
                    <div><p>Sensação térmica</p><strong>{Math.round(weather.current.feelsLike)}°</strong></div>
                  </article>
                  <article className="detail-item">
                    <span className="detail-icon detail-icon-blue"><Droplets size={18} /></span>
                    <div><p>Umidade</p><strong>{weather.current.humidity}<small>%</small></strong></div>
                  </article>
                  <article className="detail-item">
                    <span className="detail-icon detail-icon-green"><Wind size={18} /></span>
                    <div><p>Vento</p><strong>{Math.round(weather.current.windSpeed)}<small> km/h</small></strong></div>
                  </article>
                  <article className="detail-item">
                    <span className="detail-icon detail-icon-yellow"><Droplets size={18} /></span>
                    <div><p>Chance de chuva</p><strong>{today?.precipitationProbability ?? 0}<small>%</small></strong></div>
                  </article>
                </div>
              </section>

              <section className="assistant-section" aria-labelledby="assistant-heading">
                <div className="section-heading assistant-heading">
                  <div>
                    <p className="overline">PLANEJE COM MAIS CONTEXTO</p>
                    <h2 id="assistant-heading">Assistente do dia</h2>
                  </div>
                  <span className="assistant-mark"><Sparkles size={18} aria-hidden="true" /></span>
                </div>
                <p className="assistant-description">
                  Pergunte sobre seus planos. A resposta considera a previsão de {weather.location.name}.
                </p>
                <p className="assistant-privacy">
                  Sua pergunta e os dados de previsão são enviados ao Gemini para gerar a recomendação.
                </p>
                <form className="assistant-form" onSubmit={handleAssistantSubmit}>
                  <label className="sr-only" htmlFor="assistant-question">Sua pergunta sobre o clima</label>
                  <textarea
                    id="assistant-question"
                    maxLength={280}
                    onChange={(event) => setAssistantQuestion(event.target.value)}
                    placeholder="Ex.: Preciso levar guarda-chuva?"
                    rows={2}
                    value={assistantQuestion}
                  />
                  <button disabled={assistantLoading || !assistantQuestion.trim()} type="submit">
                    {assistantLoading ? <span className="loading-spinner assistant-spinner" /> : <Send size={16} aria-hidden="true" />}
                    <span>{assistantLoading ? "Analisando" : "Perguntar"}</span>
                  </button>
                </form>
                <div className="assistant-suggestions" aria-label="Sugestões de perguntas">
                  {[
                    "Preciso levar guarda-chuva?",
                    "É um bom dia para caminhar?",
                    "O que considerar para sair?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setAssistantQuestion(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                {assistantError && <p className="assistant-error" role="alert">{assistantError}</p>}
                {assistantAnswer && (
                  <article className={`assistant-answer answer-${assistantAnswer.recommendation}`} aria-live="polite">
                    <div className="answer-title-row">
                      <span className="answer-indicator" />
                      <h3>{assistantAnswer.title}</h3>
                    </div>
                    <p>{assistantAnswer.summary}</p>
                    <ul>
                      {assistantAnswer.reasons.map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}
                    </ul>
                    <span className="answer-source">Recomendação baseada nos dados meteorológicos disponíveis</span>
                  </article>
                )}
              </section>
            </section>

            <aside className="forecast-panel" aria-labelledby="forecast-heading">
              <div className="section-heading forecast-heading">
                <div>
                  <p className="overline">PRÓXIMOS DIAS</p>
                  <h2 id="forecast-heading">Previsão</h2>
                </div>
                <span className="forecast-unit">°C</span>
              </div>
              <div className="forecast-list">
                {weather.daily.slice(0, 5).map((day, index) => {
                  const dayCondition = getWeatherCondition(day.weatherCode);
                  return (
                    <article className={`forecast-day${index === 0 ? " forecast-day-today" : ""}`} key={day.date}>
                      <span className="forecast-day-name">{formatForecastDay(day.date, index)}</span>
                      <span className="forecast-icon"><WeatherIcon code={day.weatherCode} size={23} /></span>
                      <span className="forecast-condition">{dayCondition.label}</span>
                      <span className="forecast-temperatures">
                        <strong><ArrowUp size={13} />{Math.round(day.high)}°</strong>
                        <span><ArrowDown size={13} />{Math.round(day.low)}°</span>
                      </span>
                    </article>
                  );
                })}
              </div>
              <div className="forecast-note">
                <span className="note-icon"><Droplets size={17} /></span>
                <p>Hoje, a chance de chuva é de <strong>{today?.precipitationProbability ?? 0}%</strong>.</p>
              </div>
            </aside>
          </div>
        ) : (
          <div className="empty-panel">
            <CloudSun size={40} strokeWidth={1.4} />
            <h2>Busque uma cidade</h2>
            <p>Consulte a previsão e as condições atuais em qualquer lugar.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Um pouco mais perto do céu.</span>
        <span>Dados: <a href="https://open-meteo.com/" rel="noreferrer" target="_blank">Open-Meteo</a> · Geocodificação: <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">OpenStreetMap</a></span>
      </footer>
    </div>
  );
}

export default App;