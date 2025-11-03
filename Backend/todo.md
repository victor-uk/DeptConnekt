# 🧠 Dept-Connect Backend TODO

This file tracks what’s left to implement, feature by feature.  
Mark tasks with ✅ when completed.

---

## 🔐 AUTHENTICATION MODULE

### Setup
- [x ] Create `/modules/auth/` folder (controller, service, routes, model)
- [x ] Define `User` model (common base for admin, lecturer, student)
- [x ] Implement password hashing utility (bcrypt)
- [ ] Implement JWT token utilities (sign & verify)
- [ ] Create `registerLecturer`, `registerStudent`, and `login` controllers
- [ ] Validate signup and login data (email, password length)
- [ ] Add middleware to protect routes (`protect`) using JWT
- [ ] Add role-based access middleware (`authorizeRoles`)
- [ ] Create test routes to confirm JWT flow works
- [ ] Add `/auth/me` route to fetch current user details

### Extras
- [ ] Implement email-based OTP password reset
- [ ] Add resend-OTP feature
- [ ] Add rate limiting for login attempts (to prevent brute force)
- [ ] Write tests for auth routes

---

## 📢 ANNOUNCEMENTS MODULE

### Core Features
- [ ] Create `/modules/announcements/` folder
- [ ] Define `Announcement` model (title, body, year, createdBy, attachments)
- [ ] Implement CRUD operations:
  - [ ] `POST /announcements` (lecturers/admin)
  - [ ] `GET /announcements` (students, admin)
  - [ ] `GET /announcements/:id`
  - [ ] `DELETE /announcements/:id` (admin or creator only)
- [ ] Add file/image upload (Cloudinary + Multer)
- [ ] Use `.lean()` in GET routes for better performance
- [ ] Emit real-time event through Socket.IO when new announcement is created

### Extras
- [ ] Add pagination and filtering by year
- [ ] Add caching with Redis for frequent GET requests
- [ ] Add soft delete (archive instead of hard delete)

---

## 📚 ASSIGNMENTS MODULE

### Core Features
- [ ] Create `/modules/assignments/` folder
- [ ] Define `Assignment` model (title, description, dueDate, year, createdBy, attachments)
- [ ] CRUD routes for assignments
- [ ] File uploads for attachments (Cloudinary)
- [ ] Role restriction: only lecturers can create/edit, students can view
- [ ] Emit real-time updates to students via Socket.IO

### Extras
- [ ] Assignment reminder jobs using `node-cron`
- [ ] Add submission tracking (future extension)
- [ ] Add notification to students when a new assignment is posted

---

## 🗓️ EVENTS MODULE

### Core Features
- [ ] Create `/modules/events/` folder
- [ ] Define `Event` model (title, body, date, createdBy)
- [ ] CRUD routes for events
- [ ] Allow lecturers and admins to post events
- [ ] Emit socket events for new events
- [ ] Auto-archive past events with a cron job

---

## 🧾 TIMETABLE MODULE

### Core Features
- [ ] Define `Timetable` model (title, courseCode, day, startTime, endTime, location, lecturer)
- [ ] CRUD operations for admin and lecturers
- [ ] Students can only view timetable of their level
- [ ] Add sorting and filtering by day or lecturer

---

## 🔔 NOTIFICATIONS SYSTEM

- [ ] Define `Notification` model (user, title, message, type, read, createdAt)
- [ ] Emit socket notification when an event or announcement is created
- [ ] Save notifications in DB for persistence
- [ ] Add `/notifications` route (GET all, mark as read)
- [ ] Optional: Add email notifications (Nodemailer)

---

## 🧰 SYSTEM SETUP & UTILITIES

- [ ] Add global error handler (`errorHandler`, `notFound`)
- [ ] Create `AppError` class for custom error handling
- [ ] Setup CORS with credentials (`origin`, `credentials: true`)
- [ ] Setup Helmet, Morgan (logger), and express.json() middlewares
- [ ] Connect MongoDB (with event listeners)
- [ ] Create `config/` folder for `db.js`, `env.js`, `cloudinary.js`, `jwt.js`
- [ ] Add `.env` for configuration variables

---

## 🌐 DOCUMENTATION (OpenAPI)

- [ ] Install Swagger UI and YAMLJS
- [ ] Create `openapi.yaml` file
- [ ] Document `/auth` routes first
- [ ] Add `/announcements` and `/assignments` endpoints
- [ ] Serve docs at `/api-docs`
- [ ] Keep updating spec as you build new modules

---

## ⚡ FUTURE IMPROVEMENTS

- [ ] Add Redis caching for announcements & timetable
- [ ] Add analytics for admin dashboard (counts, top posters, etc.)
- [ ] Write unit and integration tests (Jest)
- [ ] Add CI pipeline (GitHub Actions)
- [ ] Prepare deployment config (Render, Railway, or Vercel)
- [ ] Create Postman collection for all endpoints

---

## 🧭 DAILY FLOW TIP

> Each coding session, focus on **one small feature** or **one module**.  
> Update this file as you progress — it keeps your head clear and your momentum high.
