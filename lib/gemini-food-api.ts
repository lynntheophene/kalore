import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

export interface FoodRecognitionResult {
  confidence: number;
  suggestions: Array<{
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
  }>;
}

export const recognizeFoodFromImage = async (imageUri: string): Promise<FoodRecognitionResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.readAsDataURL(blob);
    });

    const prompt = `
    Analyze this food image and provide detailed nutritional information. Return a JSON response with the following structure:
    {
      "confidence": 0.85,
      "suggestions": [
        {
          "id": "unique_id",
          "name": "Food Name",
          "calories_per_100g": 250,
          "protein_per_100g": 15.5,
          "carbs_per_100g": 30.2,
          "fat_per_100g": 8.1,
          "fiber_per_100g": 2.5,
          "sugar_per_100g": 5.0,
          "category": "Proteins|Vegetables|Fruits|Grains|Dairy|Snacks",
          "brand": "Brand Name (if applicable)"
        }
      ]
    }

    Rules:
    1. Provide 1-3 most likely food items you can identify
    2. Use accurate nutritional values per 100g
    3. Confidence should be between 0.1-1.0
    4. Categories: Proteins, Vegetables, Fruits, Grains, Dairy, Snacks, Beverages
    5. If you can't identify the food clearly, provide generic similar foods
    6. Return only valid JSON, no additional text
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const responseText = result.response.text();
    
    // Clean the response to extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsedResult = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!parsedResult.suggestions || !Array.isArray(parsedResult.suggestions)) {
      throw new Error('Invalid response structure');
    }
    
    // Add unique IDs if missing and ensure all required fields are present
    parsedResult.suggestions = parsedResult.suggestions.map((item: any, index: number) => ({
      // Always generate our own IDs for AI suggestions to avoid UUID conflicts
      id: `gemini_${Date.now()}_${index}`,
      name: item.name || 'Unknown Food',
      calories_per_100g: Number(item.calories_per_100g) || 100,
      protein_per_100g: Number(item.protein_per_100g) || 5,
      carbs_per_100g: Number(item.carbs_per_100g) || 15,
      fat_per_100g: Number(item.fat_per_100g) || 3,
      fiber_per_100g: item.fiber_per_100g ? Number(item.fiber_per_100g) : null,
      sugar_per_100g: item.sugar_per_100g ? Number(item.sugar_per_100g) : null,
      category: item.category || 'Unknown',
      brand: item.brand || undefined,
    }));

    return {
      confidence: Number(parsedResult.confidence) || 0.5,
      suggestions: parsedResult.suggestions
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Fallback response
    return {
      confidence: 0.5,
      suggestions: [
        {
          id: `fallback_${Date.now()}`,
          name: 'Unknown Food Item',
          calories_per_100g: 200,
          protein_per_100g: 10,
          carbs_per_100g: 25,
          fat_per_100g: 8,
          fiber_per_100g: 3,
          sugar_per_100g: 5,
          category: 'Unknown',
          brand: undefined,
        }
      ]
    };
  }
};

export const searchFoodWithGemini = async (query: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Search for food items matching "${query}" and provide detailed nutritional information. Return a JSON array with the following structure:
    [
      {
        "id": "unique_id",
        "name": "Food Name",
        "calories_per_100g": 250,
        "protein_per_100g": 15.5,
        "carbs_per_100g": 30.2,
        "fat_per_100g": 8.1,
        "fiber_per_100g": 2.5,
        "sugar_per_100g": 5.0,
        "category": "Proteins|Vegetables|Fruits|Grains|Dairy|Snacks",
        "brand": "Brand Name (if applicable)"
      }
    ]

    Rules:
    1. Provide 3-8 most relevant food items matching the search query
    2. Use accurate nutritional values per 100g from reliable sources
    3. Include common variations and brands if applicable
    4. Categories: Proteins, Vegetables, Fruits, Grains, Dairy, Snacks, Beverages
    5. Return only valid JSON array, no additional text
    6. If no matches, return empty array []
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the response to extract JSON
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const parsedResults = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the results
    if (!Array.isArray(parsedResults)) {
      return [];
    }
    
    // Add unique IDs if missing and ensure all required fields are present
    return parsedResults.map((item: any, index: number) => ({
      // Always generate our own IDs for AI search results to avoid UUID conflicts
      id: `search_${Date.now()}_${index}`,
      name: item.name || 'Unknown Food',
      calories_per_100g: Number(item.calories_per_100g) || 100,
      protein_per_100g: Number(item.protein_per_100g) || 5,
      carbs_per_100g: Number(item.carbs_per_100g) || 15,
      fat_per_100g: Number(item.fat_per_100g) || 3,
      fiber_per_100g: item.fiber_per_100g ? Number(item.fiber_per_100g) : null,
      sugar_per_100g: item.sugar_per_100g ? Number(item.sugar_per_100g) : null,
      category: item.category || 'Unknown',
      brand: item.brand || undefined,
    }));
  } catch (error) {
    console.error('Gemini Search Error:', error);
    return [];
  }
};

export const getNutritionalAdvice = async (userGoals: any, recentEntries: any[]) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    As a professional nutritionist, analyze this user's nutrition data and provide personalized advice:

    Daily Goals:
    - Calories: ${userGoals.daily_calories}
    - Protein: ${userGoals.daily_protein}g
    - Carbs: ${userGoals.daily_carbs}g
    - Fat: ${userGoals.daily_fat}g

    Recent Food Entries (last 7 days):
    ${recentEntries.map(entry => `- ${entry.food_item?.name}: ${entry.quantity}g (${entry.meal_type})`).join('\n')}

    Provide a JSON response with:
    {
      "overall_assessment": "Brief overall nutrition assessment",
      "recommendations": [
        "Specific actionable recommendation 1",
        "Specific actionable recommendation 2",
        "Specific actionable recommendation 3"
      ],
      "missing_nutrients": ["nutrient1", "nutrient2"],
      "excess_nutrients": ["nutrient1", "nutrient2"],
      "meal_suggestions": [
        {
          "meal_type": "breakfast|lunch|dinner|snack",
          "suggestion": "Specific meal suggestion",
          "reason": "Why this meal is recommended"
        }
      ]
    }

    Keep advice professional, actionable, and suitable for business professionals.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini Advice Error:', error);
    return {
      overall_assessment: "Unable to generate personalized advice at this time.",
      recommendations: [
        "Maintain a balanced diet with variety",
        "Stay hydrated throughout the day",
        "Consider consulting with a nutritionist"
      ],
      missing_nutrients: [],
      excess_nutrients: [],
      meal_suggestions: []
    };
  }
};