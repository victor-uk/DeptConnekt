# Test Documentation

This directory contains tests for the DeptConnekt backend API routes.

## Setup

1. Install dependencies (including test dependencies):
```bash
npm install
```

2. Ensure you have Node.js version that supports ES modules and Jest 30+

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run tests with coverage:
```bash
npm run test:coverage
```

### Run specific test file:
```bash
npm test userRoutes.test.js
npm test announcementRoutes.test.js
```

## Test Structure

- `setup/testSetup.js` - Database setup and teardown utilities
- `helpers/testHelpers.js` - Helper functions for creating test data and generating tokens
- `routes/userRoutes.test.js` - Tests for user routes
- `routes/announcementRoutes.test.js` - Tests for announcement routes

## Test Coverage

The tests cover critical paths including:

### User Routes:
- Authentication and authorization
- User profile management (GET/PATCH /me)
- Lecturer management (GET, PUT, DELETE)
- Student management (GET, PUT, DELETE)
- User approval workflows
- Role-based access control

### Announcement Routes:
- Creating announcements
- Getting announcements (with filtering and pagination)
- Updating announcements
- Deleting announcements
- Archiving and unarchiving announcements
- Authorization checks (creator vs admin vs others)

## Test Database

Tests use MongoDB Memory Server by default, which creates an in-memory MongoDB instance for testing. 

**If you encounter download errors**, you can use system MongoDB instead:

```bash
# Windows (PowerShell)
$env:USE_SYSTEM_MONGO="true"
npm test

# Windows (CMD)
set USE_SYSTEM_MONGO=true
npm test

# Linux/Mac
USE_SYSTEM_MONGO=true npm test
```

Or set a test MongoDB URI:
```bash
set MONGO_URI_TEST=mongodb://localhost:27017/jest-test-db
npm test
```

See `__tests__/TROUBLESHOOTING.md` for more solutions to MongoDB Memory Server issues.

## Environment Variables

Tests will use default test values if environment variables are not set:
- `JWT_SECRET` - defaults to 'test-secret-key'
- `JWT_EXPIRES` - defaults to '7d'

## Notes

- Tests are isolated - each test cleans up after itself
- Tests use mock data and don't affect production databases
- File upload routes are not fully tested (would require mocking multer and cloudinary)
- Some edge cases in the student approval route may reveal bugs (see userRoutes.js line 73)

