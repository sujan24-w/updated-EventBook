# 🎟️ EventBook — Full-Stack Event Booking System

A full-stack event booking platform built with **Next.js, TypeScript, Node.js, Express, and PostgreSQL**. Users can discover events, reserve seats, and manage bookings, while Admin manage events and monitor bookings.

The project focuses on secure authentication, role-based access control, REST API design, database integrity, and concurrency-safe seat reservations.

## 🌐 Live Demo

- **Frontend:** [EventBook](https://my-eventbooking.vercel.app/)
- **Backend API:** [Render API](https://eventsbook-backend.onrender.com/)
- **GitHub:** [Source Code](https://github.com/sujan24-w/updated-EventBook)

> Note: The backend is hosted on Render's free tier, so the first request after inactivity may take longer to respond.

## ✨ Features

### User features
- Register, log in, and log out.
- Browse upcoming events.
- Search events and navigate server-paginated results.
- View event details and seat availability.
- Reserve a seat for an event.
- View personal bookings and cancel eligible reservations.

### Admin features
- Protected admin access with role-based authorization.
- Create and update events.
- Cancel, restore, and manage event records.
- View event bookings and attendee information.
- Access dashboard statistics.

### Security and reliability
- JWT authentication using HTTP-only cookies.
- Password hashing with bcrypt.
- Request validation using Zod.
- Protected routes and role-based middleware.
- Authentication(Register,Login) rate limiting.
- Parameterized PostgreSQL queries.
- Transaction-based booking with row-level locking.
- Automated backend tests using Jest and Supertest.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase PostgreSQL |
| Authentication | JWT, HTTP-only cookies |
| Validation | Zod |
| Password hashing | bcrypt |
| Image storage | Multer, Cloudinary |
| Testing | Jest, ts-jest, Supertest |
| Deployment | Vercel, Render |

## 🏗️ Architecture

The application uses a separate frontend and backend.

- **Frontend:** Provides the user interface and communicates with the backend API.
- **Backend:** Handles authentication, validation, authorization, event management, and booking logic.
- **Database:** PostgreSQL stores users, events, and bookings.
- **Authentication:** The backend issues an HTTP-only cookie containing the JWT. Protected endpoints verify the token and permissions before processing requests.

The frontend uses an API rewrite/proxy configuration for communication with the deployed backend.

## 🗄️ Database Design

The application uses three primary tables.

### `users`
Stores user accounts, password hashes, roles, and timestamps.

### `events`
Stores event information, including title, description, venue, start and end times, seat capacity, image URL, cancellation status, and deletion status.

### `bookings`
Connects users to events and tracks booking status (`ACTIVE` or `CANCELLED`).

Important database rules include:

- UUID primary keys.
- Foreign-key relationships.
- Positive event seat capacity.
- Valid event start and end times.
- A partial unique index to prevent duplicate active bookings.
- Indexes supporting common booking and event queries.

PostgreSQL's `pgcrypto` extension provides UUID generation through `gen_random_uuid()`.

## 🔐 Preventing Duplicate Bookings and Overselling

A key challenge in booking systems is handling simultaneous booking requests.

Suppose an event has one seat remaining and two users attempt to reserve it at nearly the same time. Without concurrency control, both requests could read the same availability and attempt to reserve the final seat.

EventBook addresses this in the booking transaction:

1. Start a database transaction.
2. Lock the relevant event row using `SELECT ... FOR UPDATE`.
3. Check whether the event is eligible for booking.
4. Check for an existing active booking.
5. Count active bookings and verify available capacity.
6. Insert the booking if a seat is available.
7. Commit the transaction; roll back on failure.

The row lock serializes competing booking operations for the same event. The database constraints provide additional protection against duplicate active reservations.

## 📡 API Overview

The following endpoints represent the current core API design. Check the implementation before relying on this table as an exhaustive API reference.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Authenticate and set the cookie |
| POST | `/api/auth/logout` | Clear the authentication cookie |

### Events

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/events` | Browse and search events |
| POST | `/api/events` | Create an event (admin) |
| PUT | `/api/events/:id` | Update an event (admin) |

The backend also supports additional event-management operations, including cancellation, restoration, deletion, and attendee access where implemented.

### Bookings

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/bookings/:eventId` | Reserve a seat |
| GET | `/api/bookings/me` | Retrieve the current user's bookings |
| PATCH | `/api/bookings/:bookingId/cancel` | Cancel an eligible booking |

Protected endpoints require valid authentication, and administrative operations require the appropriate role.

## 🚀 Run Locally

### Prerequisites

- Node.js
- npm
- A PostgreSQL database, such as Supabase
- Git

### 1. Clone the repository

```bash
git clone https://github.com/sujan24-w/updated-EventBook.git
cd EventBooking
```

Use the actual directory name created by Git if it differs from `EventBooking`.

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a local `.env` file using the variable names expected by the backend. For example:

```env
PORT=5000
NODE_ENV=development
DATABASE_URI=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret
```

Add any other variables required by your current application, such as Cloudinary credentials.

**Do not commit `.env` files or real credentials.**

### 3. Initialize the database

Run the project's existing migration and optional seed scripts:

```bash
npm run migrate
npm run seed
```

Use the seed script only with a database intended for development or demo data.

### 4. Start the backend

```bash
npm run dev
```

The backend is configured to use port `5000` locally.

### 5. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Use the local frontend URL printed by Next.js in the terminal. Configure the frontend's API rewrite and any required environment variables according to your project configuration.

## 🧪 Testing

The backend uses Jest, ts-jest, and Supertest for automated tests.

**Latest recorded test results**

| Metric | Result |
|---|---:|
| Test suites passed | 11 / 11 |
| Tests passed | 26 / 26 |
| Statement coverage | 48.31% |
| Branch coverage | 26% |
| Function coverage | 29.26% |
| Line coverage | 47.32% |

Run the test suite from the backend directory:

```bash
npm test
```

Generate a coverage report:

```bash
npx jest --coverage
```

The project uses a separate test database configured through `.env.test.local`. Keep this file private and ensure tests never target production data.

Coverage indicates which code paths have been exercised; it does not by itself prove that every behavior is correct. The recorded results should be refreshed whenever the test suite changes.


## 🤖 AI Usage Disclosure

AI tools were used as development aids during selected stages of the project:

- **Perplexity:** Initial research on database schema design and architecture.
- **Gemini:** Debugging cross-origin authentication cookies, CORS, `SameSite=None`, `Secure`, and credential transmission and db queries.
- **ChatGPT and Gemini:** Assistance with Tailwind CSS layouts, boilerplate configuration, and development guidance.
- **Cursor:** Assistance with writing, organizing, and debugging automated tests using Jest, ts-jest, and Supertest.

AI tools supported the development workflow, while implementation, debugging, and verification were carried out through hands-on development and testing(Postman).


## 🔮 Future Improvements

- Email booking confirmations and QR-code tickets.
- Waitlist management for sold-out events.
- Improved event image management.
- Expanded automated tests for event management and authentication edge cases.
- Additional monitoring and production error reporting.

---

**EventBook** is a learning and portfolio project demonstrating full-stack development, REST API design, relational database modeling, authentication, automated testing, and concurrency-aware booking logic.
