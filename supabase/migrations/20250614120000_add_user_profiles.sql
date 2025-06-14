
-- Create user profiles table
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Allow users to read all profiles (for tagging and display)
create policy "Users can view all profiles" on public.user_profiles
  for select using (true);

-- Allow users to insert/update their own profile
create policy "Users can insert their own profile" on public.user_profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.user_profiles
  for update using (auth.uid() = id);

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add user profile info to chat messages view
create or replace view public.chat_messages_with_profiles as
select 
  cm.*,
  up.username,
  up.display_name,
  up.avatar_url
from public.chat_messages cm
left join public.user_profiles up on cm.user_id = up.id;

-- Grant access to the view
grant select on public.chat_messages_with_profiles to authenticated;
