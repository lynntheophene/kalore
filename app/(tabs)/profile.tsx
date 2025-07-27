import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getNutritionalAdvice } from '@/lib/gemini-food-api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { User, Building, Target, LogOut, Settings, Brain, Lightbulb } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({
    full_name: '',
    company: '',
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 250,
    daily_fat: 67,
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    // Load user profile data
    setProfile({
      full_name: user.user_metadata?.full_name || '',
      company: user.user_metadata?.company || '',
      daily_calories: 2000,
      daily_protein: 150,
      daily_carbs: 250,
      daily_fat: 67,
    });

    // Load goals from database
    const { data: goals } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (goals) {
      setProfile(prev => ({
        ...prev,
        daily_calories: goals.daily_calories,
        daily_protein: goals.daily_protein,
        daily_carbs: goals.daily_carbs,
        daily_fat: goals.daily_fat,
      }));
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);

    // Save goals to database
    const { error } = await supabase
      .from('daily_goals')
      .upsert({
        user_id: user.id,
        daily_calories: profile.daily_calories,
        daily_protein: profile.daily_protein,
        daily_carbs: profile.daily_carbs,
        daily_fat: profile.daily_fat,
        updated_at: new Date().toISOString(),
      });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to save profile');
    } else {
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    }
  };

  const getPersonalizedAdvice = async () => {
    if (!user) return;

    setLoadingAdvice(true);
    try {
      // Get recent food entries
      const { data: recentEntries } = await supabase
        .from('food_entries')
        .select(`
          *,
          food_item:food_items(*)
        `)
        .eq('user_id', user.id)
        .gte('logged_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('logged_at', { ascending: false });

      const advice = await getNutritionalAdvice(profile, recentEntries || []);
      setAiAdvice(advice);
    } catch (error) {
      Alert.alert('Error', 'Failed to get personalized advice');
    }
    setLoadingAdvice(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const calculateBMR = () => {
    // Basic BMR calculation (Harris-Benedict equation)
    // This is a simplified version - in production, you'd want height, weight, age, gender
    return Math.round(profile.daily_calories * 0.75);
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <User size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>
            {profile.full_name || 'User Profile'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {user?.email}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card>
          <View style={styles.sectionHeader}>
            <Building size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{profile.full_name || 'Not set'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company</Text>
            <Text style={styles.infoValue}>{profile.company || 'Not set'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </Card>

        <Card>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Daily Goals</Text>
            <Button
              title={editing ? "Cancel" : "Edit"}
              onPress={() => setEditing(!editing)}
              variant="outline"
              size="small"
              style={styles.editButton}
            />
          </View>

          {editing ? (
            <>
              <Input
                label="Daily Calories"
                value={profile.daily_calories.toString()}
                onChangeText={(text) => setProfile(prev => ({ ...prev, daily_calories: parseInt(text) || 0 }))}
                keyboardType="numeric"
                placeholder="2000"
              />

              <Input
                label="Daily Protein (g)"
                value={profile.daily_protein.toString()}
                onChangeText={(text) => setProfile(prev => ({ ...prev, daily_protein: parseInt(text) || 0 }))}
                keyboardType="numeric"
                placeholder="150"
              />

              <Input
                label="Daily Carbs (g)"
                value={profile.daily_carbs.toString()}
                onChangeText={(text) => setProfile(prev => ({ ...prev, daily_carbs: parseInt(text) || 0 }))}
                keyboardType="numeric"
                placeholder="250"
              />

              <Input
                label="Daily Fat (g)"
                value={profile.daily_fat.toString()}
                onChangeText={(text) => setProfile(prev => ({ ...prev, daily_fat: parseInt(text) || 0 }))}
                keyboardType="numeric"
                placeholder="67"
              />

              <Button
                title={loading ? "Saving..." : "Save Goals"}
                onPress={saveProfile}
                disabled={loading}
                variant="primary"
                size="large"
              />
            </>
          ) : (
            <>
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>Daily Calories</Text>
                <Text style={styles.goalValue}>{profile.daily_calories}</Text>
              </View>

              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>Daily Protein</Text>
                <Text style={styles.goalValue}>{profile.daily_protein}g</Text>
              </View>

              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>Daily Carbs</Text>
                <Text style={styles.goalValue}>{profile.daily_carbs}g</Text>
              </View>

              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>Daily Fat</Text>
                <Text style={styles.goalValue}>{profile.daily_fat}g</Text>
              </View>
            </>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Health Insights</Text>
          
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Estimated BMR</Text>
            <Text style={styles.insightValue}>{calculateBMR()} cal/day</Text>
          </View>

          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Protein Target</Text>
            <Text style={styles.insightValue}>
              {Math.round((profile.daily_protein * 4 / profile.daily_calories) * 100)}% of calories
            </Text>
          </View>

          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Carb Target</Text>
            <Text style={styles.insightValue}>
              {Math.round((profile.daily_carbs * 4 / profile.daily_calories) * 100)}% of calories
            </Text>
          </View>
        </Card>

        <Card>
          <View style={styles.sectionHeader}>
            <Brain size={20} color="#374151" />
            <Text style={styles.sectionTitle}>AI Nutrition Insights</Text>
            <Button
              title={loadingAdvice ? "Loading..." : "Get Advice"}
              onPress={getPersonalizedAdvice}
              variant="outline"
              size="small"
              disabled={loadingAdvice}
              style={styles.editButton}
            />
          </View>

          {loadingAdvice ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Analyzing your nutrition data...</Text>
            </View>
          ) : aiAdvice ? (
            <View style={styles.adviceContainer}>
              <View style={styles.assessmentContainer}>
                <Text style={styles.assessmentTitle}>Overall Assessment</Text>
                <Text style={styles.assessmentText}>{aiAdvice.overall_assessment}</Text>
              </View>

              {aiAdvice.recommendations.length > 0 && (
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.recommendationsTitle}>Recommendations</Text>
                  {aiAdvice.recommendations.map((rec: string, index: number) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Lightbulb size={16} color="#059669" />
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}

              {aiAdvice.meal_suggestions.length > 0 && (
                <View style={styles.mealSuggestionsContainer}>
                  <Text style={styles.mealSuggestionsTitle}>Meal Suggestions</Text>
                  {aiAdvice.meal_suggestions.map((meal: any, index: number) => (
                    <View key={index} style={styles.mealSuggestionItem}>
                      <Text style={styles.mealType}>{meal.meal_type.toUpperCase()}</Text>
                      <Text style={styles.mealSuggestion}>{meal.suggestion}</Text>
                      <Text style={styles.mealReason}>{meal.reason}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noAdviceContainer}>
              <Text style={styles.noAdviceText}>
                Get personalized nutrition insights powered by AI based on your recent food entries and goals.
              </Text>
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            size="large"
            style={styles.signOutButton}
          />
        </Card>
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
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  editButton: {
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  goalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  goalValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#2563EB',
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  insightLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  insightValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
  signOutButton: {
    borderColor: '#DC2626',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
  },
  adviceContainer: {
    gap: 16,
  },
  assessmentContainer: {
    backgroundColor: '#EBF4FF',
    padding: 16,
    borderRadius: 12,
  },
  assessmentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
    marginBottom: 8,
  },
  assessmentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  recommendationsContainer: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  mealSuggestionsContainer: {
    backgroundColor: '#FEF3E2',
    padding: 16,
    borderRadius: 12,
  },
  mealSuggestionsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EA580C',
    marginBottom: 12,
  },
  mealSuggestionItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  mealType: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#EA580C',
    marginBottom: 4,
  },
  mealSuggestion: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 4,
  },
  mealReason: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  noAdviceContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noAdviceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});