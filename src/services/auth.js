import { KEYS } from '../constants/storageKeys';
import INITIAL_USERS from '../data/users.json';

export function initUsers() {
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
}

export function getUsers() {
  const raw = localStorage.getItem(KEYS.USERS);
  return raw ? JSON.parse(raw) : [];
}

export function getUser(id) {
  return getUsers().find(u => u.id === id) ?? null;
}

function saveUsers(users) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export function login(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return null;
  const session = { id: user.id, username: user.username, displayName: user.displayName };
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(KEYS.SESSION);
}

export function getSession() {
  const raw = localStorage.getItem(KEYS.SESSION);
  return raw ? JSON.parse(raw) : null;
}

export function toggleFavorite(userId, recipeId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  const idx = (user.favorites ??= []).indexOf(recipeId);
  if (idx >= 0) {
    user.favorites.splice(idx, 1);
  } else {
    user.favorites.push(recipeId);
  }
  saveUsers(users);
  return idx < 0;
}

export function isFavorite(userId, recipeId) {
  return getUser(userId)?.favorites?.includes(recipeId) ?? false;
}

export function getFavoriteIds(userId) {
  return getUser(userId)?.favorites ?? [];
}
