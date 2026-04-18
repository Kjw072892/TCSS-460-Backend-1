import { Router } from 'express';
import { helloRouter } from './hello';
import { inputRouter } from './input';
import { addRouter } from './math';
import { greetingRouter } from './greeting';

const v1Routes = Router();

v1Routes.use('/hello', helloRouter);
v1Routes.use('/input', inputRouter);
v1Routes.use('/math', addRouter);
v1Routes.use('/greeting', greetingRouter);

export { v1Routes };
