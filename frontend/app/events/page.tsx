'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import EventCard from '@/components/EventsCard';
import EventFilters from '@/components/EventFilters';
import Pagination from '@/components/Pagination';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Query states matching  backend schema
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('soonest');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(6);

  // Pagination metadata state
  const [pagination, setPagination] = useState({
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchEvents = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/events', {
        params: {
          search,
          sort,
          availability: availability || undefined,
          page,
          limit,
        },
      });

      setEvents(response.data.events);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, sort, availability]);

  // Fetch whenever page or filters update
  useEffect(() => {
    fetchEvents();
  }, [search, sort, availability, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore Events</h1>
        <p className="text-sm text-slate-500 mt-1">Browse upcoming tech events, workshops, and reserve your seat.</p>
      </div>

      {/* Filters Component */}
      <EventFilters
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
        availability={availability}
        setAvailability={setAvailability}
      />

      {/* UI States: Loading, Error, Empty, Data */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-500 text-sm font-medium">Loading events...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center text-sm font-medium">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-blue-100 p-8">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold text-slate-800">No events found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search terms or availability filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      )}

      {/* Pagination Component */}
      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        hasNextPage={pagination.hasNextPage}
        hasPreviousPage={pagination.hasPreviousPage}
        onPageChange={(newPage) => setPage(newPage)}
      />

    </div>
  );
}