# DeptConnekt

DeptConnekt is a departmental connect platform designed for FUTO students, lecturers, and advisers. It serves as a unified web application that allows users to connect, share academic information, and receive real-time updates regarding courses, assignments, timetables, and events.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Docker Support](#docker-support)
- [Architecture and Design](#architecture-and-design)
- [Database Design](#database-design)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [License](#license)

## Features

- User Authentication and Role-based Authorization (Student, Lecturer, Adviser, Admin).
- User Profile Management.
- Timetable Management.
- Assignment Management.
- Event Management.
- Announcements Management.
- Real-time Notification System via WebSockets.
- AI-powered content generation and summarization for announcements, assignments, and events using Hugging Face.
- File attachments for announcements, assignments, and events via Cloudinary.
- Email notifications using Nodemailer.

## Tech Stack

- **Backend:** Node.js, Express.js (v5)
- **Database:** MongoDB with Mongoose ODM
- **Real-time:** Socket.io
- **AI Integration:** Hugging Face Inference API
- **File Storage:** Cloudinary
- **Authentication:** JWT, Bcrypt
- **Validation:** Joi
- **Testing:** Jest, Supertest

## Getting Started

### Prerequisites

- Node.js installed on your local machine.
- MongoDB instance (local or Atlas).
- Cloudinary account for media uploads.
- Hugging Face API token for AI features.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/victor-uk/DeptConnekt.git
   cd DeptConnekt
   ```

2. Navigate to the Backend directory:

   ```bash
   cd Backend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure environment variables (see below).

## Environment Variables

Create a `.env` file in the `Backend` directory and populate it based on the following keys:

```bash
PORT=5000
NODE_ENV=development
MONGO_URI_DEV=your_mongodb_uri_dev
MONGO_URI_PROD=your_mongodb_uri_prod
JWT_SECRET=your_jwt_secret
JWT_EXPIRES=1d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_URL=your_cloudinary_url

MAILTRAP_API=your_mailtrap_api
```

## Running the Application

### Development Mode

Runs the server with nodemon for automatic restarts.

```bash
npm start
```

### Production Mode

```bash
npm run build
```

## Docker Support

The project includes Docker configurations for both development and production environments.

### Run in Development

```bash
docker-compose -f docker-compose.dev.yml up
```

### Run in Production

```bash
docker-compose -f docker-compose.prod.yml up --build
```

## Architecture and Design

### Architectural Style

This application uses a feature-based monolith architecture, where each feature is a self-contained module with its own controllers, routes, and service. This is used instead of the traditional MVC pattern to improve modularity and maintainability. This also makes the project easier to navigate and understand.

![DeptConnect Architecture Diagram](/img/arch-diagram.png)

### Data flow

Describe how a request moves through the system:

1. Client Request: Sent to an endpoint.
2. Middleware Layer: Authentication (JWT), Authorization (Roles), and Input Validation (Joi).
3. Controller Layer: Business logic execution and interaction with the Database.
4. Model Layer: Mongoose schemas validate and persist data to MongoDB.
5. Real-time Layer: Updates emitted via Socket.io to relevant users

### Communication Design

- Synchronous: Client-server communication using HTTP requests and SMTP for email notifications.
- Asynchronous: Real-time updates using WebSockets.

### Security

- Authentication: JWT for user authentication.
- OTP: One-time password for user authentication.
- Email confirmation for MFA
- Authorization: Role-based access control.
- Timeouts: Prevents Denial of Service attacks.
- Input Validation: Joi for input validation.
- Sanitization: Express-Mongo-Sanitise for sanitizing input.
- Rate Limiting: Express-Rate-Limit for rate limiting.
- Helmet: Helmet for security headers.
- CORS: CORS for cross-origin resource sharing.

### Database design

#### Lecturer schema

Represents lecturers and course advisers.

- `firstName`: String, required.
- `lastName`: String, required.
- `email`: String, required, unique.
- `password`: String, required, hidden in queries.
- `lecturerID`: String, required, unique.
- `profileImage`: String (URL).
- `role`: String, enum: ['lecturer', 'courseAdviser'].
- `year`: Number (Admission year they advise).
- `status`: String, enum: ['pending', 'approved', 'rejected'].

#### Student schema

Represents students within the department.

- `firstName`: String, required.
- `lastName`: String, required.
- `email`: String, required, unique.
- `password`: String, required, hidden.
- `matricNo`: String, required, unique.
- `role`: String, enum: ['student', 'studentAdmin'].
- `admissionYear`: Number, required.
- `profileImage`: String (URL).
- `adviser`: ObjectId, reference to Lecturer.
- `status`: String, enum: ['pending', 'approved', 'rejected'].

#### Announcement schema

Broadcasts information to specific admission years.

- `title`: String (max 300), required.
- `body`: String (max 2500), required.
- `preview`: String (max 150), required.
- `category`: String, enum: ['general', 'academic', 'event', 'alert', 'other'].
- `admissionYear`: [Number], required.
- `createdBy`: ObjectId, polymorphic reference (Lecturer/Student).
- `image`: Object { publicId, url }.
- `attachments`: [Object { fileName, fileUrl }].
- `archived`: Boolean.

#### Assignment schema

Academic tasks assigned to students.

- `title`: String, required.
- `description`: String (max 2500), required.
- `preview`: String (max 300), required.
- `deadline`: Date, required.
- `admissionYear`: [Number], required.
- `createdBy`: ObjectId, reference to Lecturer/CourseAdviser.
- `attachments`: [Object { fileName, fileUrl, fileType, size }].
- `archived`: Boolean.

#### Event schema

Departmental events and schedules.

- `title`: String, required.
- `description`: String (max 2500), required.
- `eventDate`: Date, required.
- `location`: String, default: "TBA".
- `targetGroups`: [Number] (Admission years).
- `createdBy`: ObjectId, reference to Admin/Lecturer/CourseAdviser.
- `archived`: Boolean.

#### Timetable schema

Weekly academic schedules.

- `admissionYear`: Number, required.
- `semester`: String, enum: ['First', 'Second'].
- `level`: String, enum: ['100', '200', '300', '400', '500'].
- `createdBy`: ObjectId, reference to Lecturer/CourseAdviser.
- `weekDays`: Array of Days, each containing an array of Classes (courseCode, courseTitle, lecturer, venue, startTime, endTime).
- `archived`: Boolean.

### API Documentation

Interactive API documentation is provided via Swagger UI. Once the server is running, you can access it at:

- Local: `http://localhost:5000/api-docs`

This documentation provides a comprehensive list of all available endpoints, request parameters, and response formats.

### Design decisions
- The auth is designed to be robust and secure. This is probably overkill but it's better to be safe than sorry. This app uses MFA (Multifactor authentication): it uses the traditional email and password method combined with an OTP (One-time password) sent to the user's email. 
- The registration and login response is designed to protect the user's data from email enumeration attacks. 
- The app uses JWT (JSON Web Tokens) for authentication and authorization.



## Testing

The project uses Jest for unit and integration testing.

- **Run all tests:** `npm test`
- **Watch mode:** `npm run test:watch`
- **Coverage report:** `npm run test:coverage`
- **System MongoDB tests:** `npm run test:system-mongo`

## Project Structure

```text
DeptConnekt/
├── Backend/
│   ├── Ai/             # AI logic and Hugging Face integration
│   ├── Announcement/   # Announcement controllers and routes
│   ├── Assignment/     # Assignment management logic
│   ├── Auth/           # Authentication and Authorization
│   ├── Event/          # Event management
│   ├── Timetable/      # Timetable logic
│   ├── Users/          # User profile management
│   ├── __tests__/      # Test suites (Jest)
│   ├── config/         # Database and app configurations
│   ├── helpers/        # Helper functions
│   ├── middlewares/    # Custom Express middlewares
│   ├── models/         # Mongoose schemas
│   ├── utils/          # Utility functions (errors, formatters)
│   └── server.js       # Entry point
```

## License

This project is licensed under the [MIT License](Backend/LICENSE).
