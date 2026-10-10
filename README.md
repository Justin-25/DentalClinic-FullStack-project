# Dental-Clinic FullStack Project

## About

A self-directed, from-scratch project built to learn and practice the
fundamentals of professional full-stack engineering — authentication and
authorization, role-based access control, real business-logic validation
(availability checking, conflict detection, eligibility rules), centralized
error handling, and security hardening — on the way to becoming a
full-stack developer. A dental clinic was chosen as the domain because it
naturally calls for all of these pieces: accounts with different roles, a
public service catalog, doctor availability and appointment booking, and
patient reviews, without being a trivial CRUD exercise.

The project is being built in stages. The **backend** — a RESTful API built
with Node.js, Express, and MongoDB — is complete and documented below. The
**frontend** (React) is in progress and will be documented here once it is
finished.

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
| File uploads | `multer` (multipart parsing), `sharp` (resizing and re-encoding images) |
| Security | `helmet`, `express-rate-limit`, MongoDB operator sanitization (`mongoose.set('sanitizeFilter', true)`) |
| Validation | Mongoose schema validation, `validator` |
| Misc | `slugify` (service URL slugs), `dotenv`, `cross-env`, `nodemon` |

### Core features

**Authentication & accounts**
- Signup / login with JWT-based sessions (token sent in the `Authorization: Bearer` header)
- Forgot-password / reset-password flow via emailed, hashed tokens that expire after 10 minutes; the email links to the frontend's reset page
- Change-password flow for logged-in users, which issues a fresh token and invalidates older ones
- Role-based access control: `patient`, `doctor`, `admin`
- Soft-deletable accounts: deleting deactivates rather than erases, preserving appointment and review history. Deactivated users can no longer log in, and admins can view and reactivate them
- Profile photos: every user starts with a default photo and can upload their own; doctors can also set a specialization, years of experience, and a bio

**Security hardening**
- Helmet-set security headers
- Rate limiting: a global API limit, plus stricter limits on signup, login, and password-reset endpoints to slow brute-force attempts, spam, and account enumeration
- Login and forgot-password responses never reveal whether an email is registered
- Centralized error handling with a stable, machine-readable `code` on every error response (e.g. `AUTH_REQUIRED`, `VALIDATION_FAILED`, `SLOT_ALREADY_BOOKED`), independent of the human-readable `message`
- NoSQL-injection-safe query filters throughout
- Uploaded images are validated (type and 5 MB size limit), renamed by the server, and re-encoded — client file names and image metadata are never kept

**Services (the clinic's treatment catalog)**
- Public browsing, with a `slug`-based URL for each service
- Optional sale price (`priceDiscount`), validated to be lower than the regular price
- Admin-only create / update / soft-delete / restore, with cover-image upload
- "Unlisted" services: hidden from the public catalog but still reachable by admins and anyone with a direct link

**Doctors**
- Public doctor directory and profiles exposing only public fields (name, photo, specialization, experience, bio) — never email or account details
- Each doctor includes a rating summary (average and count) calculated from their reviews with a MongoDB aggregation pipeline

**Doctor schedules**
- One weekly-availability record per doctor (working hours per day, with support for split shifts such as a lunch break)
- Date-specific days off
- Public read access, plus an **availability endpoint** that returns the bookable start times for a doctor, date, and service — already excluding booked times, days off, and slots that wouldn't fit before the end of a shift

**Appointments**
- Booking validation against the doctor's weekly hours and days off, using the same rules as the availability endpoint so the two always agree
- Dates in the past cannot be booked
- Automatic conflict detection to prevent double-booking, backed by a database-level partial unique index as a second line of defense against race conditions (cancelled appointments free their slot)
- Price and duration are snapshotted onto the appointment at booking time — including any sale price — so later changes to a service never alter historical records
- A status lifecycle enforced as a state machine (`pending → confirmed / cancelled`, `confirmed → completed / cancelled / no-show`; completed, cancelled, and no-show are final). Each role is limited to its own actions: patients can cancel, doctors can confirm / complete / mark no-show, and admins can correct any status
- Object-level access control throughout, so one patient can never view or modify another's appointment

**Reviews**
- Each review is tied to a specific completed appointment, preventing unverified reviews
- One clinic review per patient, and one doctor review per visit, enforced by partial unique indexes
- Public, filterable (`type`, `doctor`), paginated review listings
- Patients can list their own reviews, so the frontend knows which visits are already reviewed
- Authors can edit their own review text and rating; admins can remove (but never silently edit) a review, preserving reviewer trust

### API overview

All API routes are mounted under `/api`. Uploaded and default images are
served from `/img` (e.g. `/img/services/<file>`, `/img/users/<file>`).

| Resource | Base path | Public | Patient | Doctor | Admin |
|---|---|---|---|---|---|
| Auth | `/api/users` | signup, login, forgot/reset password | change own password | change own password | change own password |
| Users | `/api/users` | — | view/update/delete own account, upload photo | view/update own account and profile, upload photo | list/view/update/deactivate/reactivate any user |
| Doctors | `/api/doctors` | list doctors, view one (with rating summary) | — | — | — |
| Services | `/api/services` | browse, view one | — | — | list all (incl. unlisted/deleted), create/update with cover image, delete, restore |
| Schedules | `/api/schedules` | view a doctor's hours, check availability | — | set own weekly hours and days off | — |
| Appointments | `/api/appointments` | — | book, view own, cancel own | view own, confirm / complete / mark no-show | view all, set any status |
| Reviews | `/api/reviews` | browse, view one | create (if eligible), list own, edit/delete own | — | delete any (moderation) |

### Project structure

```
backend/dentalClinic/
├── controllers/     # request handlers — one per resource, plus the error controller
├── models/          # Mongoose schemas: User, Service, Schedule, Appointment, Review
├── routes/          # Express routers, one per resource
├── utils/           # shared helpers (AppError, catchAsync, error codes, rate limiters,
│                    #   image uploads, time helpers, availability slot calculation)
├── public/img/      # uploaded and default images (users/, services/), served at /img
├── scripts/         # one-time data scripts (e.g. setting service cover images)
├── app.js           # Express app: middleware stack, route mounting
└── server.js        # entry point: environment config, DB connection, server start
```

### Running locally

```
cd backend/dentalClinic
npm install
npm run start:dev     # nodemon, development mode
npm run start:prod    # production mode
```

Requires a `config.env` file (not committed) in `backend/dentalClinic/` with:

| Variable | Purpose |
|---|---|
| `NODE_ENV`, `PORT` | environment and server port |
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | MongoDB connection |
| `JWT_SECRET_KEY`, `JWT_EXPIRES_IN` | token signing and lifetime |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME`, `EMAIL_PASSWORD` | SMTP for password-reset emails |
| `FRONTEND_URL` | base URL used in password-reset email links |
