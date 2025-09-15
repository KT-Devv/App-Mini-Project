# Deployment Guide

This guide covers the deployment process for StudySphere across different environments and platforms.

## Prerequisites

Before deploying, ensure you have:

- Supabase project set up and configured
- Environment variables prepared
- Build artifacts ready
- Domain name (optional)

## Environment Variables

Create the following environment variables for your deployment:

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
```

### Supabase Environment
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

## Deployment Options

### 1. Vercel (Recommended for Frontend)

#### Automatic Deployment
1. Connect your GitHub repository to Vercel
2. Configure build settings:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install"
   }
   ```
3. Add environment variables in Vercel dashboard
4. Deploy automatically on git push

#### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Netlify

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

### 3. GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts
"scripts": {
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

### 4. Self-Hosted

```bash
# Build the application
npm run build

# Serve with any static server
npx serve dist
# or
python -m http.server 8080 -d dist
```

## Mobile App Deployment

### Android

#### Google Play Store
1. Build release APK:
   ```bash
   npx cap build android --prod
   ```
2. Open in Android Studio
3. Generate signed APK/bundle
4. Upload to Google Play Console

#### Alternative Distribution
- Firebase App Distribution
- Direct APK sharing
- Third-party app stores

### iOS (Future Support)
1. Configure Capacitor for iOS
2. Build in Xcode
3. Submit to App Store Connect

## Supabase Deployment

### Database
```bash
# Link to remote project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Deploy edge functions
supabase functions deploy
```

### Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] SSL certificate configured
- [ ] Domain DNS configured
- [ ] File storage bucket configured
- [ ] Authentication providers set up
- [ ] Real-time subscriptions enabled
- [ ] Row Level Security policies active
- [ ] Performance monitoring set up
- [ ] Error tracking configured
- [ ] Backup strategy in place

## Performance Optimization

### Frontend
- Enable gzip compression
- Set up CDN for static assets
- Implement code splitting
- Optimize images and assets
- Enable browser caching

### Database
- Set up connection pooling
- Configure database indexes
- Enable query caching
- Monitor slow queries
- Set up database backups

### Monitoring
- Set up error tracking (Sentry, LogRocket)
- Configure performance monitoring
- Set up uptime monitoring
- Monitor database performance
- Track user analytics

## Security Considerations

### Authentication
- Enable Row Level Security (RLS)
- Configure authentication providers
- Set up password policies
- Enable MFA if required

### API Security
- Validate all inputs
- Implement rate limiting
- Use HTTPS everywhere
- Secure API keys
- Implement CORS policies

### File Storage
- Set up file upload restrictions
- Configure storage bucket policies
- Enable file scanning
- Implement access controls

## Backup and Recovery

### Database Backups
```bash
# Manual backup
supabase db dump > backup.sql

# Restore from backup
supabase db reset
supabase db push
```

### File Backups
- Configure automatic backups in Supabase dashboard
- Set up cross-region replication
- Implement backup retention policies

## Scaling

### Vertical Scaling
- Upgrade Supabase plan as needed
- Increase database instance size
- Add more edge function instances

### Horizontal Scaling
- Implement load balancing
- Set up database read replicas
- Use CDN for global distribution

## Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version compatibility
- Verify environment variables
- Clear build cache: `npm run clean`

#### Database Connection Issues
- Verify Supabase URL and keys
- Check network connectivity
- Confirm RLS policies

#### File Upload Issues
- Check storage bucket configuration
- Verify file size limits
- Confirm upload permissions

#### Performance Issues
- Monitor database query performance
- Check for memory leaks
- Optimize bundle size
- Implement caching strategies

## Rollback Strategy

1. Keep previous deployment versions
2. Use feature flags for gradual rollouts
3. Have database backup ready
4. Monitor error rates post-deployment
5. Prepare rollback commands

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor security vulnerabilities
- Review and optimize database queries
- Clean up old files and data
- Update SSL certificates

### Emergency Procedures
- Have emergency contacts documented
- Prepare incident response plan
- Set up monitoring alerts
- Document escalation procedures

## Support

For deployment issues:
- Check Supabase documentation
- Review Vercel/Netlify documentation
- Consult deployment logs
- Contact support teams

---

**Last updated:** [8/10/2025]
**Version:** 1.0.0
