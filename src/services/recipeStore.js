import { KEYS } from '../constants/storageKeys';
import { storageAdapter } from './storageAdapter';
import INITIAL_RECIPES from '../data/recipes.json';

/**
 * @typedef {{ id: string, order: number, instruction: string, timerSeconds: number|null }} Step
 * @typedef {{ id: string, title: string, category: string, description: string, ingredients: string[], steps: Step[], tags: string[], difficulty: 'easy'|'medium'|'hard', prepTime: number, cookTime: number, servings: number, createdBy: string|null, isPublic: boolean, createdAt: string, updatedAt: string }} Recipe
 */

const RECIPE_VERSION = 3;

/** @param {Recipe} r @returns {boolean} */
function _isUserRecipe(r) {
  return r.createdBy !== null && typeof r.id === 'string' && r.id.startsWith('recipe-');
}

/** @returns {{data: null, error: null}} */
export function initRecipes() {
  const storedVer = Number(storageAdapter.get(KEYS.RECIPES_VER) ?? 0);
  if (!storageAdapter.get(KEYS.RECIPES) || storedVer < RECIPE_VERSION) {
    const existing = storageAdapter.get(KEYS.RECIPES) ?? [];
    storageAdapter.set(KEYS.RECIPES_BACKUP, existing);
    try {
      const userRecipes = existing.filter(_isUserRecipe);
      storageAdapter.set(KEYS.RECIPES, [...INITIAL_RECIPES, ...userRecipes]);
      storageAdapter.set(KEYS.RECIPES_VER, RECIPE_VERSION);
      const log = storageAdapter.get(KEYS.RECIPES_MIG_LOG) ?? [];
      log.push({ date: new Date().toISOString(), fromVersion: storedVer, toVersion: RECIPE_VERSION, preserved: userRecipes.length });
      storageAdapter.set(KEYS.RECIPES_MIG_LOG, log);
    } catch (e) {
      console.error('[recipeStore] migration failed, rolling back', e);
      storageAdapter.set(KEYS.RECIPES, existing);
    }
  }
  return { data: null, error: null };
}

/** @returns {{data: Recipe[], error: null}} */
export function getRecipes() {
  return { data: storageAdapter.get(KEYS.RECIPES) ?? [], error: null };
}

/** @param {string} id @returns {{data: Recipe|null, error: null}} */
export function getRecipe(id) {
  const recipes = storageAdapter.get(KEYS.RECIPES) ?? [];
  return { data: recipes.find(r => r.id === id) ?? null, error: null };
}

/** @param {Recipe} recipe @returns {{data: null, error: null}} */
export function saveRecipe(recipe) {
  const recipes = storageAdapter.get(KEYS.RECIPES) ?? [];
  const idx = recipes.findIndex(r => r.id === recipe.id);
  const now = new Date().toISOString();
  if (idx >= 0) {
    recipes[idx] = { ...recipe, updatedAt: now };
  } else {
    recipes.push({ ...recipe, createdAt: now, updatedAt: now });
  }
  storageAdapter.set(KEYS.RECIPES, recipes);
  return { data: null, error: null };
}

/** @param {string} id @returns {{data: null, error: null}} */
export function deleteRecipe(id) {
  const recipes = (storageAdapter.get(KEYS.RECIPES) ?? []).filter(r => r.id !== id);
  storageAdapter.set(KEYS.RECIPES, recipes);
  return { data: null, error: null };
}

/** @param {string} userId @returns {{data: Recipe[], error: null}} */
export function getUserRecipes(userId) {
  const recipes = storageAdapter.get(KEYS.RECIPES) ?? [];
  return { data: recipes.filter(r => r.createdBy === userId), error: null };
}

/** @param {string[]} ids @returns {{data: Recipe[], error: null}} */
export function getFavoriteRecipes(ids) {
  const recipes = storageAdapter.get(KEYS.RECIPES) ?? [];
  return { data: ids.map(id => recipes.find(r => r.id === id)).filter(Boolean), error: null };
}

/** @returns {string} */
export function genId() {
  return `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** @returns {string} */
export function genStepId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
