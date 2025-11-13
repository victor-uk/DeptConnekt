import jwt from 'jsonwebtoken'
import LecturerSchema from '../../models/LecturerSchema.js'
import StudentSchema from '../../models/StudentSchema.js'

// Set test JWT secret if not already set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
process.env.JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

/**
 * Generate a JWT token for testing
 * @param {string} id - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
export const generateTestToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Create test lecturer
 * @param {Object} overrides - Override default values
 * @returns {Promise<Object>} Created lecturer
 */
export const createTestLecturer = async (overrides = {}) => {
  const defaultLecturer = {
    firstName: 'John',
    lastName: 'Doe',
    email: `lecturer${Date.now()}@test.com`,
    password: 'password123',
    lecturerID: `LEC${Date.now()}`,
    role: 'lecturer',
    status: 'approved',
    year: 2020,
    ...overrides
  }
  return await LecturerSchema.create(defaultLecturer)
}

/**
 * Create test student
 * @param {Object} overrides - Override default values
 * @returns {Promise<Object>} Created student
 */
export const createTestStudent = async (overrides = {}) => {
  const defaultStudent = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: `student${Date.now()}@test.com`,
    password: 'password123',
    matricNo: `MAT${Date.now()}`,
    admissionYear: 2020,
    role: 'student',
    status: 'approved',
    ...overrides
  }
  return await StudentSchema.create(defaultStudent)
}

/**
 * Create test admin (lecturer with admin role - if you have admin model, update this)
 * For now, we'll use a lecturer with special status
 */
export const createTestAdmin = async (overrides = {}) => {
  return await createTestLecturer({
    email: `admin${Date.now()}@test.com`,
    lecturerID: `ADM${Date.now()}`,
    role: 'lecturer', // Adjust based on your admin implementation
    ...overrides
  })
}

/**
 * Get auth header with token
 * @param {string} token - JWT token
 * @returns {Object} Authorization header
 */
export const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` }
}

