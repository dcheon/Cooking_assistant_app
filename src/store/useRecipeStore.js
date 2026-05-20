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

  init: (userId) => set({
    recipes:     getRecipes().data,
    favoriteIds: userId ? getFavoriteIds(userId).data : [],
  }),

  saveRecipe: (recipe) => {
    svcSave(recipe);
    set({ recipes: getRecipes().data });
  },

  deleteRecipe: (id) => {
    svcDelete(id);
    set({ recipes: getRecipes().data });
  },

  toggleFavorite: (userId, recipeId) => {
    svcToggleFavorite(userId, recipeId);
    set({ favoriteIds: getFavoriteIds(userId).data });
  },
}));

export default useRecipeStore;
