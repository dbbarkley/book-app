import { Forum, ForumPost, ForumComment, User } from '@/shared/types';

export const mockUser: User = {
  id: 1,
  username: 'bookworm_jane',
  display_name: 'Jane Doe',
  avatar_url: 'https://i.pravatar.cc/150?u=jane',
};

export const mockForums: Forum[] = [
  {
    id: 1,
    slug: 'classic-literature',
    title: 'Classic Literature',
    description: 'A place to discuss the timeless classics from Homer to Hemingway.',
    visibility: 'public_access',
    followers_count: 1250,
    posts_count: 450,
    is_following: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    slug: 'sci-fi-enthusiasts',
    title: 'Sci-Fi Enthusiasts',
    description: 'Exploring the frontiers of the imagination through science fiction.',
    visibility: 'public_access',
    followers_count: 890,
    posts_count: 210,
    is_following: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockPosts: ForumPost[] = [
  {
    id: 101,
    forum_id: 1,
    user_id: 1,
    user: mockUser,
    body: 'Just finished reading Moby Dick. The technical descriptions of whaling were surprisingly immersive, but the pacing felt a bit uneven in the middle. What do you all think?',
    reply_count: 3,
    heart_count: 12,
    is_hearted: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 102,
    forum_id: 1,
    user_id: 2,
    user: {
      id: 2,
      username: 'literature_lover',
      display_name: 'Alex Smith',
      avatar_url: 'https://i.pravatar.cc/150?u=alex',
    },
    body: 'Anyone have recommendations for 19th-century French literature? I loved Les Misérables and want to dive deeper.',
    reply_count: 0,
    heart_count: 5,
    is_hearted: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

export const mockComments: Record<number, ForumComment[]> = {
  101: [
    {
      id: 201,
      forum_post_id: 101,
      user_id: 3,
      user: {
        id: 3,
        username: 'melville_fan',
        display_name: 'Ishmael',
        avatar_url: 'https://i.pravatar.cc/150?u=ishmael',
      },
      body: 'I actually loved the whaling details! It grounds the allegory in something very physical and real.',
      heart_count: 4,
      reply_count: 0,
      is_hearted: false,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 202,
      forum_post_id: 101,
      user_id: 4,
      user: {
        id: 4,
        username: 'fast_reader',
        display_name: 'Quick Study',
        avatar_url: 'https://i.pravatar.cc/150?u=quick',
      },
      body: 'The middle section is definitely a slog, but the ending makes it all worth it. Stick with it!',
      heart_count: 2,
      reply_count: 0,
      is_hearted: true,
      created_at: new Date(Date.now() - 900000).toISOString(),
      updated_at: new Date(Date.now() - 900000).toISOString(),
    },
  ],
};

