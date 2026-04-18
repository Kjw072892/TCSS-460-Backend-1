import { Router } from 'express';
import { getGreeting } from '../../controllers/greeting';

const greetingRouter = Router();

greetingRouter.post('/users', getGreeting);

export { greetingRouter };
