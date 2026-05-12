import { KEYS } from '../constants/storageKeys';
import INITIAL_RECIPES from '../data/recipes.json';

// Increment when seed recipe data changes (triggers migration of default recipes)
const RECIPE_VERSION = 3;

export function initRecipes() {
  const storedVer = Number(localStorage.getItem(KEYS.RECIPES_VER) || '0');
  if (!localStorage.getItem(KEYS.RECIPES) || storedVer < RECIPE_VERSION) {
    const existing = getRecipes();
    const userRecipes = existing.filter(r => r.createdBy !== null);
    localStorage.setItem(KEYS.RECIPES, JSON.stringify([...INITIAL_RECIPES, ...userRecipes]));
    localStorage.setItem(KEYS.RECIPES_VER, String(RECIPE_VERSION));
  }
}

export function getRecipes() {
  const raw = localStorage.getItem(KEYS.RECIPES);
  return raw ? JSON.parse(raw) : [];
}

export function getRecipe(id) {
  return getRecipes().find(r => r.id === id) ?? null;
}

export function saveRecipe(recipe) {
  const recipes = getRecipes();
  const idx = recipes.findIndex(r => r.id === recipe.id);
  const now = new Date().toISOString();
  if (idx >= 0) {
    recipes[idx] = { ...recipe, updatedAt: now };
  } else {
    recipes.push({ ...recipe, createdAt: now, updatedAt: now });
  }
  localStorage.setItem(KEYS.RECIPES, JSON.stringify(recipes));
}

export function deleteRecipe(id) {
  const recipes = getRecipes().filter(r => r.id !== id);
  localStorage.setItem(KEYS.RECIPES, JSON.stringify(recipes));
}

export function getUserRecipes(userId) {
  return getRecipes().filter(r => r.createdBy === userId);
}

export function getFavoriteRecipes(ids) {
  const recipes = getRecipes();
  return ids.map(id => recipes.find(r => r.id === id)).filter(Boolean);
}

export function genId() {
  return `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function genStepId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
