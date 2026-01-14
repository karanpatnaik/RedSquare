export type Post = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  location: string | null;
  event_date: string | null;
  created_at: string | null;
  user_id: string;
  club_id: string | null;
  rsvp_count: number | null;
  reaction_count: number | null;
};

export type SortOption = 'recent' | 'popular' | 'ending_soon' | 'chronological';
