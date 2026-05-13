import { supabase } from "@/lib/supabase";
import type { Business, BusinessFrontend, Review } from "@/types/database";

export const BUSINESS_CATEGORIES = [
  "Alimentação (Restaurantes, Padarias, Cafés)",
  "Serviços Automotivos",
  "Saúde & Beleza",
  "Construção & Reformas",
  "Advocacia & Consultoria",
  "Contabilidade & Finanças",
  "Educação & Idiomas",
  "Tecnologia & TI",
  "Comércio & Varejo",
  "Transporte & Mudanças",
  "Imobiliária",
  "Turismo & Viagens",
  "Outros",
] as const;

export const COUNTRIES: Record<string, { name: string; states: Record<string, string> }> = {
  ca: {
    name: "Canadá",
    states: {
      qc: "Quebec",
      on: "Ontário",
      bc: "Colúmbia Britânica",
      ab: "Alberta",
      mb: "Manitoba",
      sk: "Saskatchewan",
      ns: "Nova Escócia",
      nb: "Nova Brunswick",
      nl: "Terra Nova e Labrador",
      pe: "Ilha do Príncipe Eduardo",
      yt: "Yukon",
      nt: "Territórios do Noroeste",
      nu: "Nunavut",
    },
  },
  us: {
    name: "Estados Unidos",
    states: {
      al: "Alabama",
      ak: "Alasca",
      az: "Arizona",
      ar: "Arkansas",
      ca: "Califórnia",
      co: "Colorado",
      ct: "Connecticut",
      de: "Delaware",
      fl: "Flórida",
      ga: "Geórgia",
      hi: "Havaí",
      id: "Idaho",
      il: "Illinois",
      in: "Indiana",
      ia: "Iowa",
      ks: "Kansas",
      ky: "Kentucky",
      la: "Louisiana",
      me: "Maine",
      md: "Maryland",
      ma: "Massachusetts",
      mi: "Michigan",
      mn: "Minnesota",
      ms: "Mississippi",
      mo: "Missouri",
      mt: "Montana",
      ne: "Nebraska",
      nv: "Nevada",
      nh: "New Hampshire",
      nj: "Nova Jersey",
      nm: "Novo México",
      ny: "Nova York",
      nc: "Carolina do Norte",
      nd: "Dakota do Norte",
      oh: "Ohio",
      ok: "Oklahoma",
      or: "Oregon",
      pa: "Pensilvânia",
      ri: "Rhode Island",
      sc: "Carolina do Sul",
      sd: "Dakota do Sul",
      tn: "Tennessee",
      tx: "Texas",
      ut: "Utah",
      vt: "Vermont",
      va: "Virgínia",
      wv: "Virgínia Ocidental",
      wi: "Wisconsin",
      wy: "Wyoming",
    },
  },
  pt: {
    name: "Portugal",
    states: {
      li: "Lisboa",
      po: "Porto",
      br: "Braga",
      co: "Coimbra",
      av: "Aveiro",
      fa: "Faro",
      se: "Setúbal",
      le: "Leiria",
      ev: "Évora",
      be: "Beja",
      vi: "Viana do Castelo",
      vr: "Vila Real",
      brg: "Bragança",
      gu: "Guarda",
      ca: "Castelo Branco",
      pa: "Portalegre",
      sa: "Santarém",
      vb: "Viseu",
    },
  },
  gb: {
    name: "Reino Unido",
    states: {
      eng: "Inglaterra",
      sct: "Escócia",
      wls: "País de Gales",
      nir: "Irlanda do Norte",
    },
  },
  jp: {
    name: "Japão",
    states: {
      tk: "Tóquio",
      os: "Osaka",
      ky: "Quioto",
      hk: "Hokkaido",
      fk: "Fukuoka",
      ai: "Aichi",
      kn: "Kanagawa",
      st: "Saitama",
    },
  },
  au: {
    name: "Austrália",
    states: {
      nsw: "Nova Gales do Sul",
      vic: "Vitória",
      qld: "Queensland",
      wa: "Austrália Ocidental",
      sa: "Austrália do Sul",
      tas: "Tasmânia",
    },
  },
};

function toFrontend(b: Business, ownerName?: string): BusinessFrontend {
  return {
    id: b.id,
    ownerId: b.owner_id,
    ownerName: ownerName || "Proprietário",
    name: b.name,
    slug: b.slug,
    category: b.category,
    description: b.description,
    heroImage: b.hero_image || "",
    logoUrl: b.logo_url || "",
    address: {
      street: b.street || "",
      city: b.city || "",
      state: b.state || "",
      country: b.country || "",
      countryCode: b.country_code || "",
      stateCode: b.state_code || "",
      postalCode: b.postal_code || "",
      lat: b.lat,
      lng: b.lng,
    },
    services: b.services || [],
    menu: b.menu || [],
    photos: b.photos || [],
    phone: b.phone || "",
    email: b.email || "",
    website: b.website || "",
    instagram: b.instagram || undefined,
    facebook: b.facebook || undefined,
    whatsapp: b.whatsapp || undefined,
    reviews: b.reviews || [],
    averageRating: b.average_rating || 0,
    createdAt: b.created_at,
  };
}

