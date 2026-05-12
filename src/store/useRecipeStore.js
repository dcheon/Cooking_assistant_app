import { create } from 'zustand';
import {
  getRecipes,
  saveRecipe  as svcSave,
  deleteRecipe as svcDelete,
} from '../services/recipeStore';
import {
  toggleFavorite as svcToggleFavorite,
  getFavoriteIds,
} from '../services/auth';

const useRecipeStore = create((set) => ({
  recipes:     [],
  favoriteIds: [],

  // Call after login/logout or on app start
  init: (userId) => set({
    recipes:     getRecipes(),
    favoriteIds: userId ? getFavoriteIds(userId) : [],
  }),

  saveRecipe: (recipe) => {
    svcSave(recipe);
    set({ recipes: getRecipes() });
  },

  deleteRecipe: (id) => {
    svcDelete(id);
    set({ recipes: getRecipes() });
  },

  toggleFavorite: (userId, recipeId) => {
    svcToggleFavorite(userId, recipeId);
    set({ favoriteIds: getFavoriteIds(userId) });
  },
}));

export default useRecipeStore;
