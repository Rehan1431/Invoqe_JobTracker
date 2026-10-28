import { query } from '../config/db';
import {
  ApplicationStatus,
  CreateApplicationDTO,
  DashboardStats,
  JobApplication,
  StaleSweepResult,
  UpdateApplicationDTO
} from '../types/application.types';
import { calculateAtsScore } from './atsScorer.service';

/**
 * Service for Job Applications using STRICT RAW PARAMETERIZED SQL QUERIES.
 * Compliance: Zero ORMs allowed (Prisma/TypeORM prohibited).
 */
export class ApplicationsService {
  /**
   * Fetch all applications with optional search and status filtering
   */
  static async getAll(filters?: {
    status?: string;
    isStale?: boolean;
    search?: string;
  }): Promise<JobApplication[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (typeof filters?.isStale === 'boolean') {
      conditions.push(`is_stale = $${paramIndex++}`);
      values.push(filters.isStale);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      conditions.push(
        `(company ILIKE $${paramIndex} OR role ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`
      );
      values.push(`%${filters.search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        id,
        company,
        role,
        status,
        location,
        salary_range,
        job_description,
        resume_text,
        ats_score,
        matched_keywords,
        missing_keywords,
        is_stale,
        stale_flagged_at,
        contact_name,
        contact_email,
        notes,
        applied_date,
        created_at,
        updated_at
      FROM job_applications
      ${whereClause}
      ORDER BY applied_date DESC, created_at DESC;
    `;

    const result = await query<JobApplication>(sql, values);
    return result.rows;
  }

  /**
   * Fetch a single application by UUID
   */
  static async getById(id: string): Promise<JobApplication | null> {
    const sql = `
      SELECT 
        id,
        company,
        role,
        status,
        location,
        salary_range,
        job_description,
        resume_text,
        ats_score,
        matched_keywords,
        missing_keywords,
        is_stale,
        stale_flagged_at,
        contact_name,
        contact_email,
        notes,
        applied_date,
        created_at,
        updated_at
      FROM job_applications
      WHERE id = $1;
    `;

    const result = await query<JobApplication>(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new application with automated ATS keyword scoring
   */
  static async create(dto: CreateApplicationDTO): Promise<JobApplication> {
    let atsScore = 0.0;
    let matchedKeywords: string[] = [];
    let missingKeywords: string[] = [];

    // Automatically score with the offline pure TypeScript TF-IDF engine if texts provided
    if (dto.job_description && dto.resume_text) {
      const scoringResult = calculateAtsScore(dto.job_description, dto.resume_text);
      atsScore = scoringResult.atsScore;
      matchedKeywords = scoringResult.matchedKeywords;
      missingKeywords = scoringResult.missingKeywords;
    }

    const sql = `
      INSERT INTO job_applications (
        company,
        role,
        status,
        location,
        salary_range,
        job_description,
        resume_text,
        ats_score,
        matched_keywords,
        missing_keywords,
        contact_name,
        contact_email,
        notes,
        applied_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13,
        COALESCE($14::timestamptz, CURRENT_TIMESTAMP)
      )
      RETURNING *;
    `;

    const values = [
      dto.company,
      dto.role,
      dto.status || 'Pending',
      dto.location || 'Remote',
      dto.salary_range || null,
      dto.job_description || null,
      dto.resume_text || null,
      atsScore,
      JSON.stringify(matchedKeywords),
      JSON.stringify(missingKeywords),
      dto.contact_name || null,
      dto.contact_email || null,
      dto.notes || null,
      dto.applied_date ? new Date(dto.applied_date).toISOString() : null
    ];

    const result = await query<JobApplication>(sql, values);
    return result.rows[0];
  }

  /**
   * Update an existing application and recalculate ATS score if texts changed
   */
  static async update(id: string, dto: UpdateApplicationDTO): Promise<JobApplication | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const jobDescription = dto.job_description !== undefined ? dto.job_description : existing.job_description;
    const resumeText = dto.resume_text !== undefined ? dto.resume_text : existing.resume_text;

    let atsScore = existing.ats_score;
    let matchedKeywords = existing.matched_keywords;
    let missingKeywords = existing.missing_keywords;

    // Recalculate ATS score if job description or resume updated
    if (
      (dto.job_description !== undefined || dto.resume_text !== undefined) &&
      jobDescription &&
      resumeText
    ) {
      const scoring = calculateAtsScore(jobDescription, resumeText);
      atsScore = scoring.atsScore;
      matchedKeywords = scoring.matchedKeywords;
      missingKeywords = scoring.missingKeywords;
    }

    const sql = `
      UPDATE job_applications
      SET
        company = COALESCE($1, company),
        role = COALESCE($2, role),
        status = COALESCE($3, status),
        location = COALESCE($4, location),
        salary_range = COALESCE($5, salary_range),
        job_description = COALESCE($6, job_description),
        resume_text = COALESCE($7, resume_text),
        ats_score = $8,
        matched_keywords = $9::jsonb,
        missing_keywords = $10::jsonb,
        contact_name = COALESCE($11, contact_name),
        contact_email = COALESCE($12, contact_email),
        notes = COALESCE($13, notes),
        applied_date = COALESCE($14::timestamptz, applied_date),
        is_stale = COALESCE($15, is_stale)
      WHERE id = $16
      RETURNING *;
    `;

    const values = [
      dto.company !== undefined ? dto.company : null,
      dto.role !== undefined ? dto.role : null,
      dto.status !== undefined ? dto.status : null,
      dto.location !== undefined ? dto.location : null,
      dto.salary_range !== undefined ? dto.salary_range : null,
      dto.job_description !== undefined ? dto.job_description : null,
      dto.resume_text !== undefined ? dto.resume_text : null,
      atsScore,
      JSON.stringify(matchedKeywords),
      JSON.stringify(missingKeywords),
      dto.contact_name !== undefined ? dto.contact_name : null,
      dto.contact_email !== undefined ? dto.contact_email : null,
      dto.notes !== undefined ? dto.notes : null,
      dto.applied_date ? new Date(dto.applied_date).toISOString() : null,
      dto.is_stale !== undefined ? dto.is_stale : null,
      id
    ];

    const result = await query<JobApplication>(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Fast status update (e.g. Kanban drag and drop)
   */
  static async updateStatus(id: string, newStatus: ApplicationStatus): Promise<JobApplication | null> {
    // If moved to Interview or Offer, remove stale flag
    const clearStale = newStatus === 'Interview' || newStatus === 'Offer';

    const sql = `
      UPDATE job_applications
      SET 
        status = $1,
        is_stale = CASE WHEN $2::boolean THEN FALSE ELSE is_stale END
      WHERE id = $3
      RETURNING *;
    `;

    const result = await query<JobApplication>(sql, [newStatus, clearStale, id]);
    return result.rows[0] || null;
  }

  /**
   * Delete an application
   */
  static async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM job_applications WHERE id = $1 RETURNING id;`;
    const result = await query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * USP 3: Stale Application Monitor Sweep.
   * Scans for applications older than threshold (14 days) without an interview (status = 'Pending')
   * and updates them to is_stale = TRUE.
   */
  static async sweepStaleApplications(daysThreshold: number = 14): Promise<StaleSweepResult> {
    const sql = `
      UPDATE job_applications
      SET 
        is_stale = TRUE,
        stale_flagged_at = CURRENT_TIMESTAMP
      WHERE 
        status = 'Pending'
        AND applied_date <= (CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL)
        AND is_stale = FALSE
      RETURNING id, company, role, applied_date;
    `;

    const result = await query<{
      id: string;
      company: string;
      role: string;
      applied_date: Date;
    }>(sql, [daysThreshold]);

    return {
      flaggedCount: result.rowCount || 0,
      flaggedApplications: result.rows,
      sweptAt: new Date().toISOString()
    };
  }

  /**
   * Calculate aggregated dashboard metrics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const sql = `
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'Interview')::int AS interview,
        COUNT(*) FILTER (WHERE status = 'Rejected')::int AS rejected,
        COUNT(*) FILTER (WHERE status = 'Offer')::int AS offer,
        COUNT(*) FILTER (WHERE is_stale = TRUE)::int AS stale_count,
        COALESCE(ROUND(AVG(ats_score), 2), 0)::float AS avg_ats_score
      FROM job_applications;
    `;

    const res = await query(sql);
    const row = res.rows[0];

    const total = row.total || 0;
    const interview = row.interview || 0;
    const interviewRate = total > 0 ? Math.round((interview / total) * 1000) / 10 : 0;

    return {
      total,
      pending: row.pending || 0,
      interview,
      rejected: row.rejected || 0,
      offer: row.offer || 0,
      staleCount: row.stale_count || 0,
      avgAtsScore: row.avg_ats_score || 0,
      interviewRatePercentage: interviewRate
    };
  }
}
