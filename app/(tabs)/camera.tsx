import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { recognizeFoodFromImage, searchFoodWithGemini } from '@/lib/gemini-food-api';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Camera, Image as ImageIcon, Search, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Helper function to check if a string is a valid UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export default function CameraScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setCapturedImage(photo.uri);
        analyzeImage(photo.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setLoading(true);
    try {
      const result = await recognizeFoodFromImage(imageUri);
      setRecognitionResult(result);
      if (result.suggestions.length > 0) {
        setSelectedFood(result.suggestions[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image');
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = await searchFoodWithGemini(searchQuery);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search food');
    }
    setLoading(false);
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
      // Only trust UUIDs that come from actual database queries, not AI-generated ones
      if (isValidUUID(selectedFood.id) && !selectedFood.id.startsWith('gemini_') && !selectedFood.id.startsWith('search_') && !selectedFood.id.startsWith('fallback_')) {
        // It's a valid UUID from the database, use it directly
        foodItemId = selectedFood.id;
      } else {
        // It's not a valid database UUID, so it's AI-generated and needs to be saved to the database
        console.log('Processing AI-generated food item:', selectedFood.id, 'Name:', selectedFood.name);
        
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
          photo_url: capturedImage,
        });

      if (entryError) {
        console.error('Error inserting food entry:', entryError);
        Alert.alert('Error', 'Failed to log food entry');
      } else {
        Alert.alert('Success', 'Food logged successfully!');
        // Reset state
        setCapturedImage(null);
        setRecognitionResult(null);
        setSelectedFood(null);
        setSearchQuery('');
        setSearchResults([]);
        setQuantity('100');
      }
    } catch (error) {
      console.error('Error logging food:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera size={64} color="#6B7280" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to help you scan and identify food items for accurate calorie tracking.
        </Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#1D4ED8']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Scan Food</Text>
        <Text style={styles.headerSubtitle}>Capture or search for food items</Text>
      </LinearGradient>

      <View style={styles.content}>
        {!capturedImage ? (
          <Card>
            <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                <View style={styles.cameraOverlay}>
                  <View style={styles.cameraButtons}>
                    <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
                      <View style={styles.captureButton} />
                    </TouchableOpacity>
                  </View>
                </View>
              </CameraView>
            </View>
            
            <View style={styles.imageActions}>
              <Button
                title="Choose from Gallery"
                onPress={pickImage}
                variant="outline"
                style={styles.galleryButton}
              />
            </View>
          </Card>
        ) : (
          <Card>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Analyzing image with AI...</Text>
              </View>
            ) : recognitionResult ? (
              <View style={styles.recognitionResults}>
                <Text style={styles.resultsTitle}>
                  AI Food Recognition (Confidence: {Math.round(recognitionResult.confidence * 100)}%)
                </Text>
                {recognitionResult.suggestions.map((food: any, index: number) => (
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
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            
            <Button
              title="Retake Photo"
              onPress={() => {
                setCapturedImage(null);
                setRecognitionResult(null);
                setSelectedFood(null);
              }}
              variant="outline"
              style={styles.retakeButton}
            />
          </Card>
        )}

        <Card>
          <Text style={styles.sectionTitle}>AI-Powered Food Search</Text>
          <View style={styles.searchContainer}>
            <Input
              placeholder="Describe any food item..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <Button
              title="AI Search"
              onPress={handleSearch}
              variant="primary"
              size="small"
              disabled={loading}
            />
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
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
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {selectedFood && (
          <Card>
            <Text style={styles.sectionTitle}>Log Food Entry</Text>
            
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  cameraContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  camera: {
    height: 300,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  cameraButtons: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  cameraButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#2563EB',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  galleryButton: {
    flex: 1,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  recognitionResults: {
    marginBottom: 16,
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
  retakeButton: {
    marginTop: 8,
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