import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import { routes } from './routes';
import { logger } from './middleware/logger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

// OpenAPI documentation (safe path + fallback)
const openapiPaths = [
  path.resolve(__dirname, '../openapi.yaml'), // backend root
  path.resolve(process.cwd(), 'openapi.yaml'), // test workspace root
  path.resolve(process.cwd(), 'TCSS-460-Backend-1/openapi.yaml'),
];

let spec;
const specFilePath = openapiPaths.find((p) => fs.existsSync(p));

if (specFilePath) {
  const file = fs.readFileSync(specFilePath, 'utf8');
  spec = YAML.parse(file);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
} else {
  console.warn('openapi.yaml not found; API docs route disabled');
}

app.use(routes);

app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found' });
});

export { app };
