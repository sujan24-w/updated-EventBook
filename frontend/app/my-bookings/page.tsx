'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Booking {
  booking_id: string;
  booking_status: 'ACTIVE' | 'CANCELLED';
  booked_at: string;
  event_id: string;
  title: string;
  description: string;
  starts_at: string;
  venue: string;
  image_url?: string;
  event_cancelled: boolean;
}

export default function MyBookingsPage() {
  return (
    <ProtectedRoute>
      <MyBookingsContent />
    </ProtectedRoute>
  );
}

 function MyBookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);
  
  // Custom Modal States
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchMyBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/bookings/me');
      setBookings(response.data.bookings);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    const bookingId = bookingToCancel.booking_id;
    setCancellingId(bookingId);
    setActionMessage(null);

    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`);
      
      setActionMessage({
        id: bookingId,
        type: 'success',
        text: response.data.message || 'Booking cancelled successfully.',
      });

      setBookingToCancel(null); // Close modal
      await fetchMyBookings();
    } catch (err: any) {
      setActionMessage({
        id: bookingId,
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel booking.',
      });
      setBookingToCancel(null);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-32">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-500 text-sm font-medium">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your event registrations and active seat reservations.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-blue-100 p-8 shadow-sm">
          <svg className="w-14 h-14 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-bold text-slate-800">No bookings found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">You haven't booked any event seats yet.</p>
          <Link
            href="/events"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 transition"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const startDate = new Date(b.starts_at).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <div 
                key={b.booking_id} 
                className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition hover:shadow-md"
              >
                {/* Event Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      b.booking_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {b.booking_status === 'ACTIVE' ? 'Event Booked by User' : 'Event Cancled by User'}
                    </span>
                    {b.event_cancelled && (
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                        Event Cancelled by Organizer 
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{b.title}</h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {startDate} &bull; {b.venue || 'Online'}
                  </p>

                  {/* Feedback Message */}
                  {actionMessage && actionMessage.id === b.booking_id && (
                    <p className={`text-xs font-medium mt-2 ${
                      actionMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {actionMessage.text}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <Link
                    href={`/events/${b.event_id}`}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition"
                  >
                    View Event
                  </Link>

                 {b.booking_status === 'ACTIVE' && (
  (() => {
    const isPastEvent = new Date(b.starts_at) <= new Date();

    if (isPastEvent) {
      return (
        <span className="px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl border border-slate-200">
          Cannot Be Cancelled (Past)
        </span>
      );
    }

    if (b.event_cancelled) {
      return (
        <span className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
         Cancel Booking
        </span>
      );
    }

    return (
      <button
        onClick={() => setBookingToCancel(b)}
        disabled={cancellingId === b.booking_id}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
      >
        Cancel Booking
      </button>
    );
  })()
)}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Custom Confirmation Modal Popup Box */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-blue-100 text-center animate-in fade-in zoom-in duration-200 relative">
            
            {/* Close X Button in top corner */}
            <button 
              onClick={() => setBookingToCancel(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Cancel Booking?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to cancel your seat for <span className="font-semibold text-slate-800">"{bookingToCancel.title}"</span>?
            </p>

            {/* Tick (Confirm) and X (Cancel Process) Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setBookingToCancel(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>No (Keep)</span>
              </button>

              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Yes (Cancel)</span>
              </button>
            </div>
    
          </div>
        </div>
      )}

    </div>
  );
}