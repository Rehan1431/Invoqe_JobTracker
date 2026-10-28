import { Router } from 'express';
import { AtsController } from '../controllers/ats.controller';

const router = Router();

router.post('/score', AtsController.calculateScore);

export default router;
