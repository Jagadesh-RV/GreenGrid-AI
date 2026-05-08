import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/weather.css";
import Layout from "../components/Layout";

export default function Weather() {

  const API_KEY = "1c52b4bcfa58b051123eacf3c322fc1d";

  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState("Chennai");

  // 🔹 Fetch Weather Function
  const fetchWeather = async (city) => {
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );

      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );

      setWeather(res.data);
      setForecast(forecastRes.data.list);
    } catch (err) {
      console.error("Weather fetch error:", err);
    }
  };

  // 🔹 Auto location (GPS)
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
          );

          const forecastRes = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
          );

          setWeather(res.data);
          setForecast(forecastRes.data.list);
        } catch (err) {
          console.error(err);
        }
      },
      () => fetchWeather(location)
    );
  }, []);

  // 🔹 Dropdown change
  const handleChange = (e) => {
    setLocation(e.target.value);
    fetchWeather(e.target.value);
  };

  // 🔹 Loading UI
  if (!weather) {
    return (
      <div className="layout">
        <Sidebar />
        <div className="main">
          <Navbar />
          <h2>🌤 Weather Dashboard</h2>
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <h2>🌤 Weather Dashboard</h2>

        {/* LOCATION SELECT */}
        <select value={location} onChange={handleChange}>
          <option>Chennai</option>
          <option>Coimbatore</option>
          <option>Madurai</option>
          <option>Trichy</option>
          <option>Salem</option>
        </select>

        {/* CURRENT WEATHER */}
        <div className="weather-main-card">
          <h1>{weather.name}</h1>
          <h2>{weather.main.temp}°C</h2>
          <p>{weather.weather[0].description}</p>

          <div className="weather-stats">
            <div>💧 {weather.main.humidity}%</div>
            <div>🌬 {weather.wind.speed} m/s</div>
            <div>🌡 {weather.main.feels_like}°C</div>
          </div>
        </div>

        {/* 24H TIMELINE */}
        <h3>⏱ 24 Hour Timeline</h3>
        <div className="timeline">
          {forecast.slice(0, 8).map((f, i) => (
            <div key={i} className="timeline-card">
              <p>{f.dt_txt.split(" ")[1]}</p>
              <h4>{f.main.temp}°C</h4>
              <p>{f.weather[0].main}</p>
            </div>
          ))}
        </div>

        {/* WEEKLY FORECAST */}
        <h3>📅 7 Day Forecast</h3>
        <div className="timeline">
          {forecast.filter((_, i) => i % 8 === 0).map((f, i) => (
            <div key={i} className="timeline-card">
              <p>{new Date(f.dt_txt).toDateString()}</p>
              <h4>{f.main.temp}°C</h4>
              <p>{f.weather[0].main}</p>
            </div>
          ))}
        </div>

        {/* AI INSIGHT */}
        <div className="ai-box">
          💡 AI Insight: High temperature expected. Reduce irrigation and protect crops.
        </div>

      </div>
    </div>
  );
}