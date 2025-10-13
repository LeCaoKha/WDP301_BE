const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Register route
router.post("/register", authController.register);
// Login route
router.post("/login", authController.login);
module.exports = router;

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter JWT token
 */
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and registration
 */
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Valid email address
 *                 example: "john.doe@example.com"
 *               phone:
 *                 type: string
 *                 description: Phone number (E.164 format or 9-15 digits)
 *                 pattern: "^\\+?[0-9]{9,15}$"
 *                 example: "+84901234567"
 *               password:
 *                 type: string
 *                 description: Password (will be hashed)
 *                 minLength: 6
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 description: User role
 *                 enum: [driver, admin, company]
 *                 default: driver
 *                 example: "driver"
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account created successfully"
 *                 accountId:
 *                   type: string
 *                   description: ID of the created account
 *                   example: "507f1f77bcf86cd799439011"
 *       400:
 *         description: Validation error or duplicate data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     invalid_email:
 *                       value: "Invalid email format"
 *                     invalid_phone:
 *                       value: "Invalid phone format"
 *                     email_exists:
 *                       value: "Email already in use"
 *                     phone_exists:
 *                       value: "Phone already in use"
 *                     username_exists:
 *                       value: "Username already in use"
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to an account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT access token (expires in 1 hour)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50SWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoiZHJpdmVyIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.signature"
 *                 accountId:
 *                   type: string
 *                   description: ID of the authenticated account
 *                   example: "507f1f77bcf86cd799439011"
 *                 role:
 *                   type: string
 *                   description: User role
 *                   enum: [driver, admin, company]
 *                   example: "driver"
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid email or password"
 *       500:
 *         description: Internal server error
 */
