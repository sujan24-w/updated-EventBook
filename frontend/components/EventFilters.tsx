interface FiltersProps {
  search: string;
  setSearch: (val: string) => void;
  sort: string;
  setSort: (val: string) => void;
  availability: string;
  setAvailability: (val: string) => void;
}

export default function EventFilters({
  search,
  setSearch,
  sort,
  setSort,
  availability,
  setAvailability,
}: FiltersProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-blue-100 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* Search Input */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Search Event</label>
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 text-sm transition"
        />
      </div>

      {/* Sort Dropdown */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Sort By</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 text-sm bg-white transition"
        >
          <option value="soonest">Soonest First</option>
          <option value="latest">Latest First</option>
          <option value="shortest">Shortest Duration</option>
          <option value="longest">Longest Duration</option>
          <option value="seats_high">Most Seats Available</option>
          <option value="seats_low">Fewest Seats Available</option>
        </select>
      </div>

      {/* Availability Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Availability</label>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 text-sm bg-white transition"
        >
          <option value="">All Events</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed / Past</option>
          <option value="available">Available Seats</option>
          <option value="soldout">Sold Out</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

    </div>
  );
}