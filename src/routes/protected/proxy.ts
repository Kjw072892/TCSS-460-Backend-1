import { Router } from 'express';
import { getWeather, getWeatherSummary, getForecast} from '../../controllers/proxy';
import { getGeoCoding } from '../../controllers/geocoding';
import {getTransformedFiveDay} from '../../controllers/fiveDayForecast';
import { requireEnvVar, requireCity, requireCityQuery, requireStateCode, requireCountryCode } from '../../middleware/validation';

const proxyRouter = Router();

// All proxy routes require the API key to be configured
proxyRouter.use(requireEnvVar('WEATHER_API_KEY'));

// Raw pass-through
proxyRouter.get('/weather', requireCity, getWeather);
proxyRouter.get('/weather/:city', requireCity, getWeather);
proxyRouter.get('/forecast', requireCityQuery, getForecast);
proxyRouter.get('/geocoding', requireCity, requireStateCode, requireCountryCode, getGeoCoding);

// Transformed response — curates the raw data into a simplified shape

proxyRouter.get('/summary/fiveday', requireCity, requireStateCode, requireCountryCode, getTransformedFiveDay);

proxyRouter.get('/summary', requireCity, getWeatherSummary);
proxyRouter.get('/summary/:city', requireCity, getWeatherSummary);


export { proxyRouter };
