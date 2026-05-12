import INITIAL_USERS from '../data/users.json';

const USERS_KEY = 'cooking_users';
const SESSION_KEY = 'cooking_session';

export function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
}

export function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getUser(id) {
  return getUsers().find(u => u.id === id) ?? null;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function login(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return null;
  const session = { id: user.id, username: user.username, displayName: user.displayName };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
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
  return idx < 0; // returns true if now favorited
}

export function isFavorite(userId, recipeId) {
  return getUser(userId)?.favorites?.includes(recipeId) ?? false;
}

export function getFavoriteIds(userId) {
  return getUser(userId)?.favorites ?? [];
}
