# NutriTrack Pro - B2B Calorie Tracking App

A professional mobile application for business nutrition management with AI-powered food recognition and comprehensive tracking capabilities.

## Features

### 🤖 AI-Powered Food Recognition
- **Gemini AI Integration**: Advanced food identification from photos
- **Smart Search**: Natural language food search with nutritional data
- **Personalized Insights**: AI-generated nutrition advice and recommendations

### 📱 Professional Mobile Experience
- **Cross-Platform**: Built with Expo for iOS, Android, and Web
- **Enterprise Design**: Clean, professional interface suitable for B2B use
- **Offline Capable**: Works without internet connection for basic features

### 🔐 Secure Authentication
- **Supabase Auth**: Enterprise-grade user authentication
- **Profile Management**: Company information and personal goals
- **Data Privacy**: Secure data handling for business environments

### 📊 Comprehensive Tracking
- **Daily Goals**: Customizable calorie, protein, carb, and fat targets
- **Progress Visualization**: Real-time progress bars and statistics
- **Meal Categorization**: Breakfast, lunch, dinner, and snack tracking
- **Photo Logging**: Visual meal history with timestamps

### 📈 Analytics & Insights
- **Historical Data**: 7-day and 30-day nutrition trends
- **AI Recommendations**: Personalized meal suggestions and nutrition advice
- **Health Metrics**: BMR calculations and macro distribution analysis

## Technology Stack

- **Frontend**: React Native with Expo
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **AI/ML**: Google Gemini API
- **Camera**: Expo Camera
- **Icons**: Lucide React Native
- **Fonts**: Inter (Google Fonts)

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI Configuration
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the following SQL to create the required tables:

```sql
-- Users table (handled by Supabase Auth)

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
```

### 3. Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env` file

### 4. Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## API Integration Details

### Gemini AI Features

1. **Food Recognition**: Analyzes food photos and returns nutritional data
2. **Smart Search**: Natural language food search with comprehensive results
3. **Nutrition Advice**: Personalized recommendations based on user data

### Free Service Limits

- **Supabase**: 500MB database, 50MB file storage, 2GB bandwidth
- **Gemini API**: 15 requests per minute, 1500 requests per day (free tier)
- **Expo**: Unlimited development, free hosting for personal projects

## Business Features

### Enterprise Ready
- Professional UI/UX design
- Company profile integration
- Scalable architecture
- Data export capabilities

### B2B Use Cases
- Corporate wellness programs
- Employee health tracking
- Nutrition consulting services
- Healthcare provider tools

## Development Notes

### Architecture
- Modular component structure
- Type-safe database operations
- Offline-first data handling
- Professional error handling

### Performance
- Optimized image processing
- Efficient API calls with caching
- Smooth animations and transitions
- Responsive design for all devices

## Support

For technical support or business inquiries, please contact the development team.

---

Built with ❤️ for professional nutrition management