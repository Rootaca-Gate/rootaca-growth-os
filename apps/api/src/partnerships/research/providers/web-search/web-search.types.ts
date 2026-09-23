export type SerperOrganicItem = {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
};

export type SerperSearchResponse = {
  organic?: SerperOrganicItem[];
};

export type BraveWebResult = {
  title?: string;
  url?: string;
  description?: string;
};

export type BraveSearchResponse = {
  web?: {
    results?: BraveWebResult[];
  };
};

export type RawSearchHit = {
  title: string;
  url: string;
  snippet?: string;
  rank?: number;
};
