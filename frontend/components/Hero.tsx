import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-10 lg:py-20 bg-linear-to-b from-blue-50/50 via-white to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      
   
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-400/10 dark:bg-blue-00/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
      
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
          <span>Live Seat Availability </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Discover & Book Seats for Exclusive <span className="text-blue-600 dark:text-blue-400">Tech Events</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal">
          Browse upcoming developer conferences, workshops, and tech meetups. Reserve your seat in real-time with zero hassle.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/events"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-center"
          >
            Explore Events
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-center"
          >
            Create Account
          </Link>
        </div>

        {/* Feature Counters */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto border-t border-slate-200 dark:border-slate-800 pt-10">
          <div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">100%</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Real-time Sync</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">1 Seat</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Per Booking Rule</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">Instant</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cancellations</p>
          </div>
        </div>

      </div>
    </section>
  );
}