import React from 'react';
import { Briefcase, CheckCircle2, Clock, Sparkles, Target, XCircle } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsSummaryProps {
  stats: DashboardStats | null;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ stats }) => {
  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Applications',
      value: stats.total,
      subtext: 'Active pipeline',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Pending Review',
      value: stats.pending,
      subtext: `${stats.staleCount} stale (>14d)`,
      icon: Clock,
      color: stats.staleCount > 0 ? 'text-amber-400' : 'text-slate-300',
      bgColor: stats.staleCount > 0 ? 'bg-amber-500/10' : 'bg-slate-800/40',
      borderColor: stats.staleCount > 0 ? 'border-amber-500/30' : 'border-slate-800'
    },
    {
      title: 'Interview Stage',
      value: stats.interview,
      subtext: `${stats.interviewRatePercentage}% conversion`,
      icon: Briefcase,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      title: 'Job Offers',
      value: stats.offer,
      subtext: 'Offers secured',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Avg ATS Match',
      value: `${stats.avgAtsScore}%`,
      subtext: 'TF-IDF semantic match',
      icon: Sparkles,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl border ${card.borderColor} ${card.bgColor} backdrop-blur-md transition-all hover:scale-[1.02] shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">{card.title}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-2xl font-black text-white tracking-tight">{card.value}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">{card.subtext}</div>
          </div>
        );
      })}
    </div>
  );
};
