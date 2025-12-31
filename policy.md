# 🛡️ DeptConnect Authorization & Data Lifecycle Policy

This document defines **user permissions**, **data lifecycles**, and **archival policies** for the DeptConnect platform.  
The goal is to ensure security, maintain academic integrity, and manage data efficiently using a mix of **Role-Based Access Control (RBAC)** and **Hybrid Lifecycle Management**.

---

## 👤 User Management

| Role | Permissions |
|------|--------------|
| **Admin** | - ✅ Get all user profiles (students, lecturers, advisers, student admins) <br> - ✅ Delete any user profile <br> - ✅ Approve new lecturer registrations <br> - ⚠️ Cannot edit another user’s profile directly |
| **Lecturer** | - ✅ Get all user profiles (for communication/reference) <br> - ✏️ Edit **own** profile only <br> - ❌ Cannot delete or modify other users |
| **Course Adviser** | - ✅ Get all user profiles <br> - ✏️ Edit **own** profile only <br> - ✅ Approve registrations of **students assigned to them** only <br> - ❌ Cannot delete users |
| **Student** | - ✅ Get **own** profile only <br> - ✏️ Edit **own** profile only <br> - ❌ Cannot view or modify others |
| **Student Admin** | - ✅ Get profiles of **students in their admission year** <br> - ✏️ Edit **own** profile only <br> - ❌ Cannot access lecturer or adviser profiles |

---

## 📢 Announcements

| Role | Permissions |
|------|--------------|
| **Admin** | - ✅ Create, edit, and delete **any announcement** <br> - ✅ View all announcements |
| **Lecturer** | - ✅ Create and edit announcements for their students <br> - ✅ Delete announcements they created <br> - ✅ View all announcements |
| **Course Adviser** | - ✅ Create announcements for their advisees <br> - ✅ Edit/delete their own announcements <br> - ✅ View all announcements |
| **Student Admin** | - ✅ Create announcements limited to their year group <br> - ✅ Edit/delete their own announcements |
| **Student** | - ✅ View announcements only |

---

## 📝 Assignments

| Role | Permissions |
|------|--------------|
| **Admin** | - ✅ Get, delete, or manage all assignments <br> - ✅ Edit any assignment (if needed) |
| **Lecturer** | - ✅ Create assignments for courses they handle <br> - ✅ Edit or delete their own assignments <br> - ✅ View all student submissions for their assignments |
| **Course Adviser** | - ✅ View all assignments of students they oversee <br> - ❌ Cannot create or delete assignments unless also a lecturer |
| **Student Admin** | - ✅ View all assignments within their year <br> - ❌ Cannot create or edit assignments |
| **Student** | - ✅ View assignments assigned to them <br> - ✅ Submit or resubmit before deadline <br> - ❌ Cannot modify or delete assignments |

---

## 🎉 Events

| Role | Permissions |
|------|--------------|
| **Admin** | - ✅ Create, edit, and delete any event <br> - ✅ Approve lecturer-posted events <br> - ✅ View all events |
| **Lecturer** | - ✅ Create and manage their own events (e.g., class meetings, tutorials) <br> - ✅ View all approved events <br> - ⚠️ Subject to admin approval if configured |
| **Course Adviser** | - ✅ Create events for their advisees <br> - ✅ Edit/delete their own events <br> - ✅ View all approved events |
| **Student Admin** | - ✅ Create year-based events (e.g., class meetups) <br> - ✅ Edit/delete their own events <br> - ✅ View all approved events |
| **Student** | - ✅ View all approved events <br> - ❌ Cannot create or modify events |

---

## 🔐 General Rules

1. **Ownership Principle** — A user can only edit or delete resources that they created, unless they are an **Admin**.  
2. **Visibility Principle** —  
   - Admins and lecturers can see all users.  
   - Students and student admins see only their relevant peers or year group.  
3. **Approval Hierarchy** —  
   - Admin approves lecturer registrations.  
   - Course advisers approve student registrations.  
4. **Audit Logging** — All critical operations (create, update, delete, approve) must be logged in the **History** collection.  
5. **Token Enforcement** — JWT-based authorization must be validated on every protected route.

---

## 📦 Data Lifecycle Management (Hybrid Model)

DeptConnect uses a **hybrid lifecycle model** for major entities (Announcements, Assignments, Events).  
This means records are first **archived** (soft-retired) before being permanently deleted via **TTL cleanup** after a defined retention period.

### 🧩 Common Lifecycle Stages

| Stage | Description | Action |
|--------|--------------|--------|
| **Active** | Record is live and accessible to users. | Normal operations. |
| **Archived** | Record has expired or ended but is kept for reference. | Mark `isArchived: true` and store `archivedAt` date. |
| **Expired (TTL)** | Record is old enough to be deleted. | MongoDB TTL automatically removes it after `expiresAt` date. |
| **Logged** | Action permanently recorded in History collection. | Remains for audit trail. |

---

### 🧾 Module Lifecycles

| Resource | Active Period | Archive Trigger | TTL Deletion | Notes |
|-----------|----------------|----------------|---------------|-------|
| **Announcements** | 30 days | After 30 days | 6 months post-archive | Kept visible in “Archived Announcements” for reference. |
| **Assignments** | Until due date + 14 days | When due date + 14 days passes | 6 months post-archive | Students can view but not edit after archive. |
| **Events** | Until `endDate` | When `endDate` passes | 6 months post-archive | Archived automatically after event concludes. |
| **Verification Tokens / OTPs** | Minutes | Immediate | 5–10 minutes | Pure TTL — no archiving. |
| **History Logs** | Continuous | Ongoing | 2 years retention | Periodically pruned via TTL index. |

---

### ⚙️ Example Schema Snippet

```js
const announcementSchema = new mongoose.Schema({
  title: String,
  body: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isArchived: { type: Boolean, default: false },
  archivedAt: Date,
  expiresAt: Date, // e.g. archivedAt + 6 months
});

announcementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
