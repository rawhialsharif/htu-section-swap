const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('./db');

// Map Arabic day letters to English abbreviations
const DAY_MAP = {
  'ح': 'Sun',
  'ن': 'Mon',
  'ث': 'Tue',
  'ر': 'Wed',
  'خ': 'Thu',
  'س': 'Sat',
};

function parseSchedule(raw) {
  if (!raw) return '';
  // Extract time: e.g. "08,30 - 10,00"
  const timeMatch = raw.match(/(\d{2},\d{2})\s*-\s*(\d{2},\d{2})/);
  const timeStr = timeMatch
    ? `${timeMatch[1].replace(',', ':')} - ${timeMatch[2].replace(',', ':')}`
    : '';

  // Extract Arabic day letters
  const days = [];
  for (const [letter, name] of Object.entries(DAY_MAP)) {
    if (raw.includes(letter)) days.push(name);
  }

  return days.length > 0 ? `${days.join(', ')} ${timeStr}` : timeStr;
}

async function importCsv(csvFilePath) {
  const absolutePath = path.resolve(csvFilePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  // Wait for DB to be ready
  await db.initPromise;

  console.log(`Importing courses from: ${absolutePath}`);

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(absolutePath)
      .pipe(csv({ headers: false, skipLines: 0 }))
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  let coursesAdded = 0;
  let sectionsAdded = 0;

  for (const row of rows) {
    // Column positions (0-indexed):
    // 0: Course Number, 1: Section Number, 2: Theoretical (skip),
    // 3: Course Name, 4: Hours, 5: Instructor Name, 6: Time/Classroom, 7: Prerequisite (skip)
    const courseNumber = (row['0'] || '').toString().trim();
    const sectionNumber = (row['1'] || '').toString().trim();
    const courseName = (row['3'] || '').toString().trim();
    const hours = parseInt(row['4']) || 0;
    const instructor = (row['5'] || '').toString().trim();
    const rawSchedule = (row['6'] || '').toString().trim();

    if (!courseNumber || !sectionNumber || !courseName) continue;

    const schedule = parseSchedule(rawSchedule);

    // Get or insert course
    let course = await db.getAsync(
      'SELECT id FROM courses WHERE course_number = ?',
      [courseNumber]
    );

    if (!course) {
      const result = await db.runAsync(
        'INSERT INTO courses (course_number, course_name, hours) VALUES (?, ?, ?)',
        [courseNumber, courseName, hours]
      );
      course = { id: result.lastID };
      coursesAdded++;
    }

    // Insert section (skip if duplicate)
    const existingSection = await db.getAsync(
      'SELECT id FROM sections WHERE course_id = ? AND section_number = ?',
      [course.id, sectionNumber]
    );

    if (!existingSection) {
      await db.runAsync(
        'INSERT INTO sections (course_id, section_number, instructor, schedule) VALUES (?, ?, ?, ?)',
        [course.id, sectionNumber, instructor, schedule]
      );
      sectionsAdded++;
    }
  }

  console.log(`Import complete: ${coursesAdded} courses, ${sectionsAdded} sections added.`);
  await db.pool.end();
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node importCsv.js <path-to-csv>');
  process.exit(1);
}

importCsv(csvPath);
