export type ApplicationStatus = 'Pending' | 'Interview' | 'Rejected' | 'Offer';

export interface JobApplication {
  id: string; // UUID
  company: string;
  role: string;
  status: ApplicationStatus;
  location: string | null;
  salary_range: string | null;
  job_description: string | null;
  resume_text: string | null;
  ats_score: number; // 0.00 to 100.00
  matched_keywords: string[];
  missing_keywords: string[];
  is_stale: boolean;
  stale_flagged_at: Date | string | null;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  applied_date: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateApplicationDTO {
  company: string;
  role: string;
  status?: ApplicationStatus;
  location?: string;
  salary_range?: string;
  job_description?: string;
  resume_text?: string;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
  applied_date?: string;
}

export interface UpdateApplicationDTO {
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  location?: string;
  salary_range?: string;
  job_description?: string;
  resume_text?: string;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
  applied_date?: string;
  is_stale?: boolean;
}

export interface AtsKeywordWeight {
  term: string;
  weight: number;
}

export interface AtsScoreResult {
  atsScore: number; // 0 - 100
  matchedKeywords: string[];
  missingKeywords: string[];
  topJobKeywords: AtsKeywordWeight[];
  recommendations: string[];
  breakdown: {
    cosineSimilarity: number;
    keywordCoverage: number;
    totalJobKeywordsExtracted: number;
    matchedCount: number;
    missingCount: number;
  };
}

export interface OllamaFollowUpRequest {
  applicationId?: string;
  company?: string;
  role?: string;
  contactName?: string;
  appliedDate?: string;
  notes?: string;
  jobDescription?: string;
  resumeText?: string;
  tone?: 'professional' | 'enthusiastic' | 'direct' | 'executive';
}

export interface OllamaFollowUpResponse {
  success: boolean;
  subject: string;
  emailBody: string;
  model: string;
  isLocalLlm: boolean;
  generatedAt: string;
  diagnostics?: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  interview: number;
  rejected: number;
  offer: number;
  staleCount: number;
  avgAtsScore: number;
  interviewRatePercentage: number;
}

export interface StaleSweepResult {
  flaggedCount: number;
  flaggedApplications: Array<{
    id: string;
    company: string;
    role: string;
    applied_date: Date | string;
  }>;
  sweptAt: string;
}
