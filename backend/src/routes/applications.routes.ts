import { Router } from 'express';
import { ApplicationsController } from '../controllers/applications.controller';

const router = Router();

router.get('/stats', ApplicationsController.getStats);
router.post('/sweep-stale', ApplicationsController.sweepStale);

router.get('/', ApplicationsController.getAll);
router.get('/:id', ApplicationsController.getById);
router.post('/', ApplicationsController.create);
router.put('/:id', ApplicationsController.update);
router.patch('/:id/status', ApplicationsController.updateStatus);
router.delete('/:id', ApplicationsController.delete);

export default router;
