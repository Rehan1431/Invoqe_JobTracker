import React, { useState } from 'react';
import { ApplicationStatus, JobApplication } from '../types';
import { ApplicationCard } from './ApplicationCard';
import { Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react';

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onOpenFollowUp: (app: JobApplication) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  applications,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenFollowUp
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Column Theme Configuration
  const columnConfig = {
    Pending: {
      title: 'Pending',
      icon: Clock,
      border: 'border-amber-500/30',
      headerBg: 'bg-amber-500/10',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      indicator: 'bg-amber-400',
    },
    Interview: {
      title: 'Interview',
      icon: Briefcase,
      border: 'border-blue-500/30',
      headerBg: 'bg-blue-500/10',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      indicator: 'bg-blue-400',
    },
    Offer: {
      title: 'Offer',
      icon: CheckCircle,
      border: 'border-emerald-500/30',
      headerBg: 'bg-emerald-500/10',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      indicator: 'bg-emerald-400',
    },
    Rejected: {
      title: 'Rejected',
      icon: XCircle,
      border: 'border-slate-700/50',
      headerBg: 'bg-slate-800/40',
      badge: 'bg-slate-800 text-slate-400 border-slate-700',
      indicator: 'bg-slate-500',
    },
  }[status];

  const Icon = columnConfig.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const appId = e.dataTransfer.getData('text/plain');
    if (appId) {
      onStatusChange(appId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-slate-900/60 backdrop-blur-md rounded-2xl border transition-all duration-200 min-h-[500px] ${
        isDragOver
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-slate-800/40'
          : `${columnConfig.border} hover:border-slate-700`
      }`}
    >
      {/* Column Header */}
      <div className={`p-3.5 border-b border-slate-800/80 rounded-t-2xl flex items-center justify-between ${columnConfig.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${columnConfig.indicator}`} />
          <Icon className="w-4 h-4 text-slate-300" />
          <h3 className="font-bold text-sm text-white tracking-wide">{columnConfig.title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${columnConfig.badge}`}>
          {applications.length}
        </span>
      </div>

      {/* Cards Scroll Container */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
        {applications.length === 0 ? (
          <div className="h-44 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-4">
            <Icon className="w-6 h-6 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 font-medium">No applications in {columnConfig.title}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Drag an application card here to change status</p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', app.id);
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <ApplicationCard
                application={app}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onOpenFollowUp={onOpenFollowUp}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
