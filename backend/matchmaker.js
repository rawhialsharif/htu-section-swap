const db = require('./db');

/**
 * Run the matchmaking algorithm after a new request is submitted.
 * Logic:
 *   - New request: Student A has section X and wants sections [Y, Z, ...]
 *   - A match exists if: Another active request has current_section in [Y, Z, ...]
 *     AND has X in their wanted_section_ids
 * Returns the first match found, or null.
 */
async function findMatch(newRequest) {
  const wantedIds = JSON.parse(newRequest.wanted_section_ids); // [sectionId, ...]

  if (!wantedIds || wantedIds.length === 0) return null;

  // Fetch all active requests for the same course, excluding the new one
  const candidates = await db.allAsync(
    `SELECT r.*, s.phone as student_phone, s.name as student_name
     FROM requests r
     JOIN students s ON s.id = r.student_id
     WHERE r.course_id = ? AND r.status = 'active' AND r.id != ?`,
    [newRequest.course_id, newRequest.id]
  );

  for (const candidate of candidates) {
    const candidateWanted = JSON.parse(candidate.wanted_section_ids);

    // Check: candidate's current section is one of newRequest's wanted sections
    const candidateCurrentInMyWanted = wantedIds.includes(candidate.current_section_id);

    // Check: newRequest's current section is one of candidate's wanted sections
    const myCurrentInCandidateWanted = candidateWanted.includes(newRequest.current_section_id);

    if (candidateCurrentInMyWanted && myCurrentInCandidateWanted) {
      return candidate;
    }
  }

  return null;
}

/**
 * Create a match record and update both requests to 'matched' status.
 */
async function createMatch(requestAId, requestBId) {
  await db.runAsync(
    'INSERT INTO matches (request_a_id, request_b_id) VALUES (?, ?)',
    [requestAId, requestBId]
  );
  // Note: we do NOT auto-change status to 'matched' — user decides to keep or close
}

module.exports = { findMatch, createMatch };
