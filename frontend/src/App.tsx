import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { StatsSummary } from './components/StatsSummary';
import { KanbanBoard } from './components/KanbanBoard';
import { ApplicationModal } from './components/ApplicationModal';
import { FollowUpModal } from './components/FollowUpModal';
import { AtsCalculatorModal } from './components/AtsCalculatorModal';
import { useApplications } from './hooks/useApplications';
import { JobApplication, CreateApplicationInput } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const {
    applications,
    stats,
    ollamaStatus,
    loading,
    error,
    isSweeping,
    refresh,
    createApplication,
    updateApplication,
    updateStatus,
    deleteApplication,
    triggerSweep
  } = useApplications();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [followUpApp, setFollowUpApp] = useState<JobApplication | null>(null);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);

  // Handlers
  const handleOpenAdd = () => {
    setEditingApp(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (app: JobApplication) => {
    setEditingApp(app);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingApp(null);
  };

  const handleSubmitApplication = async (data: CreateApplicationInput) => {
    if (editingApp) {
      await updateApplication(editingApp.id, data);
    } else {
      await createApplication(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job application?')) {
      try {
        await deleteApplication(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete application');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenAddModal={handleOpenAdd}
        onOpenAtsCalculator={() => setIsAtsModalOpen(true)}
        onTriggerSweep={triggerSweep}
        isSweeping={isSweeping}
        ollamaStatus={ollamaStatus}
        staleCount={stats?.staleCount || 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-bold">Backend Connection Failed</p>
                <p className="text-rose-400/80 mt-0.5">{error}. Ensure the Express server is running on port 5000.</p>
              </div>
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-xl transition-colors font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Dashboard Overview Metrics */}
        <StatsSummary stats={stats} />

        {/* Loading State or Kanban Board */}
        {loading && applications.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              Connecting to PostgreSQL 18 & loading applications...
            </p>
          </div>
        ) : (
          <KanbanBoard
            applications={applications}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onStatusChange={updateStatus}
            onOpenFollowUp={(app) => setFollowUpApp(app)}
            onOpenAddModal={handleOpenAdd}
            onTriggerSweep={triggerSweep}
            isSweeping={isSweeping}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Invoqe Internship Task 3 &bull; Full-Stack Job Application Tracker
          </p>
          <p className="text-[11px] text-slate-600">
            Node.js &bull; Express.js &bull; TypeScript &bull; PostgreSQL 18 (pg-pool) &bull; React 18 &bull; Vite &bull; Tailwind CSS &bull; 100% Local
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ApplicationModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSubmit={handleSubmitApplication}
        application={editingApp}
      />

      {followUpApp && (
        <FollowUpModal
          application={followUpApp}
          isOpen={!!followUpApp}
          onClose={() => setFollowUpApp(null)}
        />
      )}

      <AtsCalculatorModal
        isOpen={isAtsModalOpen}
        onClose={() => setIsAtsModalOpen(false)}
      />
    </div>
  );
};

export default App;
