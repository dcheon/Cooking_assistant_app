import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock bcryptjs so tests run synchronously without real hashing
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (plain) => `hashed:${plain}`),
    compare: vi.fn(async (plain, hash) => hash === `hashed:${plain}`),
  },
}));

// Mock storageAdapter
const store = {};
vi.mock('../storageAdapter', () => ({
  storageAdapter: {
    get: vi.fn((key) => store[key] ?? null),
    set: vi.fn((key, val) => { store[key] = val; }),
    remove: vi.fn((key) => { delete store[key]; }),
  },
}));

// Mock storageKeys
vi.mock('../../constants/storageKeys', () => ({
  KEYS: { USERS: 'users', SESSION: 'session' },
}));

// Provide a seeded users.json mock
vi.mock('../../data/users.json', () => ({
  default: [],
}));

import {
  initUsers, login, logout, getSession,
  toggleFavorite, getFavoriteIds, signup,
} from '../auth';

const MOCK_USER = {
  id: 'u1',
  username: 'chef',
  password: 'hashed:1234',
  displayName: '요리사',
  email: '',
  favorites: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  store['users'] = [{ ...MOCK_USER, favorites: [] }];
});

describe('login', () => {
  it('returns session on correct credentials', async () => {
    const { data, error } = await login('chef', '1234');
    expect(error).toBeNull();
    expect(data).toMatchObject({ id: 'u1', username: 'chef' });
  });

  it('returns error on wrong password', async () => {
    const { data, error } = await login('chef', 'wrong');
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('returns error for unknown username', async () => {
    const { data, error } = await login('unknown', '1234');
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});

describe('logout', () => {
  it('removes session from storage', async () => {
    await login('chef', '1234');
    expect(store['session']).toBeTruthy();
    logout();
    expect(store['session']).toBeUndefined();
  });
});

describe('getSession', () => {
  it('returns null when no session', () => {
    const { data } = getSession();
    expect(data).toBeNull();
  });

  it('returns stored session', async () => {
    await login('chef', '1234');
    const { data } = getSession();
    expect(data?.username).toBe('chef');
  });
});

describe('toggleFavorite', () => {
  it('adds recipe to favorites', () => {
    toggleFavorite('u1', 'recipe-1');
    const { data } = getFavoriteIds('u1');
    expect(data).toContain('recipe-1');
  });

  it('removes recipe when toggled again', () => {
    toggleFavorite('u1', 'recipe-1');
    toggleFavorite('u1', 'recipe-1');
    const { data } = getFavoriteIds('u1');
    expect(data).not.toContain('recipe-1');
  });

  it('returns true when adding, false when removing', () => {
    const { data: added }   = toggleFavorite('u1', 'recipe-1');
    const { data: removed } = toggleFavorite('u1', 'recipe-1');
    expect(added).toBe(true);
    expect(removed).toBe(false);
  });
});

describe('signup', () => {
  it('creates new user and returns session', async () => {
    const { data, error } = await signup('newuser', 'pass', '새유저');
    expect(error).toBeNull();
    expect(data?.username).toBe('newuser');
  });

  it('rejects duplicate username', async () => {
    const { data, error } = await signup('chef', 'pass', '중복');
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});
