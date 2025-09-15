# Development Guide

This guide provides comprehensive information for developers working on StudySphere, including setup instructions, development workflows, and best practices.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 18.0 or higher
- **npm**: Latest stable version
- **Git**: For version control
- **Supabase Account**: For backend services
- **Android Studio**: For mobile development (optional)
- **VS Code**: Recommended IDE with extensions

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/studysphere.git
   cd studysphere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env.local` in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_GEMINI_API_KEY=your-gemini-key
   ```

4. **Supabase Setup**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link to your project
   supabase link --project-ref your-project-ref

   # Start local Supabase (optional)
   supabase start
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/ui base components
│   ├── home/            # Home page components
│   ├── chat/            # Chat interface components
│   ├── video/           # Video conferencing components
│   └── profile/         # Profile page components
├── pages/               # Route-based page components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and external integrations
├── types/               # TypeScript type definitions
├── integrations/        # External service configurations
└── styles/              # Global styles and themes

supabase/
├── functions/           # Edge functions
├── migrations/          # Database schema migrations
└── config.toml         # Supabase configuration

android/                 # Android app files
public/                  # Static assets
```

## 🛠️ Development Tools

### Essential VS Code Extensions
- **TypeScript and JavaScript Language Features**
- **ESLint**
- **Prettier**
- **Tailwind CSS IntelliSense**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**
- **GitLens**
- **Supabase**

### Recommended Extensions
- **React Extension Pack**
- **GraphQL** (if using GraphQL)
- **Docker** (for containerized development)
- **Thunder Client** (for API testing)

## 🔧 Development Workflow

### 1. Branching Strategy
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bug fix branch
git checkout -b bugfix/issue-description

# Create hotfix branch
git checkout -b hotfix/critical-fix
```

### 2. Development Process
1. **Pick an issue** from the project board
2. **Create a branch** for your work
3. **Write tests** for new functionality
4. **Implement the feature**
5. **Test thoroughly**
6. **Commit with clear messages**
7. **Create a pull request**

### 3. Commit Guidelines
```bash
# Format: type(scope): description
git commit -m "feat: add user authentication"
git commit -m "fix: resolve chat message rendering bug"
git commit -m "docs: update API documentation"
git commit -m "style: format code with Prettier"
git commit -m "refactor: optimize database queries"
git commit -m "test: add unit tests for user service"
```

## 🧪 Testing

### Unit Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Best Practices
- Write tests for all new features
- Test edge cases and error conditions
- Use descriptive test names
- Mock external dependencies
- Maintain high test coverage (>80%)

### Manual Testing Checklist
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Cross-browser compatibility
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Performance (Lighthouse score >90)
- [ ] Error handling and edge cases

## 🎨 Code Style and Standards

### TypeScript Guidelines
- Use strict type checking
- Avoid `any` type (use `unknown` if necessary)
- Define interfaces for complex objects
- Use union types for related values
- Leverage utility types (`Partial`, `Pick`, `Omit`)

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Optimize re-renders with `React.memo`
- Use custom hooks for shared logic
- Follow component composition patterns

### Naming Conventions
```typescript
// Components: PascalCase
const UserProfile = () => { ... }

// Hooks: camelCase with 'use' prefix
const useAuth = () => { ... }

// Types: PascalCase with descriptive names
interface UserProfileData { ... }

// Files: kebab-case for components, camelCase for utilities
// user-profile.tsx, apiClient.ts
```

### CSS and Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use CSS custom properties for themes
- Implement consistent spacing scale
- Optimize for dark/light mode

## 🔄 State Management

### Local State
- Use `useState` for simple component state
- Use `useReducer` for complex state logic
- Leverage `useContext` for theme/global state

### Server State
- Use React Query for server state management
- Implement proper loading and error states
- Cache data appropriately
- Handle optimistic updates

### Global State
```typescript
// Context pattern for theme
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook for auth state
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## 🔗 API Integration

### Supabase Integration
```typescript
// Client setup
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Query pattern
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

### Error Handling
```typescript
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API errors
  } else {
    // Handle unexpected errors
  }
}
```

## 📱 Mobile Development

### Capacitor Setup
```bash
# Add platforms
npx cap add android
npx cap add ios

# Sync changes
npx cap sync

# Open in native IDE
npx cap open android
```

### Mobile-Specific Considerations
- Test on physical devices
- Handle offline scenarios
- Optimize for touch interactions
- Implement proper navigation patterns
- Consider platform-specific features

## 🚀 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Use dynamic imports for routes
- **Image Optimization**: Compress and lazy load images
- **Bundle Analysis**: Monitor bundle size with `npm run build`
- **Caching**: Implement service worker for offline support

### Database Optimization
- **Indexes**: Create appropriate database indexes
- **Query Optimization**: Use efficient queries
- **Pagination**: Implement cursor-based pagination
- **Caching**: Cache frequently accessed data

### Monitoring
```typescript
// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 🔒 Security Best Practices

### Authentication
- Never store sensitive data in localStorage
- Use HTTP-only cookies for tokens
- Implement proper session management
- Validate all user inputs

### API Security
- Implement rate limiting
- Use HTTPS everywhere
- Validate and sanitize inputs
- Implement proper CORS policies

### Data Protection
- Encrypt sensitive data at rest
- Use Row Level Security (RLS)
- Implement proper access controls
- Regular security audits

## 🐛 Debugging

### Browser DevTools
- Use React DevTools for component inspection
- Monitor network requests
- Check console for errors
- Use performance tab for optimization

### Common Debugging Techniques
```typescript
// Debug logging
console.log('Debug info:', { user, state, props });

// React DevTools
// - Component tree inspection
// - Props and state viewing
// - Performance profiling

// Network debugging
// - Check API responses
// - Monitor request timing
// - Verify authentication headers
```

## 📚 Learning Resources

### Recommended Reading
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Useful Tools
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vite Dev Server](https://vitejs.dev)

## 🤝 Contributing Guidelines

### Code Review Process
1. **Self-review** your code before requesting review
2. **Write clear PR descriptions** with context and testing instructions
3. **Address review comments** promptly
4. **Test thoroughly** before merging

### Pull Request Template
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Cross-browser testing done

## Screenshots
Add screenshots if UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes
```

## 📞 Support

### Getting Help
- **Documentation**: Check this guide first
- **Issues**: Create GitHub issues for bugs/features
- **Discussions**: Use GitHub discussions for questions
- **Slack/Teams**: Internal team communication

### Escalation
1. Check existing documentation
2. Search GitHub issues
3. Ask in team chat
4. Contact team lead if needed

---

**Happy coding! 🚀**
