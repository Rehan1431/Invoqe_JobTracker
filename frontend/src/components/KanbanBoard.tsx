import React, { useState, useMemo } from 'react';
import { ApplicationStatus, JobApplication } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { AlertCircle, Clock, Filter, Search, Sparkles, X } from 'lucide-react';

interface KanbanBoardProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onOpenFollowUp: (app: JobApplication) => void;
  onOpenAddModal: () => void;
  onTriggerSweep: () => void;
  isSweeping: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenFollowUp,
  onOpenAddModal,
  onTriggerSweep,
  isSweeping
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [staleOnly, setStaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  // Count stale applications
  const staleApps = applications.filter((app) => app.is_stale);

  // Filter and sort applications
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        const matchesSearch =
          app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (app.location && app.location.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStale = staleOnly ? app.is_stale : true;

        return matchesSearch && matchesStale;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          const scoreA = typeof a.ats_score === 'string' ? parseFloat(a.ats_score) : a.ats_score;
          const scoreB = typeof b.ats_score === 'string' ? parseFloat(b.ats_score) : b.ats_score;
          return scoreB - scoreA;
        }
        // Default sort by applied_date descending
        return new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime();
      });
  }, [applications, searchTerm, staleOnly, sortBy]);

  const columns: ApplicationStatus[] = ['Pending', 'Interview', 'Offer', 'Rejected'];

  return (
    <div className="space-y-5">
      {/* Stale Application Global Alert Banner (USP 3) */}
      {staleApps.length > 0 && !staleOnly && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-200">
                {staleApps.length} Application{staleApps.length > 1 ? 's' : ''} Flagged as Stale (&gt;14 Days Without Interview)
              </p>
              <p className="text-xs text-amber-300/80">
                The 24h Stale Cron Monitor detected applications needing your attention. Generate follow-up emails via Ollama Llama 3!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setStaleOnly(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow"
            >
              Filter Stale Cards
            </button>
            <button
              onClick={onTriggerSweep}
              disabled={isSweeping}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-500/40 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isSweeping ? 'Sweeping...' : 'Re-Run Sweep'}
            </button>
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, role, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Toggles and Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Stale Filter Toggle */}
          <button
            type="button"
            onClick={() => setStaleOnly(!staleOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              staleOnly
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Stale Only (&gt;14d)</span>
            {staleApps.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-200 rounded-full text-[10px]">
                {staleApps.length}
              </span>
            )}
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="date" className="bg-slate-900">Applied Date (Newest)</option>
              <option value="score" className="bg-slate-900">ATS Score (Highest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((columnStatus) => {
          const colApps = filteredApps.filter((app) => app.status === columnStatus);
          return (
            <KanbanColumn
              key={columnStatus}
              status={columnStatus}
              applications={colApps}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onOpenFollowUp={onOpenFollowUp}
            />
          );
        })}
      </div>
    </div>
  );
};
