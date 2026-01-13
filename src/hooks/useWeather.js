import { useState, useCallback } from 'react';
import axios from 'axios';

export function useWeather() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);

    const getWeather = useCallback(async (lat, lng) => {
        setLoading(true);
        try {
            // FIX: Use import.meta.env.VITE_OPENWEATHER_KEY
            const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;
            
            if (!apiKey) {
                console.error("Missing OpenWeather API Key");
                return null;
            }

            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather`,
                {
                    params: {
                        lat,
                        lon: lng,
                        appid: apiKey,
                        units: 'metric'
                    }
                }
            );

            const data = response.data;
            const weatherData = {
                temp: data.main.temp,
                feelsLike: data.main.feels_like,
                humidity: data.main.humidity,
                description: data.weather[0].main,
                icon: data.weather[0].icon,
                windSpeed: data.wind.speed,
                rainChance: data.clouds?.all || 0,
                summary: `${data.weather[0].main}, ${Math.round(data.main.temp)}°C`
            };

            setWeather(weatherData);
            return weatherData;
        } catch (e) {
            console.error('Weather fetch error:', e);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getWeatherIcon = (iconCode) => {
        const iconMap = {
            '01d': '☀️', '01n': '🌙',
            '02d': '⛅', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️',
            '10d': '🌦️', '10n': '🌧️',
            '11d': '⛈️', '11n': '⛈️',
            '13d': '❄️', '13n': '❄️',
            '50d': '🌫️', '50n': '🌫️'
        };
        return iconMap[iconCode] || '🌡️';
    };

    return {
        weather,
        loading,
        getWeather,
        getWeatherIcon
    };
}
