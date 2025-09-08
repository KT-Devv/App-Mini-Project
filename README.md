# StudySphere 📚

A comprehensive study collaboration platform that brings students together for interactive learning experiences. StudySphere combines real-time chat, study sessions, AI assistance, file sharing, and video conferencing to create an immersive educational environment.

## 🌟 Features

### Core Functionality
- **Real-time Chat Rooms** - Create and join study groups with instant messaging
- **Study Sessions** - Schedule and participate in collaborative study sessions
- **AI Assistant** - Get help with questions using integrated AI powered by Gemini
- **File Sharing** - Share documents, notes, and resources with your study groups
- **Video Conferencing** - Connect face-to-face with video calls during study sessions
- **Resource Hub** - Access shared study materials and educational content
- **Friends System** - Connect with fellow students and build your study network
- **Notifications** - Stay updated with real-time notifications for messages and activities

### User Experience
- **Responsive Design** - Optimized for desktop and mobile devices
- **Dark/Light Theme** - Customizable interface with theme switching
- **Mobile App** - Native Android app built with Capacitor
- **Intuitive Navigation** - Easy-to-use interface with mobile-friendly navigation
- **Personal Dashboard** - Overview of your study activities and statistics

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful and accessible UI components
- **Radix UI** - Unstyled, accessible UI primitives
- **React Router** - Client-side routing
- **React Query** - Powerful data synchronization for React

### Backend & Database
- **Supabase** - Open source Firebase alternative
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - File storage
  - Edge functions

### Mobile
- **Capacitor** - Native mobile app development
- **Android Studio** - Android app development

### AI Integration
- **Gemini API** - AI-powered assistant for educational support
- **Transformers.js** - Client-side machine learning

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Vitest** - Unit testing
- **PostCSS** - CSS processing

## 🏗️ Architecture

```
StudySphere/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn/ui components
│   │   ├── home/           # Home page components
│   │   ├── chat/           # Chat interface components
│   │   └── video/          # Video conferencing components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and API clients
│   ├── types/              # TypeScript type definitions
│   └── integrations/       # External service integrations
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── android/                # Android app files
└── public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Android Studio (for mobile development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/studysphere.git
   cd studysphere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
   ```

4. **Database Setup**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your Supabase project
   supabase link --project-ref your-project-ref

   # Push database migrations
   supabase db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

### Mobile Development

1. **Android Setup**
   ```bash
   # Add Android platform
   npx cap add android

   # Sync changes
   npx cap sync android

   # Open in Android Studio
   npx cap open android
   ```

## 📱 Usage

### For Students
1. **Sign Up/Login** - Create your account or sign in
2. **Join Study Groups** - Browse and join chat rooms or create your own
3. **Participate in Sessions** - Join scheduled study sessions
4. **Share Resources** - Upload and share study materials
5. **Use AI Assistant** - Get help with questions and explanations
6. **Connect with Friends** - Add friends and collaborate

### For Developers
- **Component Development** - Use the established component patterns
- **API Integration** - Follow the Supabase integration patterns
- **State Management** - Use React Query for server state
- **Styling** - Follow Tailwind CSS and Shadcn/ui conventions

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Code Quality
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting with React and TypeScript rules
- **Prettier** - Code formatting (via ESLint)

### Database Development
```bash
# Create new migration
supabase migration new migration_name

# Generate types from database
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- **profiles** - User profiles and authentication
- **chat_rooms** - Study group chat rooms
- **chat_messages** - Messages within chat rooms
- **study_sessions** - Scheduled study sessions
- **session_participants** - Users participating in sessions
- **resources** - Shared study materials
- **personal_files** - User's private files
- **friends** - Friend relationships
- **notifications** - User notifications

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed schema documentation.

## 🔐 Authentication

StudySphere uses Supabase Authentication with:
- Email/password authentication
- Social login options
- Row Level Security (RLS) policies
- JWT tokens for API access

## 🎨 UI/UX Design

- **Design System** - Consistent design using Shadcn/ui components
- **Accessibility** - WCAG compliant components
- **Responsive** - Mobile-first responsive design
- **Themes** - Light and dark mode support
- **Animations** - Smooth transitions and micro-interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use functional components with hooks
- Follow the established file structure
- Write meaningful commit messages
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - For the amazing backend-as-a-service platform
- **Gemini** - For AI model hosting and API
- **Shadcn/ui** - For beautiful and accessible UI components
- **Radix UI** - For unstyled, accessible UI primitives
- **Tailwind CSS** - For utility-first CSS framework

## 📞 Support

For support, email support@studysphere.com or join our Discord community.

---

**Made with ❤️ for students, by students**
