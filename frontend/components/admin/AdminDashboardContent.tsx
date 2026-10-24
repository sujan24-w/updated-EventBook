'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import EventFormModal from './EventFormModel';
import EventBookingModal from './EventBookingModel';
import Pagination from '../Pagination';

export default function AdminDashboardContent() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [eventDataAdmin, setEventDataAdmin] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
 const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedEventForBookings, setSelectedEventForBookings] = useState<any>(null);

// Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;
  const fetchAdminData = async (targetPage= page) => {
    setLoading(true);
    setError('');
    try {
      
      const dashRes = await api.get('/admin/dashboard');
      setDashboardData(dashRes.data);

     
      const eventsRes = await api.get('/admin/events',{params:{page:targetPage,limit}});
      setEventDataAdmin(eventsRes.data.events || []);
      setTotalPages(eventsRes.data.totalPages || 1);
    } catch (err: any) {
      console.error('Admin fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    fetchAdminData(page);
  }, [page]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Action Handlers
  const handleCancelEvent = async (id: string, title:string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Event?',
      description: `Are you sure you want to cancel "${title}"? Attendees will be notified.`,
      action: async () => {
        const res = await api.patch(`/admin/${id}/cancel`);
        showFeedback('success', res.data.message || 'Event cancelled successfully');
        fetchAdminData();
      },
    });
  };

  const handleSoftDeleteEvent = async (id: string, title:string) => {
   setConfirmModal({
      isOpen: true,
      title: 'Soft Delete Event?',
      description: `Are you sure you want to hide "${title}" from the public listing?`,
      action: async () => {
        const res = await api.delete(`/admin/${id}`);
        showFeedback('success', res.data.message || 'Event soft deleted successfully');
        fetchAdminData();
      },
    });
  };
  const handleHardDeleteEvent = async (id: string, title:string) => {
   setConfirmModal({
      isOpen: true,
      title: 'Permanent Delete Event?',
      description: `WARNING: "${title}" will be permanently deleated from database?`,
      action: async () => {
        try{
        const res = await api.delete(`/admin/harddelete/${id}`);
        showFeedback('success', res.data.message || 'Event Permanently deleted !!!');
        setConfirmModal(null);
        fetchAdminData(page);
        }catch(error:any){
          const errorMessage = error.response?.data?.message || 'Cannot permanently delete event with existing bookings.';
          setModalError(errorMessage);
        }
      },
    });
  };

  const handleRestoreEvent = async (id: string, title:string) => {
   setConfirmModal({
      isOpen: true,
      title: 'Restore Event?',
      description: `Are you sure you want to restore "${title}" back to active status?`,
      action: async () => {
        const res = await api.patch(`/admin/${id}/restore`);
        showFeedback('success', res.data.message || 'Event permanently deleted');
        fetchAdminData();
      },
    });
  };



  if (loading && eventDataAdmin.length === 0 ) {
    return (
      <div className="text-center py-32">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-500 text-sm font-medium">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform events, monitor bookings, and oversee system activity.</p>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setIsCreateModalOpen(true); }}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Event</span>
        </button>
      </div>
      {actionMessage && (
        <div className={`p-4 rounded-2xl mb-6 text-sm font-medium border ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Dashboard Statistics Overview Cards */}
      {dashboardData?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Events</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{dashboardData.stats.total_events || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Bookings</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-2">{dashboardData.stats.active_bookings || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{dashboardData.stats.upcoming_events || 0}</p>
          </div>
           <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Events</p>
            <p className="text-3xl font-extrabold text-green-600 mt-2">{dashboardData.stats.completed_events || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cancelled Events</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-2">{dashboardData.stats.total_users || 0}</p>
          </div>
        </div>
      )}

      {/* Events Management Table */}
      <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Event Management</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                <th className="p-4 sm:px-6">Title</th>
                <th className="p-4">Starts At</th>
                <th className="p-4">Status</th>
                <th className="p-4">Seats</th>
                <th className="p-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {eventDataAdmin.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 sm:px-6 font-semibold text-slate-900 max-w-xs truncate">
                    {evt.title}
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    {new Date(evt.starts_at).toLocaleDateString()}
                  </td>
                 <td className="p-4">
  {evt.is_deleted ? (
    <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
      Deleted (Archived)
    </span>
  ) : evt.is_cancelled ? (
    <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-red-100 text-red-700">
      Cancelled
    </span>
  ) : (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-xl  ${
      evt.event_status === 'COMPLETED'
        ? 'bg-blue-100 text-blue-700'
        : evt.event_status === 'UPCOMING'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-indigo-100 text-indigo-700'
    }`}>
      {evt.event_status || 'Active'}
    </span>
  )}
</td>
                  <td className="p-4 text-slate-600 text-xs font-medium">
                    {evt.available_seats} / {evt.total_seats} left
                  </td>
                 <td className="p-4 sm:px-6 text-right space-x-2">
                    <button
                      onClick={() => setSelectedEventForBookings(evt)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition"
                    >
                      Booked By  
                    </button>
                    <button
                      onClick={() => { setEditingEvent(evt); setIsCreateModalOpen(true); }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                    >
                      Edit
                    </button>
                    {!evt.is_cancelled && (
                      <button
                        onClick={() => handleCancelEvent(evt.id, evt.title)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg transition"
                      >
                        Cancel
                      </button>
                    )}
                    {evt.is_deleted ? (
                      <>
                        <button
                          onClick={() => handleRestoreEvent(evt.id, evt.title)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleHardDeleteEvent(evt.id, evt.title)}
                          className="px-3 py-1.5 bg-rose-900 hover:bg-rose-950 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Delet Event 
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleSoftDeleteEvent(evt.id, evt.title)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition"
                      >
                         soft Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
             <Pagination
             page={page}
            totalPages={totalPages}
            hasNextPage={page < totalPages}
            hasPreviousPage={page > 1}
            onPageChange={(newPage) => {
              setPage(newPage);
            }}
             />
        </div>
      </div>
      {/* Custom Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-blue-100 text-center relative">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 mb-6">{confirmModal.description}</p>
           {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium text-left">
                {modalError}
              </div>
            )}

            {modalError ? 
             (
             <button
                onClick={() => { setConfirmModal(null); setModalError(null); }}
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                OK
              </button>
             )
            : ( 
            <div className="flex items-center space-x-3">
            
              <button
                onClick={() => {setConfirmModal(null); setModalError(null);}}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                
                    await confirmModal.action();
                   
                  
                    
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                Confirm
              </button>
            </div> )
           }
          </div>
        </div>
        
      )}
      {/* Modals */}
      {isCreateModalOpen && (
        <EventFormModal
          eventToEdit={editingEvent}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={fetchAdminData}
        />
      )}

      {selectedEventForBookings && (
        <EventBookingModal
          event={selectedEventForBookings}
          onClose={() => setSelectedEventForBookings(null)}
        />
      )}

    </div>
  );
}