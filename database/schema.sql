-- NutriTrack Pro Database Schema
-- This file contains the complete database schema for the Kalore app
-- Run this script in your Supabase SQL editor to set up all required tables

-- Food items table
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  calories_per_100g DECIMAL NOT NULL,
  protein_per_100g DECIMAL NOT NULL,
  carbs_per_100g DECIMAL NOT NULL,
  fat_per_100g DECIMAL NOT NULL,
  fiber_per_100g DECIMAL,
  sugar_per_100g DECIMAL,
  category TEXT NOT NULL,
  brand TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food entries table
CREATE TABLE food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id),
  quantity INTEGER NOT NULL, -- in grams
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT,
  notes TEXT
);

-- Daily goals table
CREATE TABLE daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_calories INTEGER NOT NULL,
  daily_protein INTEGER NOT NULL,
  daily_carbs INTEGER NOT NULL,
  daily_fat INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Food items are viewable by everyone" ON food_items FOR SELECT USING (true);
CREATE POLICY "Users can view own food entries" ON food_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON daily_goals FOR ALL USING (auth.uid() = user_id);