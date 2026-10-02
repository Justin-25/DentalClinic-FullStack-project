# Dental-Clinic FullStack Project

## About

A self-directed, from-scratch project built to learn and practice the
fundamentals of professional backend engineering — authentication and
authorization, role-based access control, real business-logic validation
(availability checking, conflict detection, eligibility rules), centralized
error handling, and security hardening — on the way to becoming a
full-stack developer. A dental clinic was chosen as the domain because it
naturally calls for all of these pieces: accounts with different roles, a
public service catalog, doctor availability and appointment booking, and
patient reviews, without being a trivial CRUD exercise. The project is being
built in stages, backend first. This README currently documents the
**backend only** — a RESTful API built with Node.js, Express, and MongoDB.
A frontend will be added in a later stage.

---

## Backend

### Tech stack

| | |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB, via Mongoose 9 |
| Authentication | JSON Web Tokens (`jsonwebtoken`), password hashing with `bcryptjs` |
| Email | `nodemailer` (password-reset emails) |
| Security | `helmet`, `express-rate-limit`, MongoDB operator sanitization (`mongoose.set('sanitizeFilter', true)`) |
| Validation | Mongoose schema validation, `validator` |
| Misc | `slugify` (service URL slugs), `dotenv`, `cross-env` |

### Core features

**Authentication & accounts**
- Signup / login with JWT-based sessions
- Forgot-password / reset-password flow via emailed, hashed, time-limited tokens
- Change-password flow for logged-in users
- Role-based access control: `patient`, `doctor`, `admin`
- Soft-deletable accounts (`DELETE` deactivates rather than erases, preserving appointment/review history)

**Security hardening**
- Helmet-set security headers
- Rate limiting, with stricter limits on login and password-reset endpoints to slow brute-force and spam
- Centralized error handling with a stable, machine-readable `code` on every error response (e.g. `AUTH_REQUIRED`, `VALIDATION_FAILED`, `SLOT_ALREADY_BOOKED`), independent of the human-readable `message`
- NoSQL-injection-safe query filters throughout

**Services (the clinic's treatment catalog)**
- Public browsing, with a `slug`-based URL for each service
- Admin-only create / update / soft-delete / restore
- "Unlisted" services: hidden from the public catalog but still reachable by admins and anyone with a direct link

**Doctor schedules**
- One weekly-availability record per doctor (working hours per day, with support for split shifts)
- Date-specific exceptions (days off)
- Public read access, so patients can check a doctor's hours before booking

**Appointments**
- Real-time availability checking against a doctor's weekly hours and exceptions
- Automatic conflict detection to prevent double-booking, backed by a database-level unique index as a second line of defense against race conditions
- Price and duration are snapshotted onto the appointment at booking time, so later changes to a service never alter historical records
- A role-based status lifecycle (`pending → confirmed/cancelled → completed/no-show`), with patients, doctors, and admins each limited to the transitions appropriate to their role
- Object-level access control throughout, so one patient can never view or modify another's appointment

**Reviews**
- Patients may only review a doctor or the clinic after a completed appointment, preventing unverified reviews
- Public, filterable, paginated review listings
- Authors can edit their own review text and rating; admins can remove (but never silently edit) a review, preserving reviewer trust

### API overview

All routes are mounted under `/api`.

| Resource | Base path | Public | Patient | Doctor | Admin |
|---|---|---|---|---|---|
| Auth | `/api/users` | signup, login, forgot/reset password | — | — | — |
| Users | `/api/users` | — | view/update/delete own account | view/update own account | list/view/update/deactivate any user |
| Services | `/api/services` | browse, view one | — | — | create/update/delete/restore |
| Schedules | `/api/schedules` | view a doctor's hours | — | set own weekly hours | — |
| Appointments | `/api/appointments` | — | book, view own, cancel own | view own, confirm/complete/mark no-show | view all, manage any |
| Reviews | `/api/reviews` | browse, view one | create (if eligible), edit/delete own | — | delete any (moderation) |

### Project structure

```
backend/dentalClinic/
├── controllers/     # request handlers — one per resource, plus the error controller
├── models/          # Mongoose schemas: User, Service, Schedule, Appointment, Review
├── routes/          # Express routers, one per resource
├── utils/           # shared helpers (AppError, catchAsync, error codes, time/date helpers, rate limiters)
├── app.js           # Express app: middleware stack, route mounting
└── server.js        # entry point: environment config, DB connection, server start
```

### Running locally

```
npm install
npm run start:dev     # nodemon, development mode
npm run start:prod    # production mode
```

Requires a `config.env` file (not committed) with database, JWT, and email
credentials.
