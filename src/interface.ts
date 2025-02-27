export interface Post {
  rest_id: string;
  author: Author;
  created_at: string;
  content: Content;
  media?: Array<Media>;
  quote?: Post;
  key_words?: Array<string>;
  replies?: Array<Conversation>;
  card?: Card;
  article?: Article;
}

export interface Author {
  name: string;
  screen_name: string;
  avatar: Avatar;
}

export interface Avatar {
  path: string;
  url: string;
}

export interface Content {
  lang: string;
  text: string;
  translation?: string;
}

interface BaseMedia {
  id: string;
  url: string;
  path: string;
  description?: string;
}

export interface PhotoMedia extends BaseMedia {
  type: "photo";
}

export interface VideoMedia extends BaseMedia {
  type: "video";
  aspect_ratio: [number, number];
  thumb: string;
  thumb_path: string;
  duration_millis: number;
  bitrate?: number;
}

export interface AnimatedGifMedia extends BaseMedia {
  type: "animated_gif";
  aspect_ratio: [number, number];
  thumb: string;
  thumb_path: string;
  bitrate?: number;
}

export type Media = PhotoMedia | VideoMedia | AnimatedGifMedia;

export interface Conversation {
  conversation: Array<Post>;
}

export interface Card {
  url: string;
  title?: string;
  description?: string;
}

export interface Article {
  id: string;
  url: string;
  title: string;
  description?: string;
}
