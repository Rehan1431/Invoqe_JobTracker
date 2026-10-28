import { Request, Response, NextFunction } from 'express';
import { ApplicationsService } from '../services/applications.service';
import { checkOllamaHealth, generateFollowUpEmail } from '../services/ollama.service';
import { OllamaFollowUpRequest } from '../types/application.types';

export class OllamaController {
  /**
   * Endpoint: POST /api/ollama/generate-followup
   * Connects to local offline Ollama instance at http://127.0.0.1:11434/api/generate (Llama 3)
   */
  static async generateFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload: OllamaFollowUpRequest = req.body;

      // If applicationId provided, pull context directly from database
      if (payload.applicationId) {
        const app = await ApplicationsService.getById(payload.applicationId);
        if (app) {
          payload.company = payload.company || app.company;
          payload.role = payload.role || app.role;
          payload.contactName = payload.contactName || app.contact_name || undefined;
          payload.appliedDate = payload.appliedDate || (app.applied_date ? app.applied_date.toString() : undefined);
          payload.notes = payload.notes || app.notes || undefined;
          payload.jobDescription = payload.jobDescription || app.job_description || undefined;
          payload.resumeText = payload.resumeText || app.resume_text || undefined;
        }
      }

      if (!payload.company || !payload.role) {
        res.status(400).json({
          success: false,
          error: 'Both "company" and "role" are required to draft a personalized follow-up email'
        });
        return;
      }

      const result = await generateFollowUpEmail(payload);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint: GET /api/ollama/status
   * Real-time status probe of local Ollama runtime
   */
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await checkOllamaHealth();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
}
