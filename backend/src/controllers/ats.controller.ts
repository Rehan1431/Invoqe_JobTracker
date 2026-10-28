import { Request, Response, NextFunction } from 'express';
import { calculateAtsScore } from '../services/atsScorer.service';

export class AtsController {
  /**
   * Endpoint: POST /api/ats/score
   * Analyzes job description against resume text using the in-memory TF-IDF engine
   */
  static calculateScore(req: Request, res: Response, next: NextFunction): void {
    try {
      const { jobDescription, resumeText } = req.body;

      if (!jobDescription || typeof jobDescription !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Field "jobDescription" is required and must be a string'
        });
        return;
      }

      if (!resumeText || typeof resumeText !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Field "resumeText" is required and must be a string'
        });
        return;
      }

      const result = calculateAtsScore(jobDescription, resumeText);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
