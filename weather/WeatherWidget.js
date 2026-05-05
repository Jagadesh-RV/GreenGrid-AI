import React, { useEffect, useState } from "react";

const API_KEY = "YOUR_REAL_API_KEY"; // 🔴 MUST CHANGE THIS

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Chennai&appid=${API_KEY}&units=metric`
    )
      .then((res) => res.json())
      .then((data) => setWeather(data))
      .catch((err) => console.log(err));
  }, []);

  // ✅ SAFE CHECK (prevents crash)
  if (!weather || !weather.main) {
    return <div className="card">🌦 Loading weather...</div>;
  }

  return (
    <div className="card">
      <h3>Weather Live</h3>
      <h2>{weather.main.temp}°C</h2>
      <p>{weather.weather[0].description}</p>
    </div>
  );
}