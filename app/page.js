"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";

export default function Home() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/weather");
        const data = await res.json();
        setWeatherData(data);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    loadData();
  }, []);
  

  const latest = weatherData[0]; // Most recent record from CosmosDB

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-indigo-600 p-8 md:p-12 text-white">
      <h1 className="text-4xl font-bold mb-8 text-center">Weather Dashboard</h1>
  
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Cards Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
            {latest && (
              <>
                <WeatherCard title="Temperature" value={`${latest.temperature} °F`} />
                <WeatherCard title="Wind Speed" value={`${latest.windSpeed} kph`} />
                <WeatherCard title="Wind Gust" value={`${latest.windGust} kph`} />
                <WeatherCard title="Wind Direction" value={`${latest.windDirection} °`} />
                <WeatherCard title="Short Forecast" value={"N/A"} />
                <WeatherCard title="Humidity" value={`${latest.relativeHumidity} %`} />
                <WeatherCard title="Precipitation" value={`${latest.probabilityOfPrecipitation} %`} />
                <WeatherCard title="Sky Cover" value={`${latest.skyCover ?? "N/A"} %`} />
              </>
            )}
          </div>
  
          {/* Charts Section */}
          <div className="flex flex-col md:flex-row gap-8 m-8">
            {/* Temperature Chart */}
            <div className="flex-1 bg-white rounded-3xl p-8 shadow-2xl">
              <h2 className="text-black text-2xl font-bold mb-6 text-center">Temperature Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weatherData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                    tick={{ fill: "black", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "black" }} />
                  <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="#8884d8" name="Temp (°F)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
  
            {/* Sky Cover Chart */}
            <div className="flex-1 bg-white rounded-3xl p-8 shadow-2xl">
              <h2 className="text-black text-2xl font-bold mb-6 text-center">Sky Cover Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weatherData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                    tick={{ fill: "black", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "black" }} domain={[0, 100]} />
                  <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
                  <Legend />
                  <Line type="monotone" dataKey="skyCover" stroke="#82ca9d" name="Sky Cover (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
  
}

function WeatherCard({ title, value }) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
      <p className="text-3xl font-bold text-center">{value}</p>
    </motion.div>
  );
}

function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center items-center min-h-[50vh]"
    >
      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </motion.div>
  );
}

