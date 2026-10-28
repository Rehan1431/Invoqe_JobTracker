import { Request, Response, NextFunction } from 'express';
import { ApplicationsService } from '../services/applications.service';
import { ApplicationStatus } from '../types/application.types';

export class ApplicationsController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, isStale, search } = req.query;
      const filters: { status?: string; isStale?: boolean; search?: string } = {};

      if (status && typeof status === 'string') {
        filters.status = status;
      }
      if (isStale !== undefined) {
        filters.isStale = isStale === 'true';
      }
      if (search && typeof search === 'string') {
        filters.search = search;
      }

      const applications = await ApplicationsService.getAll(filters);
      res.json({
        success: true,
        count: applications.length,
        data: applications
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ApplicationsService.getDashboardStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const application = await ApplicationsService.getById(id);
      if (!application) {
        res.status(404).json({
          success: false,
          error: `Application with ID '${id}' not found`
        });
        return;
      }

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { company, role } = req.body;
      if (!company || !role) {
        res.status(400).json({
          success: false,
          error: 'Company and Role fields are required'
        });
        return;
      }

      const application = await ApplicationsService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Application created successfully',
        data: application
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await ApplicationsService.update(id, req.body);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Application with ID '${id}' not found`
        });
        return;
      }

      res.json({
        success: true,
        message: 'Application updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses: ApplicationStatus[] = ['Pending', 'Interview', 'Rejected', 'Offer'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      const updated = await ApplicationsService.updateStatus(id, status);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: `Application with ID '${id}' not found`
        });
        return;
      }

      res.json({
        success: true,
        message: `Status updated to ${status}`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await ApplicationsService.delete(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: `Application with ID '${id}' not found`
        });
        return;
      }

      res.json({
        success: true,
        message: 'Application deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async sweepStale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const thresholdDays = req.body?.days ? parseInt(req.body.days, 10) : 14;
      const result = await ApplicationsService.sweepStaleApplications(thresholdDays);
      res.json({
        success: true,
        message: `Sweep finished: ${result.flaggedCount} application(s) flagged as stale`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
