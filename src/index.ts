import 'dotenv/config';
import { app } from './app';
import { Request, Response } from 'express';

const PORT = parseInt(process.env.PORT || '3000', 10);

app.get('/', (request: Request, response: Response) => {
  response.json({ message: 'Hello from  Express' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API docs at http://localhost:${PORT}/api-docs`);
});
