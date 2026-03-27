require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const authenticate = require('./middleware/auth');
const app = express();

app.use(cors());
app.use(express.json());

// /requests/mine MUST come BEFORE app.use('/requests', ...) to avoid being swallowed
app.get('/requests/mine', authenticate, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT r.id, r.created_at, r.status, r.wanted_section_ids,
              c.course_number, c.course_name,
              cs.section_number as current_section,
              cs.instructor as current_instructor,
              cs.schedule as current_schedule
       FROM requests r
       JOIN courses c ON c.id = r.course_id
       JOIN sections cs ON cs.id = r.current_section_id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const wantedIds = JSON.parse(row.wanted_section_ids);
        let wantedSections = [];
        if (wantedIds.length > 0) {
          wantedSections = await db.allAsync(
            `SELECT id, section_number, instructor, schedule FROM sections WHERE id IN (${wantedIds.map(() => '?').join(',')})`,
            wantedIds
          );
        }
        return { ...row, wanted_sections: wantedSections };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Routers
app.use('/auth', require('./routes/auth'));
app.use('/courses', require('./routes/courses'));
app.use('/requests', require('./routes/requests'));
app.use('/matches', require('./routes/matches'));
app.use('/admin', require('./routes/admin'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HTU Section Swap backend running on http://localhost:${PORT}`);
});