export async function getAllBusinesses(): Promise<BusinessFrontend[]> {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (!data) return [];

  // Buscar nomes dos proprietários
  const ownerIds = [...new Set(data.map((b: Business) => b.owner_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", ownerIds);

  const ownerNames = new Map(
    (profiles || []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  return (data as Business[]).map((b) =>
    toFrontend(b, ownerNames.get(b.owner_id))
  );
}

export async function getBusinessBySlug(
  countryCode: string,
  stateCode: string,
  city: string,
  slug: string
): Promise<BusinessFrontend | null> {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("country_code", countryCode.toLowerCase())
    .eq("state_code", stateCode.toLowerCase())
    .ilike("city", city.toLowerCase())
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  const biz = data as Business;
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", biz.owner_id)
    .maybeSingle();

  return toFrontend(biz, profile?.name);
}

export async function getBusinessesByOwner(ownerId: string): Promise<BusinessFrontend[]> {
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!data) return [];
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", ownerId)
    .maybeSingle();
  return (data as Business[]).map((b) => toFrontend(b, profile?.name));
}

export async function createBusiness(
  ownerId: string,
  data: {
    name: string;
    slug: string;
    category: string;
    description: string;
    heroImage?: string;
    logoUrl?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    countryCode?: string;
    stateCode?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
    services?: string[];
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  }
): Promise<BusinessFrontend | null> {
  const { data: newBiz, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: ownerId,
      name: data.name,
      slug: data.slug,
      category: data.category,
      description: data.description,
      hero_image: data.heroImage || null,
      logo_url: data.logoUrl || null,
      street: data.street || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      country_code: data.countryCode || null,
      state_code: data.stateCode || null,
      postal_code: data.postalCode || null,
      lat: data.lat || 0,
      lng: data.lng || 0,
      services: data.services || [],
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      whatsapp: data.whatsapp || null,
    })
    .select()
    .maybeSingle();

  if (error || !newBiz) return null;
  return toFrontend(newBiz as Business);
}

export async function updateBusiness(
  id: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  // Mapear camelCase para snake_case (colunas do banco)
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    mapped[snakeKey] = value;
  }
  const { error } = await supabase
    .from("businesses")
    .update(mapped)
    .eq("id", id);
  if (error) {
    console.error("[updateBusiness] Supabase error code:", error.code, "message:", error.message, "details:", error.details, "hint:", error.hint);
  }
  return !error;
}

export async function deleteBusiness(id: string): Promise<boolean> {
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  return !error;
}

export async function addReview(
  businessId: string,
  review: Review
): Promise<boolean> {
  const { data: biz } = await supabase
    .from("businesses")
    .select("reviews, average_rating")
    .eq("id", businessId)
    .maybeSingle();

  if (!biz) return false;

  const reviews = (biz.reviews || []) as Review[];
  reviews.push(review);
  const avg =
    reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) /
    reviews.length;

  const { error } = await supabase
    .from("businesses")
    .update({ reviews, average_rating: Math.round(avg * 10) / 10 })
    .eq("id", businessId);

  return !error;
}

export async function updateReview(
  businessId: string,
  reviewId: string,
  updates: { rating?: 1 | 2 | 3 | 4 | 5; comment?: string }
): Promise<boolean> {
  const { data: biz } = await supabase
    .from("businesses")
    .select("reviews, average_rating")
    .eq("id", businessId)
    .maybeSingle();

  if (!biz) return false;

  const reviews = (biz.reviews || []) as Review[];
  const idx = reviews.findIndex((r: Review) => r.id === reviewId);
  if (idx === -1) return false;

  reviews[idx] = { ...reviews[idx], ...updates };
  const avg =
    reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) /
    reviews.length;

  const { error } = await supabase
    .from("businesses")
    .update({ reviews, average_rating: Math.round(avg * 10) / 10 })
    .eq("id", businessId);

  return !error;
}

export async function deleteReview(
  businessId: string,
  reviewId: string
): Promise<boolean> {
  const { data: biz } = await supabase
    .from("businesses")
    .select("reviews, average_rating")
    .eq("id", businessId)
    .maybeSingle();

  if (!biz) return false;

  const reviews = (biz.reviews || []) as Review[];
  const filtered = reviews.filter((r: Review) => r.id !== reviewId);
  const avg =
    filtered.length > 0
      ? filtered.reduce((sum: number, r: Review) => sum + r.rating, 0) /
        filtered.length
      : 0;

  const { error } = await supabase
    .from("businesses")
    .update({ reviews: filtered, average_rating: Math.round(avg * 10) / 10 })
    .eq("id", businessId);

  return !error;
}

export function buildBusinessUrl(biz: BusinessFrontend): string {
  return `/${biz.address.countryCode}/${biz.address.stateCode}/${encodeURIComponent(biz.address.city.toLowerCase())}/${biz.slug}`;
}

export function getCountryName(code: string): string {
  return COUNTRIES[code.toLowerCase()]?.name || code;
}

export function getStateName(countryCode: string, stateCode: string): string {
  return COUNTRIES[countryCode.toLowerCase()]?.states[stateCode.toLowerCase()] || stateCode;
}
