 #  🎟️ EventBook – Full-Stack Event Booking System
 > ** full-stack event booking platform built with Next.js, Node.js/Express, and Supabase (PostgreSQL), featuring secure cross-domain cookie authentication and strict concurrency-safe booking rules.


## 🌟 1.  Demo:## 🌟 1. Demo & Live Links
- **Frontend (Vercel):** [https://event-booking-sigma-seven.vercel.app](https://event-booking-sigma-seven.vercel.app)
- **Backend API (Render):** [https://eventbooking-pq7r.onrender.com](https://eventbooking-pq7r.onrender.com)
- **GitHub Repository:** [https://github.com/sujan24-w](https://github.com/sujan24-w)


### Test Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@eventbook.com` | `eventbooksujan@2026` |
| **Attendee 1** | `sagar@eventbook.com` | `UserPassword123!` |
| **Attendee 2** | `sujal@eventbook.com` | `UserPassword123!` |

---


## 🛠️ 2. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js + TypeScript** | Server-rendered pages, client routing, and responsive UI |
| **Styling** | **Tailwind CSS** | Clean, mobile-friendly design with fallback graphics |
| **Backend** | **Node.js + Express (TypeScript)** | RESTful API with explicit transaction management |
| **Database** | **Supabase (PostgreSQL)** | Relational storage with ACID row-level locking (`pg.Pool`) |
| **Authentication**| **JWT in HTTP-only Cookies** | Cross-domain cookie authentication (`SameSite=None`, `Secure`) |
| **File Storage & Media** | **Multer + Cloudinary** | Multipart form-data parsing and cloud image hosting / CDN delivery |
---

##  3💻  Setup & Locally Run Instructions
### Step I: Start Backend Server
```bash
cd backend
npm run dev
# Server running at http://localhost:5000
```

---

### Step II: Start Frontend Client
```bash
# Open a new terminal
cd frontend
npm install
npm run dev
# Frontend running at http://localhost:5173
```


### Prerequisites
- Nodeejs v22.16.0
- Supabase PostgreSQL  pool  coonecting String 

### Step 1: Database Migration & Seeding
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install



# Run database schema migration
npm run migrate

# (Optional) Seed initial demo accounts and sample events
npm run seed
```


# 🗄️ 4. Data Model & Architecture
### The application uses three core PostgreSQL tables:

- users: Stores user accounts, hashed passwords (bcryptjs), and user roles (ADMIN vs USER).

 - events: Stores event details (title, venue, starts_at, total_seats, is_cancelled, is_deleted).

- bookings: Connects users to events, enforcing status (ACTIVE vs CANCELLED) to prevent duplicate seat reservations.
** NOTE: Image  of event is    null not implemented **

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1.users  table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'USER'
        CHECK (role IN ('USER', 'ADMIN')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 2. events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(255) NOT NULL,

    description TEXT NOT NULL,

    starts_at TIMESTAMPTZ NOT NULL,

    ends_at TIMESTAMPTZ NOT NULL,

    venue VARCHAR(255) NOT NULL,

    total_seats INTEGER NOT NULL
        CHECK (total_seats > 0),
    image_url TEXT,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,

     is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_event_time    CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at
ON events (starts_at);
CREATE INDEX IF NOT EXISTS idx_events_is_cancelled
ON events (is_cancelled);

-- 3. booking table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

```

## 📡 5. API Endpoints

### 🔑 Authentication
* **`POST /api/auth/register`** – Register a new account.
* **`POST /api/auth/login`** – Login and set HTTP-only authentication cookie.
* **`POST /api/auth/logout`** – Clear auth cookie.

### 📅 Events
* **`GET /api/events`** – List events with search and server-side pagination.
* **`POST /api/events`** – Create new event (Admin only).
* **`PUT /api/events/:id`** – Edit event details (Admin only).
* **`DELETE /api/events/:id`** – Delete event (Admin only).
* **`GET /api/events/:id/attendees`** – View registered attendees (Admin only).

### 🎟️ Bookings
* **`POST /api/events/:id/book`** – Concurrency-safe seat reservation (`USER` only).
* **`GET /api/bookings/my`** – Retrieve personal active/past bookings.
* **`DELETE /api/bookings/:id`** – Cancel active booking and free up capacity.

```sql

-- One active booking per user per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking
ON bookings (event_id, user_id)
WHERE status = 'ACTIVE';

-- Booking query indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id
ON bookings (user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_event_active
ON bookings (event_id)
WHERE status = 'ACTIVE';

```


## 🔮 . Known Issues

* **Render Free Tier Cold Starts:** The backend API on Render's free tier spins down after periods of inactivity, causing an initial ~30-second latency on the first request.

---

## 🔒 . Concurrency-Safe Capacity Enforcement & Anti-Overselling Deep Dive

### The Problem: Race Conditions & Ticket Overselling
When an event has **1 seat remaining** and two attendees (User A and User B) click "Book Now" at the exact same millisecond:
1. User A reads available seats: `1 > 0` (True)
2. User B reads available seats: `1 > 0` (True)
3. User A inserts booking #1 (Capacity reached)
4. User B inserts booking #2 (**OVERSELL ERROR: 2 seats sold for capacity 1!**)

 ```sql
 // 1. Connect client and begin transaction
client = await pool.connect();
await client.query("BEGIN");

// 2. Lock event row strictly using FOR UPDATE
const eventResult = await client.query(
  `SELECT id, title, venue, starts_at, total_seats, is_cancelled
   FROM events WHERE id = $1 AND is_deleted = FALSE FOR UPDATE`,
  [eventId]
);

// 3. Dynamic active booking check & seat calculation under lock
const countResult = await client.query(
  `SELECT COUNT(*)::int AS active_bookings FROM bookings 
   WHERE event_id = $1 AND status = 'ACTIVE'`,
  [eventId]
);

const activeBookings = countResult.rows[0].active_bookings;
if (event.total_seats - activeBookings <= 0) {
  // Event is sold out -> Rollback transaction
  res.status(409).json({ success: false, message: "This event is fully booked" });
  return;
}

// 4. Insert active booking and COMMIT
await client.query("COMMIT");
 ```


## 🤖 7. AI Usage Disclosure

In accordance with transparent development standards, AI tools were leveraged to assist with specific workflow stages:

* **Perplexity:** Used for initial schema design research and database architectural planning.
* **Gemini:** Used for debugging cross-domain cookie transmission issues (`SameSite=None`, CORS, and `withCredentials` behavior between Vercel and Render).
* **ChatGPT & Gemini:** Used for Tailwind CSS layout structure and boilerplate test suite configurations.
* *All core business rules, ACID database transactions (`SELECT ... FOR UPDATE`), row-level concurrency mechanics, and express error handlers were hand-coded, verified, and audited.TRANSFORMING MONGODB LOGICS TO SQL *

---


### 🔑 8. Logins & Role-Based Access Control (RBAC)
* **Admin Login (`admin@eventbook.com` / `eventbooksujan@2026`):** Provides administrative privileges to oversee platform metrics, create/edit/cancel/purge events, and inspect all user bookings via `/api/admin/*`.
* **User Login (`sagar@eventbook.com` / `UserPassword123!`):** Provides standard user access to browse active events, execute secure seat bookings, and manage personal reservations.
* *Why:* Separation of concerns ensures core administrative tasks and data mutations are strictly protected from standard user interference.

---


## Tools Used & Their Purposes
*  Axios: HTTP client configured with credentials and Next.js rewrite proxy for secure first-party cookie transmission.

*  Jest & Supertest: Automated unit and integration testing frameworks for business logic and endpoint validation.

*  Tailwind CSS: Utility-first CSS framework for responsive UI styling.

* **Future Enhancements:** 
  * Email confirmation receipts featuring dynamic QR codes for physical venue check-ins.
  * Redis-based rate limiting on authentication and booking endpoints.
  * Waitlist automation system to automatically grant seats when active bookings are cancelled.

---


* Building EventBook has been an incredible full-stack learning experience. Working through cross-domain cookie authentication hurdles, implementing ACID transactions with FOR UPDATE row locks, and tying it together with Next.js gave me a deep appreciation for building good  web applications.