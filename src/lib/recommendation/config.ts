export interface RankerWeights {
  version: string;
  relationship: number;
  locality: number;
  interest: number;
  freshness: number;
  engagement: number;
  consumption: number;
  quality: number;
  exploration: number;
}

export const FEED_V1_CONFIG: RankerWeights = {
  version: "feed_v1",
  relationship: 0.24,
  locality: 0.18,
  interest: 0.16,
  freshness: 0.12,
  engagement: 0.1,
  consumption: 0.08,
  quality: 0.06,
  exploration: 0.06,
};
