import request from 'supertest';
import { app } from '../src/app';

// Mock global fetch to avoid hitting real OpenWeatherMap in tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Full mock response matching OpenWeatherMap's shape
const mockWeatherResponse = {
  name: 'Seattle',
  sys: { country: 'US' },
  main: { temp: 12, feels_like: 10, temp_min: 9, temp_max: 14, humidity: 72 },
  weather: [{ description: 'light rain' }],
  wind: { speed: 5.2 },
};

const mockGeoCodingResponse = [
  {
    name: 'Tacoma',
    lat: 47.2455,
    lon: -122.4383,
    country: 'US',
    state: 'Washington',
  },
];

const createForecastItem = (
  dt_txt: string,
  temp: number,
  temp_min: number,
  temp_max: number,
  description = 'overcast clouds'
) => ({
  dt_txt,
  main: {
    temp,
    feels_like: temp - 1,
    temp_min,
    temp_max,
    humidity: 70,
  },
  weather: [{ description }],
  wind: { speed: 4.5 },
});

const mockFiveDayForecastResponse = {
  cod: '200',
  message: 0,
  cnt: 10,
  city: {
    name: 'Tacoma',
    country: 'US',
  },
  list: [
    createForecastItem('2026-04-19 09:00:00', 61, 58, 63),
    createForecastItem('2026-04-19 12:00:00', 66, 57, 70, 'broken clouds'),
    createForecastItem('2026-04-20 09:00:00', 55, 52, 60),
    createForecastItem('2026-04-20 12:00:00', 64, 51, 68),
    createForecastItem('2026-04-21 09:00:00', 53, 49, 59),
    createForecastItem('2026-04-21 12:00:00', 60, 48, 63),
    createForecastItem('2026-04-22 09:00:00', 50, 47, 55),
    createForecastItem('2026-04-22 12:00:00', 57, 46, 61),
    createForecastItem('2026-04-23 09:00:00', 48, 45, 54),
    createForecastItem('2026-04-23 12:00:00', 56, 44, 60),
    createForecastItem('2026-04-24 12:00:00', 59, 50, 62),
  ],
};

beforeEach(() => {
  mockFetch.mockReset();
  process.env.WEATHER_API_KEY = 'test-api-key';
});

