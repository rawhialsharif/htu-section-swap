const db = require('./db');
async function debug() {
  const students = await db.allAsync(`SELECT * FROM students`);
  console.log('STUDENTS:', students);
  process.exit(0);
}
debug();
