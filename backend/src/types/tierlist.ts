export interface CreateTierItemInput {
  name: string;
  imageUrl: string;
  order?: number;
}

export interface CreateTierInput {
  name: string;
  color: string;
  order?: number;
  items: CreateTierItemInput[];
}

export interface CreateTierListInput {
  title: string;
  description?: string | null;
  visibility?: "PRIVATE" | "PUBLIC";
  tiers: CreateTierInput[];
}
