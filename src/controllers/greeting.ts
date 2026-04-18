import { Request, Response } from 'express';

export const getGreeting = (request: Request, response: Response) => {
  const { name } = request.body ?? {};

  if (!name) {
    return response.status(400).json({ error: 'Name is required' });
  }
  response.json({ message: `Hello ${name}!` });
};
