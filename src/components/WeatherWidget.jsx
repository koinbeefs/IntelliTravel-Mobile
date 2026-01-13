import { Cloud, CloudRain, Sun, Wind, Droplets } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { useEffect, useState } from 'react';

export default function WeatherWidget({ lat, lng, placeTitle }) {
    const { weather, loading, getWeather, getWeatherIcon } = useWeather();

    useEffect(() => {
        if (lat && lng) {
            getWeather(lat, lng);
        }
    }, [lat, lng, getWeather]);

    if (loading) return <div className="animate-pulse h-24 bg-gray-200 rounded-lg" />;

    if (!weather) {
        return (
            <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-500 text-sm">
                Weather unavailable
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-4 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg mb-3">{placeTitle}</h3>
            
            <div className="flex justify-between items-center mb-4">
                <div>
                    <div className="text-4xl font-bold">{Math.round(weather.temp)}°C</div>
                    <p className="text-blue-100 text-sm">{weather.description}</p>
                    <p className="text-blue-100 text-xs">Feels like {Math.round(weather.feelsLike)}°C</p>
                </div>
                <div className="text-5xl">{getWeatherIcon(weather.icon)}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white/20 p-2 rounded text-center">
                    <Droplets size={14} className="mx-auto mb-1" />
                    <div className="font-semibold">{weather.humidity}%</div>
                    <div className="text-blue-100">Humidity</div>
                </div>
                <div className="bg-white/20 p-2 rounded text-center">
                    <Wind size={14} className="mx-auto mb-1" />
                    <div className="font-semibold">{Math.round(weather.windSpeed)} km/h</div>
                    <div className="text-blue-100">Wind</div>
                </div>
                <div className="bg-white/20 p-2 rounded text-center">
                    <CloudRain size={14} className="mx-auto mb-1" />
                    <div className="font-semibold">{weather.rainChance}%</div>
                    <div className="text-blue-100">Rain</div>
                </div>
            </div>
        </div>
    );
}
