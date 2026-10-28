import React from 'react';
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit2,
  MapPin,
  Sparkles,
  Trash2,
  ArrowRightCircle
} from 'lucide-react';
import { ApplicationStatus, JobApplication } from '../types';
import { AtsScoreBar } from './AtsScoreBar';

interface ApplicationCardProps {
  application: JobApplication;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onOpenFollowUp: (app: JobApplication) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenFollowUp
}) => {
  // Format elapsed time
  const appliedDate = new Date(application.applied_date);
  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const formatDaysAgo = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const statusOptions: ApplicationStatus[] = ['Pending', 'Interview', 'Offer', 'Rejected'];

  return (
    <div
      className={`group relative bg-slate-900/90 border rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 space-y-3.5 ${
        application.is_stale
          ? 'border-amber-500/50 shadow-amber-500/5 bg-slate-900/95'
          : 'border-slate-800 hover:border-slate-700/80 shadow-black/20'
      }`}
    >
      {/* Stale Warning Banner */}
      {application.is_stale && (
        <div className="flex items-center justify-between px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Stale Application (&gt;14d without interview)</span>
          </div>
          <button
            onClick={() => onOpenFollowUp(application)}
            className="text-[11px] font-bold text-amber-200 hover:text-white underline underline-offset-2 flex items-center gap-1"
          >
            Draft Follow-up &rarr;
          </button>
        </div>
      )}

      {/* Header: Company & Role */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-0.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{application.company}</span>
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {application.role}
          </h4>
        </div>

        {/* Quick action icons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(application)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Edit Application"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(application.id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Delete Application"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tags: Location, Salary, Applied Date */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        {application.location && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{application.location}</span>
          </div>
        )}
        {application.salary_range && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60 text-emerald-400">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span>{application.salary_range}</span>
          </div>
        )}
        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60 text-slate-400">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Applied: {formatDaysAgo(diffDays)}</span>
        </div>
      </div>

      {/* ATS Match Score Bar */}
      <AtsScoreBar
        score={application.ats_score}
        matchedKeywords={application.matched_keywords}
        missingKeywords={application.missing_keywords}
      />

      {/* Footer Controls: Status Transition + Ollama Follow-Up */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {/* Quick status selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowRightCircle className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={application.status}
            onChange={(e) => onStatusChange(application.id, e.target.value as ApplicationStatus)}
            className="bg-slate-950 text-slate-300 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-blue-500"
          >
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                Move: {st}
              </option>
            ))}
          </select>
        </div>

        {/* Ollama Follow-up Trigger Button */}
        <button
          type="button"
          onClick={() => onOpenFollowUp(application)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shadow-sm ${
            application.is_stale
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20 hover:brightness-110'
              : 'bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white'
          }`}
          title="Draft Follow-up email using local Ollama (Llama 3)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Follow-Up</span>
        </button>
      </div>
    </div>
  );
};
