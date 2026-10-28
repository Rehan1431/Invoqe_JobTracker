import { Router } from 'express';
import { OllamaController } from '../controllers/ollama.controller';

const router = Router();

router.post('/generate-followup', OllamaController.generateFollowUp);
router.get('/status', OllamaController.getStatus);

export default router;
