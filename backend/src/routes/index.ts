import { Router } from 'express';
import applicationsRouter from './applications.routes';
import atsRouter from './ats.routes';
import ollamaRouter from './ollama.routes';

const rootRouter = Router();

rootRouter.use('/applications', applicationsRouter);
rootRouter.use('/ats', atsRouter);
rootRouter.use('/ollama', ollamaRouter);

export default rootRouter;
