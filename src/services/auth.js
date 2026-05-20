import bcrypt from 'bcryptjs';
import { KEYS } from '../constants/storageKeys';
import { storageAdapter } from './storageAdapter';
import INITIAL_USERS from '../data/users.json';

/**
 * @typedef {{ id: string, username: string, password: string, displayName: string, email: string, favorites: string[], createdAt: string }} User
 * @typedef {{ id: string, username: string, displayName: string }} Session
 */

const isBcryptHash = s => typeof s === 'string' && s.startsWith('$2') && s.length === 60;

/** @returns {User[]} */
function _getUsers() {
  return storageAdapter.get(KEYS.USERS) ?? [];
}

/** @param {User[]} users */
function _saveUsers(users) {
  storageAdapter.set(KEYS.USERS, users);
}

/** @returns {Promise<{data: null, error: null}>} */
export async function initUsers() {
  const existing = _getUsers();
  if (existing.length === 0) {
    storageAdapter.set(KEYS.USERS, INITIAL_USERS);
    return { data: null, error: null };
  }
  let changed = false;
  for (const user of existing) {
    if (!isBcryptHash(user.password)) {
      user.password = await bcrypt.hash(user.password, 10);
      changed = true;
    }
  }
  if (changed) _saveUsers(existing);
  return { data: null, error: null };
}

/** @returns {{data: User[], error: null}} */
export function getUsers() {
  return { data: _getUsers(), error: null };
}

/** @param {string} id @returns {{data: User|null, error: null}} */
export function getUser(id) {
  return { data: _getUsers().find(u => u.id === id) ?? null, error: null };
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{data: Session|null, error: string|null}>}
 */
export async function login(username, password) {
  const users = _getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return { data: null, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  const match = await bcrypt.compare(password, user.password);
  if (!match) return { data: null, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  const session = { id: user.id, username: user.username, displayName: user.displayName };
  storageAdapter.set(KEYS.SESSION, session);
  return { data: session, error: null };
}

/** @returns {{data: null, error: null}} */
export function logout() {
  storageAdapter.remove(KEYS.SESSION);
  return { data: null, error: null };
}

/** @returns {{data: Session|null, error: null}} */
export function getSession() {
  return { data: storageAdapter.get(KEYS.SESSION), error: null };
}

/**
 * @param {string} userId
 * @param {string} recipeId
 * @returns {{data: boolean, error: null}}
 */
export function toggleFavorite(userId, recipeId) {
  const users = _getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { data: false, error: null };
  const favs = (user.favorites ??= []);
  const idx = favs.indexOf(recipeId);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(recipeId);
  }
  _saveUsers(users);
  return { data: idx < 0, error: null };
}

/**
 * @param {string} userId
 * @param {string} recipeId
 * @returns {{data: boolean, error: null}}
 */
export function isFavorite(userId, recipeId) {
  const user = _getUsers().find(u => u.id === userId);
  return { data: user?.favorites?.includes(recipeId) ?? false, error: null };
}

/**
 * @param {string} userId
 * @returns {{data: string[], error: null}}
 */
export function getFavoriteIds(userId) {
  const user = _getUsers().find(u => u.id === userId);
  return { data: user?.favorites ?? [], error: null };
}
