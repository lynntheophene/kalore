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
2. Set up the database schema by running the SQL files in the `database/` directory:
   - Copy and paste the contents of `database/schema.sql` into your Supabase SQL Editor and run it
   - Optionally, run `database/sample_data.sql` to add sample food items for development

For detailed instructions, see the [Database Setup Guide](./database/README.md).

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