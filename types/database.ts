export interface User {
  id: string;
  email: string;
  full_name: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  category: string;
  brand?: string;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  food_item_id: string;
  quantity: number; // in grams
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_at: string;
  photo_url?: string;
  notes?: string;
  food_item?: FoodItem;
}

export interface DailyGoal {
  id: string;
  user_id: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  created_at: string;
  updated_at: string;
}