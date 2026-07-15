// Run once with: node scripts/generate-users.js
// Re-run any time you need to add/reset a user - it will overwrite data/users.json.
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// username : { displayName, password }
// CHANGE THESE PASSWORDS before real use if you want different ones than
// the ones already shared with you - this file is just for generating the hashes.
const USERS = [
  { username: "redeat", displayName: "Redeat", password: "riwBnxcw9K" },
  { username: "abubeker", displayName: "Abubeker", password: "fbdNQSKhfF" },
  { username: "estephanos", displayName: "Estephanos", password: "kYCPvgi8hD" },
  { username: "user4", displayName: "User 4", password: "NK3xsPWAMb" },
  { username: "user5", displayName: "User 5", password: "bjiDWgRHnu" },
  { username: "user6", displayName: "User 6", password: "CZmvHARvE4" },
  { username: "user7", displayName: "User 7", password: "qTCbJWJsFq" },
  { username: "user8", displayName: "User 8", password: "STkBXSXUA2" },
  { username: "user9", displayName: "User 9", password: "YitaJvEbcN" },
  { username: "user10", displayName: "User 10", password: "aikTxmY4y4" },
];

const users = USERS.map((u) => ({
  username: u.username,
  displayName: u.displayName,
  passwordHash: bcrypt.hashSync(u.password, 10),
}));

const outPath = path.join(__dirname, "..", "data", "users.json");
fs.writeFileSync(outPath, JSON.stringify(users, null, 2));
console.log(`Wrote ${users.length} users to ${outPath}`);
