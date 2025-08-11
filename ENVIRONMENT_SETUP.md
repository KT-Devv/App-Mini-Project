# Environment Setup

## Required Environment Variables

To use the Supabase authentication features (including password reset), you need to set up the following environment variables:

### 1. Create a `.env` file in the root directory

```bash
# .env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### 2. Get your Supabase credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key

### 3. Configure Supabase Auth Settings

In your Supabase project:

1. Go to **Authentication** → **Settings**
2. Under **URL Configuration**, add your redirect URLs:
   - `http://localhost:8080/reset-password` (for development)
   - `https://yourdomain.com/reset-password` (for production)
3. Save the changes

### 4. Restart your development server

After creating the `.env` file, restart your development server:

```bash
npm run dev
```

## Security Notes

- **Never commit your `.env` file to version control**
- The `.env` file should already be in your `.gitignore`
- Keep your Supabase keys secure and don't share them publicly

## Troubleshooting

If you encounter authentication issues:

1. Check that your environment variables are correctly set
2. Verify your Supabase project is active and accessible
3. Ensure your redirect URLs are properly configured in Supabase
4. Check the browser console for any error messages
