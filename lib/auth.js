import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const SECRET_PATH = path.join(process.cwd(), "data", "session-secret.key");
const USERS_PATH = path.join(process.cwd(), "data", "users.json");

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  if (fs.existsSync(SECRET_PATH)) {
    return fs.readFileSync(SECRET_PATH, "utf-8").trim();
  }
  const secret = crypto.randomBytes(32).toString("hex");
  fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
  fs.writeFileSync(SECRET_PATH, secret, "utf-8");
  return secret;
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(username) {
  const exp = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `${username}.${exp}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifySessionToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [username, expStr, sig] = decoded.split(".");
    if (!username || !expStr || !sig) return null;
    if (Date.now() > parseInt(expStr, 10)) return null;
    const expectedSig = sign(`${username}.${expStr}`);
    if (sig.length !== expectedSig.length) return null;
    const valid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
    return valid ? { username } : null;
  } catch (err) {
    return null;
  }
}

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
  } catch (err) {
    return [];
  }
}

export function findUser(username) {
  const users = loadUsers();
  return users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase()) || null;
}

export async function verifyPassword(username, password) {
  const user = findUser(username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export const SESSION_COOKIE_NAME = "tl_session";
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;
