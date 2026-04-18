import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import { routes } from './routes';
import { logger } from './middleware/logger';

const app = express();

// Application-level middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// OpenAPI documentation
const specFile = fs.readFileSync('./openapi.yaml', 'utf8');
app.get('/openapi.yaml', (_request: Request, response: Response) => {
  response.type('text/yaml').send(specFile);
});
app.get('/api-docs', (_request: Request, response: Response) => {
  response.type('html').send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>TCSS 460 API Docs</title>
      </head>
      <body>
        <redoc spec-url="/openapi.yaml"></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `);
});

// Routes
app.use(routes);

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

export { app };
