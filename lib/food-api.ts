// Mock food database for demonstration - in production, integrate with USDA FoodData Central (free API)
const MOCK_FOODS = [
  { id: '1', name: 'Apple', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2, category: 'Fruits' },
  { id: '2', name: 'Banana', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3, category: 'Fruits' },
  { id: '3', name: 'Chicken Breast', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, category: 'Proteins' },
  { id: '4', name: 'Brown Rice', calories_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9, category: 'Grains' },
  { id: '5', name: 'Salmon', calories_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 13, category: 'Proteins' },
  { id: '6', name: 'Broccoli', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4, category: 'Vegetables' },
];

export const searchFood = async (query: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (!query.trim()) return [];
  
  return MOCK_FOODS.filter(food => 
    food.name.toLowerCase().includes(query.toLowerCase())
  );
};

export const recognizeFoodFromImage = async (imageUri: string) => {
  // Mock food recognition - in production, integrate with Clarifai Food Model (free tier available)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const randomFood = MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)];
  return {
    confidence: 0.85,
    suggestions: [randomFood, MOCK_FOODS[(MOCK_FOODS.indexOf(randomFood) + 1) % MOCK_FOODS.length]]
  };
};