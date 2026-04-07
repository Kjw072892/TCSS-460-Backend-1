import { Router } from 'express';
import { helloRouter } from './hello';
import { inputRouter } from './input';
import { greetingRouter } from './greeting';
import { addRouter } from './math';
import { userDataRouter } from './userDatabase';

const v1Routes = Router();

v1Routes.use('/hello', helloRouter);
v1Routes.use('/input', inputRouter);
v1Routes.use('/greeting', greetingRouter);
v1Routes.use('/math', addRouter);
v1Routes.use('/login', userDataRouter);

export { v1Routes };
