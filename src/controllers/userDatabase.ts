import { request, Request, Response } from 'express';

type User = {
  id: number;
  username: string;
  password: string;
};

const users: User[] = [];

const demoUser: User = {
  id: 0,
  username: 'Admin',
  password: 'P@55w0rd!',
};
users.push(demoUser);

export const verifyUser = (request: Request, response: Response) => {
  const { username, password } = request.body ?? {};

  if (!username || !password) {
    return response.status(400).json({
      error: 'Username and Password must be filled!',
    });
  }
  const foundUser =
    users.find((user) => user.username === username) &&
    users.find((user) => user.password === password);

  if (!foundUser) {
    return response.status(401).json({
      error: 'Username and or password did not match. Please try again.',
    });
  }

  response.status(200).json({
    message: `${username}: Welcome!`,
  });
};

export const createNewUser = (request: Request, response: Response) => {
  const { username, password } = request.body ?? {};

  if (!username || !password) {
    return response.status(400).json({
      error: 'Username and password fields must be filled out!',
    });
  }

  const newUser: User = {
    id: users.length + 1,
    username,
    password,
  };

  users.push(newUser);

  response.status(200).json({
    message: `${username} has been created! `,
  });
};
