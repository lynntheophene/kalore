import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import { FoodEntry } from '@/types/database';
import { Calendar, TrendingUp, Filter } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadEntries();
  }, [selectedPeriod]);

  const loadEntries = async () => {
    if (!user) return;

    const now = new Date();
    const startDate = new Date();
    
    if (selectedPeriod === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    const { data, error } = await supabase
      .from('food_entries')
      .select(`
        *,
        food_item:food_items(*)
      `)
      .eq('user_id', user.id)
      .gte('logged_at', startDate.toISOString())
      .order('logged_at', { ascending: false });

    if (!error && data) {
      setEntries(data as any);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const groupEntriesByDate = (entries: FoodEntry[]) => {
    const grouped: { [key: string]: FoodEntry[] } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.logged_at).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });
    
    return grouped;
  };

  const calculateDayCalories = (dayEntries: FoodEntry[]) => {
    return dayEntries.reduce((total, entry) => {
      const calories = entry.food_item ? 
        (entry.food_item.calories_per_100g * entry.quantity) / 100 : 0;
      return total + calories;
    }, 0);
  };

  const groupedEntries = groupEntriesByDate(entries);
  const totalCalories = entries.reduce((total, entry) => {
    const calories = entry.food_item ? 
      (entry.food_item.calories_per_100g * entry.quantity) / 100 : 0;
    return total + calories;
  }, 0);

  const averageCalories = entries.length > 0 ? totalCalories / Object.keys(groupedEntries).length : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#059669', '#047857']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Nutrition History</Text>
            <Text style={styles.headerSubtitle}>Track your progress over time</Text>
          </View>
          <TrendingUp size={32} color="#FFFFFF" />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && styles.selectedPeriod
              ]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === 'week' && styles.selectedPeriodText
              ]}>
                Last 7 Days
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && styles.selectedPeriod
              ]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === 'month' && styles.selectedPeriodText
              ]}>
                Last 30 Days
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(totalCalories)}</Text>
              <Text style={styles.statLabel}>Total Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(averageCalories)}</Text>
              <Text style={styles.statLabel}>Daily Average</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
          </View>
        </Card>

        {Object.entries(groupedEntries).map(([date, dayEntries]) => (
          <Card key={date}>
            <View style={styles.dayHeader}>
              <View style={styles.dateContainer}>
                <Calendar size={16} color="#2563EB" />
                <Text style={styles.dateText}>
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              <Text style={styles.dayCalories}>
                {Math.round(calculateDayCalories(dayEntries))} cal
              </Text>
            </View>

            {dayEntries.map((entry) => (
              <View key={entry.id} style={styles.entryItem}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryName}>
                    {entry.food_item?.name || 'Unknown Food'}
                  </Text>
                  <Text style={styles.entryDetails}>
                    {entry.quantity}g • {entry.meal_type} • {' '}
                    {new Date(entry.logged_at).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                <View style={styles.entryNutrition}>
                  <Text style={styles.entryCalories}>
                    {entry.food_item ? Math.round((entry.food_item.calories_per_100g * entry.quantity) / 100) : 0} cal
                  </Text>
                  <Text style={styles.entryProtein}>
                    {entry.food_item ? Math.round((entry.food_item.protein_per_100g * entry.quantity) / 100) : 0}g protein
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        ))}

        {Object.keys(groupedEntries).length === 0 && !loading && (
          <Card>
            <View style={styles.emptyState}>
              <Filter size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No entries found</Text>
              <Text style={styles.emptyText}>
                Start logging your meals to see your nutrition history here.
              </Text>
            </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPeriod: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  selectedPeriodText: {
    color: '#2563EB',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  dayCalories: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#059669',
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  entryDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  entryNutrition: {
    alignItems: 'flex-end',
  },
  entryCalories: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  entryProtein: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});