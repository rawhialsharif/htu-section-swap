const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Default connection string if running locally or not provided
const dbString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: dbString,
  // If connecting to a remote DB like Neon, SSL is required
  ssl: dbString && !dbString.includes('localhost') ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});

async function initializeTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Students table
    await client.query(`CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Courses table
    await client.query(`CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      course_number VARCHAR(255) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      hours INTEGER
    )`);

    // Sections table
    await client.query(`CREATE TABLE IF NOT EXISTS sections (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      section_number VARCHAR(255) NOT NULL,
      instructor VARCHAR(255),
      schedule VARCHAR(255)
    )`);

    // Requests table (one per student per course)
    await client.query(`CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      current_section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      wanted_section_ids TEXT NOT NULL, 
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id)
    )`);

    // Matches table
    await client.query(`CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      request_a_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      request_b_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await client.query('COMMIT');
    console.log('PostgreSQL database tables initialized.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing tables:', err);
  } finally {
    client.release();
  }
}

const initPromise = dbString ? initializeTables().catch(console.error) : Promise.resolve();
if (!dbString) {
  console.log('No DATABASE_URL provided. Skipping table initialization.');
}

// Convert SQLite `?` to Postgres `$1, $2, ...`
function convertQuery(sql) {
  let count = 1;
  return sql.replace(/\?/g, () => `$${count++}`);
}

// Promisified helpers replacing sqlite3 interface with pg
const db = {
  getAsync: async (sql, params = []) => {
    if (!dbString) return null;
    const res = await pool.query(convertQuery(sql), params);
    return res.rows[0]; // Returns undefined if no rows, similar to sqlite db.get
  },

  allAsync: async (sql, params = []) => {
    if (!dbString) return [];
    const res = await pool.query(convertQuery(sql), params);
    return res.rows;
  },

  runAsync: async (sql, params = []) => {
    if (!dbString) return { lastID: null, changes: 0 };
    const convertedSql = convertQuery(sql);
    let finalSql = convertedSql;
    
    // Automatically append RETURNING id for inserts to populate result.lastID
    if (convertedSql.trim().toUpperCase().startsWith('INSERT') && !convertedSql.toUpperCase().includes('RETURNING')) {
      finalSql = convertedSql + ' RETURNING id';
    }
    
    const res = await pool.query(finalSql, params);
    return {
      lastID: (res.rows && res.rows.length > 0) ? res.rows[0].id : null,
      changes: res.rowCount
    };
  },
  
  pool: pool,
  initPromise: initPromise
};

module.exports = db;
