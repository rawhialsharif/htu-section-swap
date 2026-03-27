const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /courses - list all courses
router.get('/', async (req, res) => {
  try {
    const courses = await db.allAsync(
      `SELECT c.id, c.course_number, c.course_name, c.hours,
              COUNT(s.id) as section_count
       FROM courses c
       LEFT JOIN sections s ON s.course_id = c.id
       GROUP BY c.id
       ORDER BY c.course_name ASC`
    );
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /courses/:id/sections - list all sections for a course
router.get('/:id/sections', async (req, res) => {
  try {
    const sections = await db.allAsync(
      `SELECT s.id, s.section_number, s.instructor, s.schedule,
              COUNT(CASE WHEN r.status = 'active' THEN 1 END) as active_requests
       FROM sections s
       LEFT JOIN requests r ON r.current_section_id = s.id
       WHERE s.course_id = ?
       GROUP BY s.id
       ORDER BY CAST(s.section_number AS INTEGER) ASC`,
      [req.params.id]
    );
    res.json(sections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
