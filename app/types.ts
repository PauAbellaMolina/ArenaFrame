export interface ArenaUser {
  created_at: string; // ISO timestamp
  slug: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string;
  avatar_image: {
    thumb: string;
    display: string;
  };
  channel_count: number;
  following_count: number;
  profile_id: number;
  follower_count: number;
  initials: string;
  can_index: boolean;
  metadata: {
    description: string | null;
  };
  is_premium: boolean;
  is_lifetime_premium: boolean;
  is_supporter: boolean;
  is_exceeding_connections_limit: boolean;
  is_confirmed: boolean;
  is_pending_reconfirmation: boolean;
  is_pending_confirmation: boolean;
  badge: string | null;
  id: number;
  base_class: "User";
  class: "User";
}

export interface ArenaChannel {
  id: number;
  title: string;
  slug: string;
  length?: number;
}

export interface ArenaChannelContent {
  id: number;
  title: string;
  updated_at: string;
  created_at: string;
  state: string;
  comment_count: number;
  generated_title: string;
  content_html: string;
  description_html: string;
  visibility: string;
  content: string;
  description: string;
  source: {
    url: string;
    title: string;
    provider: {
      name: string;
      url: string;
    };
  } | null;
  image: {
    filename: string;
    content_type: string;
    updated_at: string;
    thumb: {
      url: string;
    };
    square: {
      url: string;
    };
    display: {
      url: string;
    };
    large: {
      url: string;
    };
    original: {
      url: string;
      file_size: number;
      file_size_display: string;
    };
  } | null;
  embed: unknown;
  attachment: unknown;
  metadata: Record<string, unknown>;
  base_class: string;
  class: string;
  user: {
    created_at: string;
    slug: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar: string;
    avatar_image: {
      thumb: string;
      display: string;
    };
    channel_count: number;
    following_count: number;
    profile_id: number;
    follower_count: number;
    initials: string;
    can_index: boolean;
    metadata: {
      description: string | null;
    };
    is_premium: boolean;
    is_lifetime_premium: boolean;
    is_supporter: boolean;
    is_exceeding_connections_limit: boolean;
    is_confirmed: boolean;
    is_pending_reconfirmation: boolean;
    is_pending_confirmation: boolean;
    badge: string | null;
    id: number;
    base_class: string;
    class: string;
  };
  position: number;
  selected: boolean;
  connection_id: number;
  connected_at: string;
  connected_by_user_id: number;
  connected_by_username: string;
  connected_by_user_slug: string;
}