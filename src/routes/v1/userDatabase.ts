import { Router } from 'express';
import { createNewUser, verifyUser } from '../../controllers/userDatabase';

const userDataRouter = Router();

userDataRouter.post('/verify', verifyUser);
userDataRouter.post('/newuser', createNewUser);

export { userDataRouter };