describe('Proxy Routes', () => {
  describe('GET /proxy/weather?city=Seattle (raw pass-through)', () => {
    it('returns full weather data on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockWeatherResponse,
      });

      const res = await request(app).get('/proxy/weather?city=Seattle');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Seattle');
      expect(res.body.main.temp).toBe(12);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('q=Seattle'));
    });

    it('returns 400 when city is missing (middleware)', async () => {
      const res = await request(app).get('/proxy/weather');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/city/i);
    });

    it('returns upstream error status on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'city not found' }),
      });

      const res = await request(app).get('/proxy/weather?city=FakeCity123');
      expect(res.status).toBe(404);
    });

    it('returns 502 when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const res = await request(app).get('/proxy/weather?city=Seattle');
      expect(res.status).toBe(502);
    });
  });

  describe('GET /proxy/weather/:city (route param variant)', () => {
    it('accepts city as route param', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...mockWeatherResponse, name: 'Portland' }),
      });

      const res = await request(app).get('/proxy/weather/Portland');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Portland');
    });
  });

  describe('GET /proxy/summary?city=Seattle (transformed response)', () => {
    it('returns a simplified weather summary', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockWeatherResponse,
      });

      const res = await request(app).get('/proxy/summary?city=Seattle');
      expect(res.status).toBe(200);

      // Verify the transformed shape — not the raw OpenWeatherMap blob
      expect(res.body).toEqual({
        city: 'Seattle',
        country: 'US',
        temperature: {
          current: 12,
          feelsLike: 10,
          min: 9,
          max: 14,
        },
        conditions: 'light rain',
        humidity: 72,
        windSpeed: 5.2,
      });
    });

    it('returns 400 when city is missing (middleware)', async () => {
      const res = await request(app).get('/proxy/summary');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/city/i);
    });

    it('returns upstream error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'city not found' }),
      });

      const res = await request(app).get('/proxy/summary?city=FakeCity123');
      expect(res.status).toBe(404);
    });

    it('returns 502 when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const res = await request(app).get('/proxy/summary?city=Seattle');
      expect(res.status).toBe(502);
    });
  });

  describe('GET /proxy/summary/:city (route param variant)', () => {
    it('accepts city as route param and returns summary', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...mockWeatherResponse, name: 'Tacoma' }),
      });

      const res = await request(app).get('/proxy/summary/Tacoma');
      expect(res.status).toBe(200);
      expect(res.body.city).toBe('Tacoma');
      expect(res.body.temperature).toBeDefined();
      expect(res.body.conditions).toBe('light rain');
    });
  });

  describe('GET /proxy/forecast (raw pass-through)', () => {
    it('returns forecast data on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ city: { name: 'Seattle' }, list: [] }),
      });

      const res = await request(app).get('/proxy/forecast?city=Seattle');
      expect(res.status).toBe(200);
      expect(res.body.city.name).toBe('Seattle');
    });

    it('returns 400 when city is missing (middleware)', async () => {
      const res = await request(app).get('/proxy/forecast');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /proxy/geocoding', () => {
    it('returns geocoding data for city, state, and country', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockGeoCodingResponse,
      });

      const res = await request(app).get('/proxy/geocoding?city=Tacoma&state=WA&country=US');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGeoCodingResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=Tacoma,WA,US')
      );
    });

    it('returns 400 when state is missing', async () => {
      const res = await request(app).get('/proxy/geocoding?city=Tacoma&country=US');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/state/i);
    });

    it('returns 400 when country is missing', async () => {
      const res = await request(app).get('/proxy/geocoding?city=Tacoma&state=WA');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/country/i);
    });
  });

  describe('GET /proxy/summary/fiveday', () => {
    it('returns five daily forecast summaries', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockGeoCodingResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockFiveDayForecastResponse,
        });

      const res = await request(app).get('/proxy/summary/fiveday?city=Tacoma&state=WA&country=US');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        city: 'Tacoma',
        country: 'US',
        units: 'fahrenheit',
        days: 5,
        forecast: [
          {
            date: '2026-04-19',
            temperature: {
              temp: 66,
              feelsLike: 65,
              low: 57,
              high: 70,
            },
            conditions: 'broken clouds',
            humidity: 70,
            windSpeed: 4.5,
          },
          {
            date: '2026-04-20',
            temperature: {
              temp: 64,
              feelsLike: 63,
              low: 51,
              high: 68,
            },
            conditions: 'overcast clouds',
            humidity: 70,
            windSpeed: 4.5,
          },
          {
            date: '2026-04-21',
            temperature: {
              temp: 60,
              feelsLike: 59,
              low: 48,
              high: 63,
            },
            conditions: 'overcast clouds',
            humidity: 70,
            windSpeed: 4.5,
          },
          {
            date: '2026-04-22',
            temperature: {
              temp: 57,
              feelsLike: 56,
              low: 46,
              high: 61,
            },
            conditions: 'overcast clouds',
            humidity: 70,
            windSpeed: 4.5,
          },
          {
            date: '2026-04-23',
            temperature: {
              temp: 56,
              feelsLike: 55,
              low: 44,
              high: 60,
            },
            conditions: 'overcast clouds',
            humidity: 70,
            windSpeed: 4.5,
          },
        ],
      });
      expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining('q=Tacoma,WA,US'));
      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('units=imperial'));
    });

    it('returns 400 when required location parts are missing', async () => {
      const res = await request(app).get('/proxy/summary/fiveday?city=Tacoma');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/state/i);
    });

    it('returns upstream geocoding errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'not found' }),
      });

      const res = await request(app).get('/proxy/summary/fiveday?city=Nope&state=WA&country=US');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('could not retrieve city data');
    });

    it('returns upstream forecast errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockGeoCodingResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'forecast failed' }),
        });

      const res = await request(app).get('/proxy/summary/fiveday?city=Tacoma&state=WA&country=US');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('unable to get 5 day weather cast from OWM');
    });
  });

  describe('Missing API key (middleware)', () => {
    it('returns 500 when WEATHER_API_KEY is not set', async () => {
      delete process.env.WEATHER_API_KEY;

      const res = await request(app).get('/proxy/weather?city=Seattle');
      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/WEATHER_API_KEY/);
    });

    it('blocks summary route too when key is missing', async () => {
      delete process.env.WEATHER_API_KEY;

      const res = await request(app).get('/proxy/summary?city=Seattle');
      expect(res.status).toBe(500);
    });

    it('blocks five-day summary route too when key is missing', async () => {
      delete process.env.WEATHER_API_KEY;

      const res = await request(app).get('/proxy/summary/fiveday?city=Tacoma&state=WA&country=US');
      expect(res.status).toBe(500);
    });
  });
});
