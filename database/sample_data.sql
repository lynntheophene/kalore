-- Sample data for NutriTrack Pro
-- This file contains sample data for testing and development
-- Run this after schema.sql to populate tables with sample food items

-- Insert sample food items
INSERT INTO food_items (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, category, brand) VALUES
('Chicken Breast', 165, 31, 0, 3.6, 0, 0, 'Protein', NULL),
('Brown Rice', 111, 2.6, 23, 0.9, 1.8, 0.4, 'Grains', NULL),
('Broccoli', 34, 2.8, 7, 0.4, 2.6, 1.5, 'Vegetables', NULL),
('Banana', 89, 1.1, 23, 0.3, 2.6, 12, 'Fruits', NULL),
('Greek Yogurt', 59, 10, 3.6, 0.4, 0, 3.6, 'Dairy', NULL),
('Salmon', 208, 20, 0, 12, 0, 0, 'Protein', NULL),
('Quinoa', 120, 4.4, 22, 1.9, 2.8, 0.9, 'Grains', NULL),
('Spinach', 23, 2.9, 3.6, 0.4, 2.2, 0.4, 'Vegetables', NULL),
('Apple', 52, 0.3, 14, 0.2, 2.4, 10, 'Fruits', NULL),
('Almonds', 579, 21, 22, 50, 12, 4.4, 'Nuts', NULL),
('Sweet Potato', 86, 1.6, 20, 0.1, 3, 4.2, 'Vegetables', NULL),
('Oats', 389, 17, 66, 6.9, 11, 0.8, 'Grains', NULL);

-- Note: The above sample data is for demonstration purposes only.
-- In production, food data should come from verified nutritional databases.