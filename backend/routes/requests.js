const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middleware/auth');
const { findMatch, createMatch } = require('../matchmaker');

// GET /requests - public feed of all active requests
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Optional filter by course
    const courseFilter = req.query.course_id ? 'AND r.course_id = ?' : '';
    const params = req.query.course_id
      ? [req.query.course_id, limit, offset]
      : [limit, offset];

    const requests = await db.allAsync(
      `SELECT r.id, r.created_at, r.status,
              c.course_number, c.course_name,
              cs.section_number as current_section,
              cs.instructor as current_instructor,
              cs.schedule as current_schedule,
              s.name as student_name
       FROM requests r
       JOIN students s ON s.id = r.student_id
       JOIN courses c ON c.id = r.course_id
       JOIN sections cs ON cs.id = r.current_section_id
       WHERE r.status = 'active' ${courseFilter}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    // Enrich each request with wanted section details
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const raw = await db.getAsync('SELECT wanted_section_ids FROM requests WHERE id = ?', [req.id]);
        const wantedIds = JSON.parse(raw.wanted_section_ids);
        const wantedSections = await db.allAsync(
          `SELECT id, section_number, instructor, schedule FROM sections WHERE id IN (${wantedIds.map(() => '?').join(',')})`,
          wantedIds
        );
        return { ...req, wanted_sections: wantedSections };
      })
    );

    const total = await db.getAsync(
      `SELECT COUNT(*) as count FROM requests WHERE status = 'active' ${courseFilter ? 'AND course_id = ?' : ''}`,
      req.query.course_id ? [req.query.course_id] : []
    );

    res.json({ requests: enriched, total: total.count, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /requests - submit a new request (auth required)
router.post('/', authenticate, async (req, res) => {
  try {
    const { course_id, current_section_id, wanted_section_ids } = req.body;
    const studentId = req.user.id;

    if (!course_id || !current_section_id || !wanted_section_ids || !wanted_section_ids.length) {
      return res.status(400).json({ error: 'course_id, current_section_id, and wanted_section_ids are required.' });
    }

    // Validate wanted_section_ids is an array
    if (!Array.isArray(wanted_section_ids)) {
      return res.status(400).json({ error: 'wanted_section_ids must be an array.' });
    }

    // Cannot want a section you already have
    if (wanted_section_ids.includes(current_section_id)) {
      return res.status(400).json({ error: 'Wanted sections cannot include your current section.' });
    }

    // One request per course per student
    const existingRequest = await db.getAsync(
      'SELECT id FROM requests WHERE student_id = ? AND course_id = ?',
      [studentId, course_id]
    );
    if (existingRequest) {
      return res.status(409).json({
        error: 'You already have an active request for this course. Please update or delete it first.',
        existing_request_id: existingRequest.id,
      });
    }

    // Insert request
    const result = await db.runAsync(
      'INSERT INTO requests (student_id, course_id, current_section_id, wanted_section_ids) VALUES (?, ?, ?, ?)',
      [studentId, course_id, current_section_id, JSON.stringify(wanted_section_ids)]
    );

    const newRequestId = result.lastID;
    const newRequest = {
      id: newRequestId,
      student_id: studentId,
      course_id,
      current_section_id,
      wanted_section_ids: JSON.stringify(wanted_section_ids),
    };

    // Run matchmaking
    const match = await findMatch(newRequest);
    let matchData = null;

    if (match) {
      await createMatch(newRequestId, match.id);
      matchData = {
        matched_request_id: match.id,
        student_name: match.student_name,
        student_phone: match.student_phone,
        their_current_section_id: match.current_section_id,
      };
    }

    res.status(201).json({
      request_id: newRequestId,
      match: matchData,
      message: matchData ? 'Request submitted and a match was found!' : 'Request submitted. Waiting for a match.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /requests/:id - delete your own request (auth required)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const request = await db.getAsync(
      'SELECT * FROM requests WHERE id = ? AND student_id = ?',
      [req.params.id, req.user.id]
    );
    if (!request) {
      return res.status(404).json({ error: 'Request not found or not yours.' });
    }
    await db.runAsync('DELETE FROM requests WHERE id = ?', [req.params.id]);
    res.json({ message: 'Request deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
