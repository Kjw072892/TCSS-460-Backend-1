import { Request, Response } from 'express';

export const add = (request: Request, response: Response) => {
  const q = request.query.q;

  if (typeof q !== 'string') {
    return response.status(400).json({
      message: 'The query must be included in URL.',
      error: `${q} is invalid; Status 400`,
    });
  }

  const match = q.match(/^(\d+)\+(\d+)$/);

  if (!match) {
    return response.status(400).json({
      error: 'The addition can only handle numbers.',
    });
  }

  const left = Number(match[1]);
  const right = Number(match[2]);

  response.json({
    expression: q,
    result: `${left + right}`,
  });
};
