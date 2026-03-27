// Quick startup test - checks all modules load correctly
try {
  const r = require('./routes/requests');
  console.log('routes/requests: OK');
} catch(e) {
  console.error('routes/requests FAILED:', e.message);
  console.error('Stack:', e.requireStack);
}

try {
  const r = require('./routes/auth');
  console.log('routes/auth: OK');
} catch(e) {
  console.error('routes/auth FAILED:', e.message);
}

try {
  const r = require('./routes/courses');
  console.log('routes/courses: OK');
} catch(e) {
  console.error('routes/courses FAILED:', e.message);
}

try {
  const r = require('./routes/matches');
  console.log('routes/matches: OK');
} catch(e) {
  console.error('routes/matches FAILED:', e.message);
}

console.log('Test complete. Exiting.');
process.exit(0);
