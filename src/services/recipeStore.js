import INITIAL_RECIPES from '../data/recipes.json';

const KEY = 'cooking_recipes';

export function initRecipes() {
  if (!localStorage.getItem(KEY)) {
    localStorage.setItem(KEY, JSON.stringify(INITIAL_RECIPES));
  }
}

export function getRecipes() {
  const raw = localStorage.getItem(KEY);
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
  localStorage.setItem(KEY, JSON.stringify(recipes));
}

export function deleteRecipe(id) {
  const recipes = getRecipes().filter(r => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(recipes));
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
