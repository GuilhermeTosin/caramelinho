// Tipos TypeScript compatíveis com o schema Supabase do Caramelinho

export interface Profile {
  id: string;
  name: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar: string | null;
  created_at: string;
}

export interface MenuItem {
  name: string;
  price: string;
  description: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  hero_image: string | null;
  logo_url: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  country_code: string | null;
  state_code: string | null;
  postal_code: string | null;
  lat: number;
  lng: number;
  services: string[];
  menu: MenuItem[];
  photos: string[];
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  reviews: Review[];
  average_rating: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string | null;
  business_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  read: boolean;
}

// Tipos auxiliares para o frontend (camelCase)
export interface BusinessFrontend {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  heroImage: string;
  logoUrl: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    countryCode: string;
    stateCode: string;
    postalCode: string;
    lat: number;
    lng: number;
  };
  services: string[];
  menu: MenuItem[];
  photos: string[];
  phone: string;
  email: string;
  website: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  reviews: Review[];
  averageRating: number;
  createdAt: string;
}

export interface ConversationFrontend {
  id: string;
  participants: string[];
  businessId?: string;
  businessName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface MessageFrontend {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface UserFrontend {
  id: string;
  email: string;
  name: string;
  bio: string;
  phone: string;
  location: string;
  avatar: string;
  createdAt: string;
}

export interface AuthSessionFrontend {
  userId: string;
  email: string;
  name: string;
}
