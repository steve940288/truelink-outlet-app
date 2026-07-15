// Run once with: node scripts/generate-users.js
// Re-run any time you need to add/reset a user - it will overwrite data/users.json.
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Roles:
//   "admin"     - dashboard access + can edit outlets + can export CSV
//   "dashboard" - dashboard access + can edit outlets (no export)
//   "staff"     - registration/view only, no dashboard access
//
// CHANGE THESE PASSWORDS before real use if you want different ones than
// the ones already shared with you - this file is just for generating the hashes.
const USERS = [
  { username: "estephanos", displayName: "Estephanos", password: "kYCPvgi8hD", role: "admin" },
  { username: "redeat", displayName: "Redeat", password: "riwBnxcw9K", role: "dashboard" },
  { username: "abubeker", displayName: "Abubeker", password: "fbdNQSKhfF", role: "dashboard" },
  { username: "user4", displayName: "User 4", password: "NK3xsPWAMb", role: "staff" },
  { username: "user5", displayName: "User 5", password: "bjiDWgRHnu", role: "staff" },
  { username: "user6", displayName: "User 6", password: "CZmvHARvE4", role: "staff" },
  { username: "user7", displayName: "User 7", password: "qTCbJWJsFq", role: "staff" },
  { username: "user8", displayName: "User 8", password: "STkBXSXUA2", role: "staff" },
  { username: "user9", displayName: "User 9", password: "YitaJvEbcN", role: "staff" },
  { username: "user10", displayName: "User 10", password: "aikTxmY4y4", role: "staff" },
];

const users = USERS.map((u) => ({
  username: u.username,
  displayName: u.displayName,
  role: u.role,
  passwordHash: bcrypt.hashSync(u.password, 10),
}));

const outPath = path.join(__dirname, "..", "data", "users.json");
fs.writeFileSync(outPath, JSON.stringify(users, null, 2));
console.log(`Wrote ${users.length} users to ${outPath}`);
