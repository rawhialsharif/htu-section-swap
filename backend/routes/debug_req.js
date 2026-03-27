// DEBUG TEST
console.log('requests.js __dirname:', __dirname);
const path = require('path');
console.log('Resolved ../db:', path.resolve(__dirname, '../db'));
const express = require('express');
const router = express.Router();
const db = require('../db');
console.log('db loaded:', typeof db);
