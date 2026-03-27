const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middleware/auth');

// GET /matches/me - get all matches for the logged-in student
router.get('/me', authenticate, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get all requests by this student
    const myRequests = await db.allAsync(
      'SELECT id FROM requests WHERE student_id = ?',
      [studentId]
    );
    const myRequestIds = myRequests.map((r) => r.id);
    if (myRequestIds.length === 0) return res.json([]);

    // Find all matches involving this student's requests
    const placeholders = myRequestIds.map(() => '?').join(',');
    const matches = await db.allAsync(
      `SELECT m.id as match_id, m.created_at as matched_at,
              m.request_a_id, m.request_b_id
       FROM matches m
       WHERE m.request_a_id IN (${placeholders}) OR m.request_b_id IN (${placeholders})
       ORDER BY m.created_at DESC`,
      [...myRequestIds, ...myRequestIds]
    );

    const enriched = await Promise.all(
      matches.map(async (match) => {
        const myReqId = myRequestIds.includes(match.request_a_id)
          ? match.request_a_id
          : match.request_b_id;
        const theirReqId = myReqId === match.request_a_id
          ? match.request_b_id
          : match.request_a_id;

        const myReq = await db.getAsync(
          `SELECT r.*, c.course_number, c.course_name,
                  cs.section_number as current_section, cs.schedule as current_schedule
           FROM requests r
           JOIN courses c ON c.id = r.course_id
           JOIN sections cs ON cs.id = r.current_section_id
           WHERE r.id = ?`,
          [myReqId]
        );

        const theirReq = await db.getAsync(
          `SELECT r.*, s.name as student_name, s.phone as student_phone,
                  cs.section_number as current_section, cs.instructor, cs.schedule
           FROM requests r
           JOIN students s ON s.id = r.student_id
           JOIN sections cs ON cs.id = r.current_section_id
           WHERE r.id = ?`,
          [theirReqId]
        );

        return {
          match_id: match.match_id,
          matched_at: match.matched_at,
          my_request: myReq,
          their_request: theirReq,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
