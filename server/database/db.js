const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'students_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

function getDatabase() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('Connected to MySQL database:', dbConfig.database);
  }
  return pool;
}

async function initDatabase() {
  try {
    const database = getDatabase();

    await database.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        dateOfBirth DATE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Students table created/verified');

    await database.execute(`
      CREATE TABLE IF NOT EXISTS marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentId INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        marks INT NOT NULL,
        maxMarks INT DEFAULT 100,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_subject (studentId, subject)
      )
    `);
    console.log('Marks table created/verified');

    await database.execute(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url TEXT NOT NULL,
        isActive TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Webhooks table created/verified');
    console.log('Database initialized: students_db with tables (students, marks, webhooks)');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('Database connection closed');
  }
}

module.exports = {
  getDatabase,
  initDatabase,
  closeDatabase
};
