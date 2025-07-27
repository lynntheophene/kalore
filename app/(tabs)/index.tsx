import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FoodEntry } from '@/types/database';
import { TrendingUp, Target, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const { user, session } = useAuth();
  const [todaysEntries, setTodaysEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todaysCalories = todaysEntries.reduce((total, entry) => {
    const calories = entry.food_item ? 
      (entry.food_item.calories_per_100g * entry.quantity) / 100 : 0;
    return total + calories;
  }, 0);

  const dailyGoal = 2000; // Default goal
  const progress = Math.min((todaysCalories / dailyGoal) * 100, 100);

  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/login');
      return;
    }
    loadTodaysEntries();
  }, [session]);

  const loadTodaysEntries = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('food_entries')
      .select(`
        *,
        food_item:food_items(*)
      `)
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`)
      .order('logged_at', { ascending: false });

    if (!error && data) {
      setTodaysEntries(data as any);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTodaysEntries();
  };

  if (!session) {
    return null;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#2563EB', '#1D4ED8']}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>
          Welcome back, {user?.user_metadata?.full_name || 'User'}
        </Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.caloriesText}>{Math.round(todaysCalories)}</Text>
              <Text style={styles.caloriesLabel}>calories consumed</Text>
            </View>
            <View style={styles.goalBadge}>
              <Target size={16} color="#059669" />
              <Text style={styles.goalText}>{dailyGoal}</Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          
          <Text style={styles.progressText}>
            {Math.round(dailyGoal - todaysCalories)} calories remaining
          </Text>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            title="Scan Food"
            onPress={() => router.push('/(tabs)/camera')}
            variant="primary"
            size="large"
            style={styles.scanButton}
          />
          
          <Button
            title="Add Manually"
            onPress={() => router.push('/(tabs)/manual-entry')}
            variant="outline"
            size="large"
            style={styles.manualButton}
          />
        </View>

        <Card>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
          </View>
          
          {todaysEntries.length > 0 ? (
            todaysEntries.map((entry) => (
              <View key={entry.id} style={styles.mealEntry}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>
                    {entry.food_item?.name || 'Unknown Food'}
                  </Text>
                  <Text style={styles.mealDetails}>
                    {entry.quantity}g • {entry.meal_type}
                  </Text>
                </View>
                <Text style={styles.mealCalories}>
                  {entry.food_item ? Math.round((entry.food_item.calories_per_100g * entry.quantity) / 100) : 0} cal
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No meals logged today</Text>
              <Text style={styles.emptySubtext}>Start by scanning or adding your first meal</Text>
            </View>
          )}
        </Card>

        <Card>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Quick Stats</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todaysEntries.length}</Text>
              <Text style={styles.statLabel}>Meals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round(todaysEntries.reduce((total, entry) => 
                  total + (entry.food_item?.protein_per_100g || 0) * entry.quantity / 100, 0
                ))}g
              </Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round(todaysEntries.reduce((total, entry) => 
                  total + (entry.food_item?.carbs_per_100g || 0) * entry.quantity / 100, 0
                ))}g
              </Text>
              <Text style={styles.statLabel}>Carbs</Text>
            </View>
          </View>
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
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
  },
  content: {
    padding: 24,
  },
  progressCard: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  caloriesLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goalText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  scanButton: {
    flex: 1,
  },
  manualButton: {
    flex: 1,
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
  },
  mealEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  mealDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  mealCalories: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
});