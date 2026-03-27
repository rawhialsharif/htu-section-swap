const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const db = require('../db');
const authenticate = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// Middleware to ensure admin role
router.use(authenticate, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
});

// GET /admin/courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await db.allAsync('SELECT * FROM courses ORDER BY course_number ASC');
    const sections = await db.allAsync('SELECT * FROM sections');
    
    // Group sections by course
    const enriched = courses.map(c => ({
      ...c,
      sections: sections.filter(s => s.course_id === c.id)
    }));
    
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /admin/courses/:id
router.delete('/courses/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /admin/sections/:id
router.delete('/sections/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM sections WHERE id = ?', [req.params.id]);
    res.json({ message: 'Section deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const DAY_MAP = {
  'ح': 'Sun', 'ن': 'Mon', 'ث': 'Tue', 'ر': 'Wed', 'خ': 'Thu', 'س': 'Sat',
};

function parseSchedule(raw) {
  if (!raw) return '';
  const timeMatch = raw.match(/(\d{2},\d{2})\s*-\s*(\d{2},\d{2})/);
  const timeStr = timeMatch
    ? `${timeMatch[1].replace(',', ':')} - ${timeMatch[2].replace(',', ':')}`
    : '';

  const days = [];
  for (const [letter, name] of Object.entries(DAY_MAP)) {
    if (raw.includes(letter)) days.push(name);
  }

  return days.length > 0 ? `${days.join(', ')} ${timeStr}` : timeStr;
}

// POST /admin/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv({ headers: false, skipLines: 0 }))
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    let coursesAdded = 0;
    let sectionsAdded = 0;

    for (const row of rows) {
      const courseNumber = (row['0'] || '').toString().trim();
      const sectionNumber = (row['1'] || '').toString().trim();
      const courseName = (row['3'] || '').toString().trim();
      const hours = parseInt(row['4']) || 0;
      const instructor = (row['5'] || '').toString().trim();
      const rawSchedule = (row['6'] || '').toString().trim();

      if (!courseNumber || !sectionNumber || !courseName) continue;

      const schedule = parseSchedule(rawSchedule);

      let course = await db.getAsync('SELECT id FROM courses WHERE course_number = ?', [courseNumber]);
      if (!course) {
        const result = await db.runAsync('INSERT INTO courses (course_number, course_name, hours) VALUES (?, ?, ?)', [courseNumber, courseName, hours]);
        course = { id: result.lastID };
        coursesAdded++;
      }

      const existingSection = await db.getAsync('SELECT id FROM sections WHERE course_id = ? AND section_number = ?', [course.id, sectionNumber]);
      if (!existingSection) {
        await db.runAsync('INSERT INTO sections (course_id, section_number, instructor, schedule) VALUES (?, ?, ?, ?)', [course.id, sectionNumber, instructor, schedule]);
        sectionsAdded++;
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({ message: `Successfully added ${coursesAdded} courses and ${sectionsAdded} sections.` });
  } catch (err) {
    console.error(err);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process CSV file.' });
  }
});

module.exports = router;
