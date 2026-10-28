import {
  ApplicationStatus,
  AtsScoreResult,
  CreateApplicationInput,
  DashboardStats,
  JobApplication,
  OllamaFollowUpRequest,
  OllamaFollowUpResponse,
  OllamaHealthStatus,
  UpdateApplicationInput
} from '../types';

const API_BASE = '/api';

export const api = {
  // Applications
  async getApplications(params?: {
    status?: string;
    isStale?: boolean;
    search?: string;
  }): Promise<JobApplication[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.isStale !== undefined) query.set('isStale', String(params.isStale));
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/applications?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch applications');
    const json = await res.json();
    return json.data;
  },

  async getApplicationById(id: string): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/applications/${id}`);
    if (!res.ok) throw new Error('Failed to fetch application');
    const json = await res.json();
    return json.data;
  },

  async createApplication(data: CreateApplicationInput): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create application');
    }
    const json = await res.json();
    return json.data;
  },

  async updateApplication(id: string, data: UpdateApplicationInput): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update application');
    }
    const json = await res.json();
    return json.data;
  },

  async updateStatus(id: string, status: ApplicationStatus): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update status');
    }
    const json = await res.json();
    return json.data;
  },

  async deleteApplication(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete application');
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/applications/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const json = await res.json();
    return json.data;
  },

  async sweepStale(days: number = 14): Promise<{ flaggedCount: number; sweptAt: string }> {
    const res = await fetch(`${API_BASE}/applications/sweep-stale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days })
    });
    if (!res.ok) throw new Error('Failed to run stale sweep');
    const json = await res.json();
    return json.data;
  },

  // USP 1: Pure TypeScript TF-IDF ATS Scorer
  async calculateAtsScore(jobDescription: string, resumeText: string): Promise<AtsScoreResult> {
    const res = await fetch(`${API_BASE}/ats/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription, resumeText })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to score ATS keywords');
    }
    const json = await res.json();
    return json.data;
  },

  // USP 2: Local Ollama Follow-Up Generator
  async generateFollowUp(request: OllamaFollowUpRequest): Promise<OllamaFollowUpResponse> {
    const res = await fetch(`${API_BASE}/ollama/generate-followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate follow-up email');
    }
    const json = await res.json();
    return json.data;
  },

  async getOllamaStatus(): Promise<OllamaHealthStatus> {
    try {
      const res = await fetch(`${API_BASE}/ollama/status`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      return json.data;
    } catch {
      return { online: false, models: [], url: 'http://127.0.0.1:11434' };
    }
  },

  async getHealth(): Promise<boolean> {
    try {
      const res = await fetch('/health');
      return res.ok;
    } catch {
      return false;
    }
  }
};
