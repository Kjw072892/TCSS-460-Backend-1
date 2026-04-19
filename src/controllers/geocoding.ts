import {Request, Response} from 'express';

const BASE_URL = 'http://api.openweathermap.org/geo/1.0/direct';


export const getGeoCoding = async (request:Request, response:Response) => {
    const city = request.query.city || request.params.city as string;
    const state_code = request.query.state || request.params.state as string;
    const country_code = request.query.country || request.params.country as string;

    const apiKey = process.env.WEATHER_API_KEY;

    try{

        const result = await fetch(
            `${BASE_URL}?q=${encodeURIComponent(String(city))},${encodeURIComponent(String(state_code))},${encodeURIComponent(String(country_code))}&limit=5&appid=${apiKey}`
        );

        const data = (await result.json()) as Record<string, unknown>;

        if(!result.ok) {
            response.status(result.status).json({
                error: result.status,
                message: data.message || 'Weather API Error'
            });
        }

        response.status(200).json(data);

    } catch(_error) {
        response.status(502).json({
            error: 502,
            message: "There was an error searching for the geocode of the city."
        });
    }
};





