import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { searchFoodWithGemini } from '@/lib/gemini-food-api';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Helper function to check if a string is a valid UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export default function ManualEntryScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Custom food entry fields
  const [customFood, setCustomFood] = useState({
    name: '',
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: '',
    category: 'Unknown'
  });
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchFoodWithGemini(searchQuery);
      setSearchResults(results);
      setShowCustomForm(false);
      setSelectedFood(null);
    } catch (error) {
      console.error('Error searching food:', error);
      Alert.alert('Error', 'Failed to search food');
    }
    setIsSearching(false);
  };

  const handleCustomFoodSubmit = () => {
    if (!customFood.name.trim() || !customFood.calories_per_100g) {
      Alert.alert('Error', 'Please fill in at least the food name and calories');
      return;
    }

    const newCustomFood = {
      id: `custom_${Date.now()}`,
      name: customFood.name,
      calories_per_100g: parseFloat(customFood.calories_per_100g) || 0,
      protein_per_100g: parseFloat(customFood.protein_per_100g) || 0,
      carbs_per_100g: parseFloat(customFood.carbs_per_100g) || 0,
      fat_per_100g: parseFloat(customFood.fat_per_100g) || 0,
      category: customFood.category
    };

    setSelectedFood(newCustomFood);
    setShowCustomForm(false);
  };

  const logFood = async () => {
    if (!selectedFood || !user) {
      Alert.alert('Error', 'Please select a food item');
      return;
    }

    setLoading(true);

    try {
      let foodItemId: string | null = null;

      // Check if the selected food ID is already a valid UUID from the database
      if (isValidUUID(selectedFood.id) && !selectedFood.id.startsWith('gemini_') && !selectedFood.id.startsWith('search_') && !selectedFood.id.startsWith('custom_')) {
        // It's a valid UUID from the database, use it directly
        foodItemId = selectedFood.id;
      } else {
        // It's AI-generated or custom, so it needs to be saved to the database
        console.log('Processing non-database food item:', selectedFood.id, 'Name:', selectedFood.name);
        
        // Try to find an existing food item with the same name and calories
        const { data: existingFood, error: searchError } = await supabase
          .from('food_items')
          .select('id')
          .eq('name', selectedFood.name)
          .eq('calories_per_100g', selectedFood.calories_per_100g)
          .maybeSingle();

        if (searchError && searchError.code !== 'PGRST116') {
          console.error('Error searching for existing food:', searchError);
          Alert.alert('Error', 'Failed to search for food in database');
          setLoading(false);
          return;
        }

        if (existingFood && existingFood.id) {
          console.log('Found existing food item with UUID:', existingFood.id);
          foodItemId = existingFood.id;
        } else {
          console.log('Creating new food item in database...');
          // Insert new food item
          const { data: insertedFood, error: foodError } = await supabase
            .from('food_items')
            .insert({
              name: selectedFood.name,
              calories_per_100g: selectedFood.calories_per_100g,
              protein_per_100g: selectedFood.protein_per_100g,
              carbs_per_100g: selectedFood.carbs_per_100g,
              fat_per_100g: selectedFood.fat_per_100g,
              fiber_per_100g: selectedFood.fiber_per_100g || null,
              sugar_per_100g: selectedFood.sugar_per_100g || null,
              category: selectedFood.category,
              brand: selectedFood.brand || null,
            })
            .select()
            .single();

          if (foodError || !insertedFood) {
            console.error('Error inserting food item:', foodError);
            Alert.alert('Error', 'Failed to save food item to database');
            setLoading(false);
            return;
          }

          console.log('Created new food item with UUID:', insertedFood.id);
          foodItemId = insertedFood.id;
        }
      }

      // Final validation - make sure we have a valid UUID
      if (!foodItemId || !isValidUUID(foodItemId)) {
        console.error('Invalid foodItemId after processing:', foodItemId, 'Selected food:', selectedFood.id);
        Alert.alert('Error', 'Failed to get valid food item ID. Please try selecting the food again.');
        setLoading(false);
        return;
      }

      console.log('Logging food entry with UUID:', foodItemId);

      // Insert the food entry
      const { error: entryError } = await supabase
        .from('food_entries')
        .insert({
          user_id: user.id,
          food_item_id: foodItemId,
          quantity: parseInt(quantity),
          meal_type: mealType,
          logged_at: new Date().toISOString(),
        });

      if (entryError) {
        console.error('Error inserting food entry:', entryError);
        Alert.alert('Error', 'Failed to log food entry');
      } else {
        Alert.alert('Success', 'Food logged successfully!');
        // Reset state
        setSelectedFood(null);
        setSearchQuery('');
        setSearchResults([]);
        setQuantity('100');
        setCustomFood({
          name: '',
          calories_per_100g: '',
          protein_per_100g: '',
          carbs_per_100g: '',
          fat_per_100g: '',
          category: 'Unknown'
        });
        setShowCustomForm(false);
      }
    } catch (error) {
      console.error('Error logging food:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#059669', '#047857']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Add Food Manually</Text>
        <Text style={styles.headerSubtitle}>Search or create custom food entries</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>Search Food Database</Text>
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search for any food item..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <Button
              title="Search"
              onPress={handleSearch}
              variant="primary"
              size="small"
              disabled={isSearching}
            />
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              <Text style={styles.resultsTitle}>Search Results</Text>
              {searchResults.map((food) => (
                <TouchableOpacity
                  key={food.id}
                  style={[
                    styles.foodSuggestion,
                    selectedFood?.id === food.id && styles.selectedFood
                  ]}
                  onPress={() => setSelectedFood(food)}
                >
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodCalories}>{food.calories_per_100g} cal/100g</Text>
                  <Text style={styles.foodCategory}>{food.category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <View style={styles.customHeader}>
            <Text style={styles.sectionTitle}>Custom Food Entry</Text>
            <TouchableOpacity
              style={styles.addCustomButton}
              onPress={() => {
                setShowCustomForm(!showCustomForm);
                setSearchResults([]);
                setSelectedFood(null);
              }}
            >
              <Plus size={16} color="#2563EB" />
              <Text style={styles.addCustomText}>Add Custom</Text>
            </TouchableOpacity>
          </View>

          {showCustomForm && (
            <View style={styles.customForm}>
              <Input
                label="Food Name *"
                value={customFood.name}
                onChangeText={(text) => setCustomFood(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Homemade Pasta"
              />
              
              <Input
                label="Calories per 100g *"
                value={customFood.calories_per_100g}
                onChangeText={(text) => setCustomFood(prev => ({ ...prev, calories_per_100g: text }))}
                keyboardType="numeric"
                placeholder="250"
              />
              
              <View style={styles.macroRow}>
                <Input
                  label="Protein (g)"
                  value={customFood.protein_per_100g}
                  onChangeText={(text) => setCustomFood(prev => ({ ...prev, protein_per_100g: text }))}
                  keyboardType="numeric"
                  placeholder="15"
                  style={styles.macroInput}
                />
                
                <Input
                  label="Carbs (g)"
                  value={customFood.carbs_per_100g}
                  onChangeText={(text) => setCustomFood(prev => ({ ...prev, carbs_per_100g: text }))}
                  keyboardType="numeric"
                  placeholder="30"
                  style={styles.macroInput}
                />
                
                <Input
                  label="Fat (g)"
                  value={customFood.fat_per_100g}
                  onChangeText={(text) => setCustomFood(prev => ({ ...prev, fat_per_100g: text }))}
                  keyboardType="numeric"
                  placeholder="8"
                  style={styles.macroInput}
                />
              </View>

              <Button
                title="Use Custom Food"
                onPress={handleCustomFoodSubmit}
                variant="outline"
                style={styles.useCustomButton}
              />
            </View>
          )}
        </Card>

        {selectedFood && (
          <Card>
            <Text style={styles.sectionTitle}>Log Food Entry</Text>
            
            <View style={styles.selectedFoodInfo}>
              <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
              <Text style={styles.selectedFoodNutrition}>
                {selectedFood.calories_per_100g} cal, {selectedFood.protein_per_100g}g protein per 100g
              </Text>
            </View>
            
            <Input
              label="Quantity (grams)"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="100"
            />

            <Text style={styles.inputLabel}>Meal Type</Text>
            <View style={styles.mealTypeContainer}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeButton,
                    mealType === type && styles.selectedMealType
                  ]}
                  onPress={() => setMealType(type)}
                >
                  <Text style={[
                    styles.mealTypeText,
                    mealType === type && styles.selectedMealTypeText
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.nutritionSummary}>
              <Text style={styles.nutritionTitle}>Nutrition Summary</Text>
              <Text style={styles.nutritionText}>
                Calories: {Math.round((selectedFood.calories_per_100g * parseInt(quantity || '0')) / 100)}
              </Text>
              <Text style={styles.nutritionText}>
                Protein: {Math.round((selectedFood.protein_per_100g * parseInt(quantity || '0')) / 100)}g
              </Text>
              <Text style={styles.nutritionText}>
                Carbs: {Math.round((selectedFood.carbs_per_100g * parseInt(quantity || '0')) / 100)}g
              </Text>
              <Text style={styles.nutritionText}>
                Fat: {Math.round((selectedFood.fat_per_100g * parseInt(quantity || '0')) / 100)}g
              </Text>
            </View>

            <Button
              title={loading ? "Logging Food..." : "Log Food Entry"}
              onPress={logFood}
              variant="primary"
              size="large"
              disabled={loading}
            />
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchResults: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  foodSuggestion: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFood: {
    borderColor: '#2563EB',
    backgroundColor: '#EBF4FF',
  },
  foodName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  foodCalories: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  foodCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 6,
  },
  addCustomText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
    marginLeft: 4,
  },
  customForm: {
    marginTop: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
  useCustomButton: {
    marginTop: 8,
  },
  selectedFoodInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedFoodName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  selectedFoodNutrition: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedMealType: {
    borderColor: '#2563EB',
    backgroundColor: '#EBF4FF',
  },
  mealTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  selectedMealTypeText: {
    color: '#2563EB',
  },
  nutritionSummary: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  nutritionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  nutritionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 4,
  },
});