import { Router } from 'express';
import { add } from '../../controllers/math';

const addRouter = Router();

addRouter.get('/add', add);

export { addRouter };
