// types/post.ts
// Make sure your Post type includes the visibility field

export type SortOption = "recent" | "popular" | "chronological";

export type Post = {
  id: string;
  user_id: string;
  club_id: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  location: string | null;
  event_date: string | null;
  is_active: boolean;
  created_at: string;
  visibility: "public" | "private" | null;  // <-- Make sure this field exists
  rsvp_count?: number;
  reaction_count?: number;
};
