export type Card = {
  id: string;           // frontend UUID for rendering
  backendId?: number;   // backend DB ID (undefined for unsaved cards)
  src: string;
  name: string;
};

export type Tier = {
  id: string;           // frontend UUID
  backendId?: number;   // backend DB ID
  label: string;
  color: string;
  items: Card[];
  isUnsorted: boolean;
};
