export interface PrimaryOutfit {
  title: string;
  top: string;
  bottom: string;
  footwear: string;
  accessories: string[];
  reasoning: string;
}

export interface AdditionalSuggestion {
  label: string;
  outfit_summary: string;
}

export interface StylistResponse {
  primary_outfit: PrimaryOutfit;
  additional_suggestions: AdditionalSuggestion[];
  styling_notes: string;
}

export interface StylistError {
  message: string;
}