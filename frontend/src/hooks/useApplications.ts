import { useState, useEffect, useCallback } from 'react';
import {
  ApplicationStatus,
  CreateApplicationInput,
  DashboardStats,
  JobApplication,
  OllamaHealthStatus,
  UpdateApplicationInput
} from '../types';
import { api } from '../services/api';

export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaHealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [appsData, statsData, ollamaData] = await Promise.all([
        api.getApplications(),
        api.getStats(),
        api.getOllamaStatus()
      ]);
      setApplications(appsData);
      setStats(statsData);
      setOllamaStatus(ollamaData);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setError(err.message || 'Error connecting to backend API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Application
  const createApplication = async (input: CreateApplicationInput) => {
    const created = await api.createApplication(input);
    setApplications((prev) => [created, ...prev]);
    // Refresh stats
    api.getStats().then(setStats).catch(console.error);
    return created;
  };

  // Update Application
  const updateApplication = async (id: string, input: UpdateApplicationInput) => {
    const updated = await api.updateApplication(id, input);
    setApplications((prev) => prev.map((app) => (app.id === id ? updated : app)));
    api.getStats().then(setStats).catch(console.error);
    return updated;
  };

  // Update Status (Optimistic)
  const updateStatus = async (id: string, newStatus: ApplicationStatus) => {
    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status: newStatus,
              is_stale: newStatus === 'Interview' || newStatus === 'Offer' ? false : app.is_stale
            }
          : app
      )
    );

    try {
      const serverUpdated = await api.updateStatus(id, newStatus);
      setApplications((prev) => prev.map((app) => (app.id === id ? serverUpdated : app)));
      api.getStats().then(setStats).catch(console.error);
    } catch (err) {
      // Revert if error
      loadData();
      throw err;
    }
  };

  // Delete Application
  const deleteApplication = async (id: string) => {
    await api.deleteApplication(id);
    setApplications((prev) => prev.filter((app) => app.id !== id));
    api.getStats().then(setStats).catch(console.error);
  };

  // Manual Trigger Stale Sweep (USP 3)
  const triggerSweep = async () => {
    setIsSweeping(true);
    try {
      await api.sweepStale(14);
      // Refresh list and stats
      const [appsData, statsData] = await Promise.all([
        api.getApplications(),
        api.getStats()
      ]);
      setApplications(appsData);
      setStats(statsData);
    } catch (err) {
      console.error('Sweep failed:', err);
    } finally {
      setIsSweeping(false);
    }
  };

  return {
    applications,
    stats,
    ollamaStatus,
    loading,
    error,
    isSweeping,
    refresh: loadData,
    createApplication,
    updateApplication,
    updateStatus,
    deleteApplication,
    triggerSweep
  };
}
