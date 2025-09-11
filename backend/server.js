const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT || 3000;

// --- Middleware ---
// Allows your React Native app to communicate with this server
app.use(cors()); 
// Allows the server to understand JSON data
app.use(express.json()); 

// --- PostgreSQL Database Connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- Cloudinary Configuration ---
// Connects to your Cloudinary account using the credentials from the .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Multer Configuration ---
// This tells multer to store the uploaded file temporarily in the server's memory
// instead of saving it to a folder. This is efficient for immediately uploading to Cloudinary.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// This function will act as a "gatekeeper" for our protected routes.
const authenticateToken = (req, res, next) => {
    // Get the token from the 'Authorization' header (e.g., "Bearer YOUR_TOKEN")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).send("Authentication token required"); // No token provided
    }

    // Check if the token is valid
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send("Token is not valid"); // Token is invalid
        }
        // If the token is valid, save the user's details to the request object
        req.user = user;
        next(); // Proceed to the next function (the actual route handler)
    });
};

// --- NEW: User Registration Endpoint ---
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json("Email and password are required.");
    }

    // Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save the new user to the database
    const newUser = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING user_id, email",
      [email, passwordHash]
    );
    res.status(201).json(newUser.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// --- NEW: User Login Endpoint ---
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find the user by their email
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(401).json("Invalid credential");
        }
        // Check if the provided password matches the hashed password in the database
        const isValidPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!isValidPassword) {
            return res.status(401).json("Invalid credential");
        }
        // If credentials are correct, create a JWT token
        const token = jwt.sign(
            { user_id: user.rows[0].user_id }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" } // The token will be valid for 24 hours
        );
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// This sets up a "listener" at the address '/api/reports' for POST requests
// upload.single('report_image') is the middleware that intercepts the image file.
app.post('/api/reports', authenticateToken, upload.single('report_image'), async (req, res) => {
  try {
    const { department, description, latitude, longitude } = req.body;
    const userId = req.user.user_id; // Get user ID from the token
    
    if (!req.file) return res.status(400).json({ error: 'Image is required.' });

    const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({ folder: "civic_reports" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
        uploadStream.end(req.file.buffer);
    });

    const imageUrl = uploadResult.secure_url;
    if (!imageUrl) throw new Error('Cloudinary upload failed');

    const newReport = await pool.query(
      `INSERT INTO reports (user_id, department, description, latitude, longitude, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, department, description, latitude, longitude, imageUrl]
    );

    res.status(201).json({ message: 'Report submitted successfully!', report: newReport.rows[0] });
  } catch (err) {
    console.error('Error submitting report:', err.message);
    res.status(500).send('Server Error: Could not submit report.');
  }
});

// CORRECT, SECURE ROUTE FOR FETCHING REPORTS
app.get('/api/reports', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id; // Get user ID from the token
        const userReports = await pool.query(
            "SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC", 
            [userId]
        );
        res.json(userReports.rows);
    } catch (err) {
        console.error("Error fetching reports:", err.message);
        res.status(500).send("Server Error");
    }
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 