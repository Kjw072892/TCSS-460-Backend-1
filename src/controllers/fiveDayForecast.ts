import {Request, Response} from 'express';

const GEO_BASE_URL = 'http://api.openweathermap.org/geo/1.0/direct';
const BASE_URL = 'http://api.openweathermap.org/data/2.5/forecast'

type ForecastItem = {
    main: {
        temp: number;
        temp_min: number;
        temp_max: number;
        feels_like: number;
        humidity: number;
    };
    weather: {
        description: string;
    }[];
    wind: {
        speed: number;
    };
    dt_txt: string;
};


export const getTransformedFiveDay = async (request: Request, response: Response) => {

    const city = request.query.city || request.params.city as string;
    const state_code = request.query.state || request.params.state as string;
    const country_code = request.query.country || request.params.country as string;

    const apiKey = process.env.WEATHER_API_KEY;



    try {
        
        const city_geocoding_data = await fetch(
            `${GEO_BASE_URL}?q=${encodeURIComponent(String(city))},${encodeURIComponent(String(state_code))},${encodeURIComponent(String(country_code))}&limit=1&appid=${apiKey}`
        );

        const geo_data = (await city_geocoding_data.json()) as Record<string, unknown>[];

        const location = geo_data[0];

        if(!city_geocoding_data.ok) {
            response.status(city_geocoding_data.status).json({error:'could not retrieve city data'});
            return;
        }

        const lat = location.lat;
        const lon = location.lon;


        const result = await fetch (
            `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
        );

        const data = (await result.json()) as {
            cod: string;
            message: number;
            cnt: number;
            city: {
                name :string;
                country: string;
            };
            list: ForecastItem[];
        };

        if(!result.ok) {
            response.status(result.status).json({error: 'unable to get 5 day weather cast from OWM'});
            return;
        }


        const forecastsByDate = data.list.reduce((forecastByDate, forecast) => {
                const date = forecast.dt_txt.split(' ')[0];
                const currentForecasts = forecastByDate.get(date) || [];

                currentForecasts.push(forecast);
                forecastByDate.set(date, currentForecasts);

                return forecastByDate;
            }, new Map<string, ForecastItem[]>());

        const forecastSummary = Array.from(forecastsByDate.entries()).slice(0, 5).map(([date, forecasts]) => {
            const representativeForecast =
                forecasts.find((forecast) => forecast.dt_txt.endsWith('12:00:00')) || forecasts[0];

            return {
                date,
                temperature: {
                    temp: representativeForecast.main.temp,
                    feelsLike: representativeForecast.main.feels_like,
                    low: Math.min(...forecasts.map((forecast) => forecast.main.temp_min)),
                    high: Math.max(...forecasts.map((forecast) => forecast.main.temp_max)),
                },
                conditions: representativeForecast.weather[0]?.description,
                humidity: representativeForecast.main.humidity,
                windSpeed: representativeForecast.wind.speed,
            };
        });

        response.status(200).json({
            city: data.city.name,
            country: data.city.country,
            units: 'fahrenheit',
            days: forecastSummary.length,
            forecast: forecastSummary,
        });

    } catch(_error) {
        response.status(502).json({error:'Weather API failed.'})
    }

}
