import { FEED_V1_CONFIG, type RankerWeights } from "./config";

export interface CandidateNote {
  id: string;
  user_id: string;
  content?: string;
  type?: string;
  note_kind?: string;
  created_at: string;
  location?: string;
  profiles?: {
    id: string;
    username?: string;
    display_name?: string;
    location?: string;
  };
  reaction_count?: number;
  comment_count?: number;
  score?: number;
}

export interface UserContext {
  userId?: string;
  location?: string;
  followedUserIds?: string[];
  mutedUserIds?: string[];
  blockedUserIds?: string[];
}

export class DeterministicFeedRanker {
  private weights: RankerWeights;

  constructor(weights: RankerWeights = FEED_V1_CONFIG) {
    this.weights = weights;
  }

  /**
   * Ranks candidates using candidate generation, eligibility filtering, signal scoring, and diversity pass
   */
  public rankFeed(candidates: CandidateNote[], context: UserContext): CandidateNote[] {
    if (!candidates || candidates.length === 0) return [];

    // 1. Eligibility & Privacy Filter
    const eligible = candidates.filter((item) => {
      if (context.blockedUserIds?.includes(item.user_id)) return false;
      if (context.mutedUserIds?.includes(item.user_id)) return false;
      return true;
    });

    // 2. Signal Extraction & Scoring
    const scored = eligible.map((item) => {
      const score = this.calculateScore(item, context);
      return { ...item, score };
    });

    // 3. Sort by Score Descending
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));

    // 4. Diversity Reranking Pass (Max 2 posts from same creator per 10 items)
    return this.applyDiversityPass(scored);
  }

  private calculateScore(item: CandidateNote, context: UserContext): number {
    const now = Date.now();
    const createdAt = new Date(item.created_at).getTime();
    const ageHours = Math.max(0, (now - createdAt) / (1000 * 60 * 60));

    // Relationship Score (1.0 if followed, 0.2 baseline)
    const isFollowed = context.followedUserIds?.includes(item.user_id);
    const relScore = isFollowed ? 1.0 : 0.2;

    // Locality Score (1.0 if Windhoek/same location, 0.5 Namibia baseline)
    const creatorLoc = item.profiles?.location || item.location || "Windhoek";
    const locScore =
      context.location && creatorLoc.toLowerCase().includes(context.location.toLowerCase())
        ? 1.0
        : 0.6;

    // Freshness Score (Exponential Decay)
    const freshScore = Math.exp(-0.05 * ageHours);

    // Engagement Score
    const engagements = (item.reaction_count || 0) + (item.comment_count || 0) * 2;
    const engScore = Math.min(1.0, engagements / 20);

    // Final Weighted Sum
    const finalScore =
      this.weights.relationship * relScore +
      this.weights.locality * locScore +
      this.weights.freshness * freshScore +
      this.weights.engagement * engScore +
      this.weights.exploration * 0.5;

    return Number(finalScore.toFixed(4));
  }

  private applyDiversityPass(items: CandidateNote[]): CandidateNote[] {
    const result: CandidateNote[] = [];
    const creatorCounts: Record<string, number> = {};

    for (const item of items) {
      const count = creatorCounts[item.user_id] || 0;
      if (count < 2) {
        result.push(item);
        creatorCounts[item.user_id] = count + 1;
      }
    }

    return result;
  }
}

export const FeedRanker = new DeterministicFeedRanker();
