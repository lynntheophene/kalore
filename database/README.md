# Database Setup

This directory contains the database schema and setup files for NutriTrack Pro.

## Files

- `schema.sql` - Complete database schema including tables, constraints, and Row Level Security policies
- `sample_data.sql` - Sample food items for development and testing

## Setup Instructions

### 1. Initial Schema Setup

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the script to create all tables and policies

### 2. Sample Data (Optional)

For development and testing purposes, you can populate the database with sample food items:

1. After running the schema, copy and paste the contents of `sample_data.sql`
2. Run the script to insert sample food items

## Tables Created

### `food_items`
Stores nutritional information for food items including calories, macronutrients, and metadata.

### `food_entries` 
Tracks user food consumption with quantity, meal type, and optional photos/notes.

### `daily_goals`
Stores user-specific daily nutritional targets (calories, protein, carbs, fat).

## Security

All tables have Row Level Security (RLS) enabled with appropriate policies:
- Food items are publicly viewable
- Food entries and daily goals are restricted to the owning user

## Notes

- The `auth.users` table is managed by Supabase Auth automatically
- All foreign keys properly reference Supabase's built-in auth system
- Timestamps use PostgreSQL's TIMESTAMPTZ for proper timezone handling