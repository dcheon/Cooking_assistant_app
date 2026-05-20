import { describe, it, expect, beforeEach, vi } from 'vitest';

const { SEED, store } = vi.hoisted(() => {
  const SEED = [
    {
      id: 'recipe-seed-1',
      title: '김치볶음밥',
      createdBy: null,
      steps: [{ id: 's1', order: 1, instruction: '볶으세요', timerSeconds: 60 }],
      tags: ['korean'],
      prepTime: 10,
    },
  ];
  const store = {};
  return { SEED, store };
});

vi.mock('../storageAdapter', () => ({
  storageAdapter: {
    get: vi.fn((key) => store[key] ?? null),
    set: vi.fn((key, val) => { store[key] = val; }),
    remove: vi.fn((key) => { delete store[key]; }),
  },
}));

vi.mock('../../constants/storageKeys', () => ({
  KEYS: {
    RECIPES:         'recipes',
    RECIPES_VER:     'recipes_ver',
    RECIPES_BACKUP:  'recipes_backup',
    RECIPES_MIG_LOG: 'recipes_log',
  },
}));

vi.mock('../../data/recipes.json', () => ({
  default: [
    {
      id: 'recipe-seed-1',
      title: '김치볶음밥',
      createdBy: null,
      steps: [{ id: 's1', order: 1, instruction: '볶으세요', timerSeconds: 60 }],
      tags: ['korean'],
      prepTime: 10,
    },
  ],
}));

import {
  initRecipes, getRecipes, getRecipe,
  saveRecipe, deleteRecipe, getUserRecipes, getFavoriteRecipes,
} from '../recipeStore';

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
});

describe('initRecipes', () => {
  it('seeds from JSON when storage is empty', () => {
    initRecipes();
    const { data } = getRecipes();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('recipe-seed-1');
  });

  it('preserves user recipes on re-seed', () => {
    store['recipes'] = [
      ...SEED,
      { id: 'recipe-u1-abc', title: '내 레시피', createdBy: 'u1', steps: [] },
    ];
    store['recipes_ver'] = 0; // force migration
    initRecipes();
    const { data } = getRecipes();
    const ids = data.map(r => r.id);
    expect(ids).toContain('recipe-u1-abc');
    expect(ids).toContain('recipe-seed-1');
  });
});

describe('getRecipe', () => {
  beforeEach(() => initRecipes());

  it('finds existing recipe', () => {
    const { data } = getRecipe('recipe-seed-1');
    expect(data?.title).toBe('김치볶음밥');
  });

  it('returns null for unknown id', () => {
    const { data } = getRecipe('nonexistent');
    expect(data).toBeNull();
  });
});

describe('saveRecipe', () => {
  beforeEach(() => initRecipes());

  it('creates new recipe', () => {
    saveRecipe({ id: 'recipe-new-1', title: '새 레시피', createdBy: 'u1', steps: [] });
    const { data } = getRecipe('recipe-new-1');
    expect(data?.title).toBe('새 레시피');
  });

  it('updates existing recipe', () => {
    saveRecipe({ id: 'recipe-seed-1', title: '수정된 이름', createdBy: null, steps: [] });
    const { data } = getRecipe('recipe-seed-1');
    expect(data?.title).toBe('수정된 이름');
  });

  it('sets updatedAt on update', () => {
    saveRecipe({ id: 'recipe-seed-1', title: '수정', createdBy: null, steps: [] });
    const { data } = getRecipe('recipe-seed-1');
    expect(data?.updatedAt).toBeTruthy();
  });
});

describe('deleteRecipe', () => {
  beforeEach(() => initRecipes());

  it('removes recipe from list', () => {
    deleteRecipe('recipe-seed-1');
    const { data } = getRecipe('recipe-seed-1');
    expect(data).toBeNull();
  });
});

describe('getUserRecipes', () => {
  beforeEach(() => {
    initRecipes();
    saveRecipe({ id: 'recipe-u1-x', title: '내 것', createdBy: 'u1', steps: [] });
  });

  it('returns only recipes by given user', () => {
    const { data } = getUserRecipes('u1');
    expect(data.every(r => r.createdBy === 'u1')).toBe(true);
  });

  it('does not return seed recipes', () => {
    const { data } = getUserRecipes('u1');
    expect(data.some(r => r.id === 'recipe-seed-1')).toBe(false);
  });
});

describe('getFavoriteRecipes', () => {
  beforeEach(() => initRecipes());

  it('returns recipes matching given ids', () => {
    const { data } = getFavoriteRecipes(['recipe-seed-1']);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('recipe-seed-1');
  });

  it('filters out unknown ids', () => {
    const { data } = getFavoriteRecipes(['recipe-seed-1', 'nonexistent']);
    expect(data).toHaveLength(1);
  });
});
