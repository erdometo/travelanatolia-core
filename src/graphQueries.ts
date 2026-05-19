import { runQuery } from "./neo4j";

export interface ExperienceRecommendation {
  id: string;
  name: string;
  category: string;
  priceUSD: number;
  matchedInterests: string[];
  score: number;
}

export interface UserMatch {
  id: string;
  name: string;
  travelStyle: string;
  sharedInterests: string[];
  score: number;
}

/**
 * Recommends experiences based on a user's overlapping interests/tags in the Neo4j graph.
 */
export async function recommendExperiencesForUser(userId: string): Promise<ExperienceRecommendation[]> {
  const query = `
    MATCH (u:User {id: $userId})-[h:HAS_INTEREST]->(i:Interest)<-[t:HAS_TAG]-(e:Experience)
    RETURN e.id AS id, 
           e.name AS name, 
           e.category AS category, 
           toInteger(e.priceUSD) AS priceUSD,
           collect(i.name) AS matchedInterests, 
           count(i) AS score
    ORDER BY score DESC, priceUSD ASC
    LIMIT 5
  `;

  try {
    const result = await runQuery(query, { userId });
    return result.records.map((record) => ({
      id: record.get("id"),
      name: record.get("name"),
      category: record.get("category"),
      priceUSD: record.get("priceUSD"),
      matchedInterests: record.get("matchedInterests"),
      score: record.get("score").toNumber(),
    }));
  } catch (error) {
    console.error(`Error querying experience recommendations for user ${userId}:`, error);
    return [];
  }
}

/**
 * Finds other travelers who share similar interests in the Neo4j graph, enabling social matching.
 */
export async function findSimilarTravelers(userId: string): Promise<UserMatch[]> {
  const query = `
    MATCH (u1:User {id: $userId})-[h1:HAS_INTEREST]->(i:Interest)<-[h2:HAS_INTEREST]-(u2:User)
    WHERE u1 <> u2
    RETURN u2.id AS id, 
           u2.name AS name, 
           u2.travelStyle AS travelStyle,
           collect(i.name) AS sharedInterests, 
           count(i) AS score
    ORDER BY score DESC
    LIMIT 5
  `;

  try {
    const result = await runQuery(query, { userId });
    return result.records.map((record) => ({
      id: record.get("id"),
      name: record.get("name"),
      travelStyle: record.get("travelStyle"),
      sharedInterests: record.get("sharedInterests"),
      score: record.get("score").toNumber(),
    }));
  } catch (error) {
    console.error(`Error querying similar travelers for user ${userId}:`, error);
    return [];
  }
}
