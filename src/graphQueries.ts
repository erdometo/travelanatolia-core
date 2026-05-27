import { runQuery } from "./neo4j";
import { firestoreMock } from "./firestoreMock";

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
 * Falls back to file-backed Firestore Mock tag matching if Neo4j is offline.
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
    
    try {
      console.log(`⚠️ Neo4j offline. Falling back to local file-backed recommendations for user ${userId}...`);
      const profile = await firestoreMock.profiles.get(userId);
      if (!profile || !profile.interests || profile.interests.length === 0) {
        return [];
      }
      const userInterests = profile.interests.map(i => i.toLowerCase().trim());
      const experiences = await firestoreMock.experiences.list();
      
      const scoredRecs: ExperienceRecommendation[] = [];
      for (const e of experiences) {
        const matchedTags = e.tags.filter(t => userInterests.includes(t.toLowerCase().trim()));
        if (matchedTags.length > 0) {
          scoredRecs.push({
            id: e.id,
            name: e.name,
            category: e.category,
            priceUSD: e.priceUSD,
            matchedInterests: matchedTags,
            score: matchedTags.length,
          });
        }
      }
      
      // Sort by score desc, priceUSD asc
      scoredRecs.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.priceUSD - b.priceUSD;
      });
      
      return scoredRecs.slice(0, 5);
    } catch (fallbackError) {
      console.error("Critical: Failed to generate fallback experience recommendations:", fallbackError);
      return [];
    }
  }
}

/**
 * Finds other travelers who share similar interests in the Neo4j graph, enabling social matching.
 * Falls back to file-backed Firestore Mock interest matching if Neo4j is offline.
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

    try {
      console.log(`⚠️ Neo4j offline. Falling back to local file-backed social matching for user ${userId}...`);
      const userProfile = await firestoreMock.profiles.get(userId);
      if (!userProfile || !userProfile.interests || userProfile.interests.length === 0) {
        return [];
      }
      const userInterests = userProfile.interests.map(i => i.toLowerCase().trim());
      const allProfiles = await firestoreMock.profiles.list();
      
      const scoredUsers: UserMatch[] = [];
      for (const other of allProfiles) {
        if (other.userId === userId) continue;
        
        const sharedTags = other.interests.filter(t => userInterests.includes(t.toLowerCase().trim()));
        if (sharedTags.length > 0) {
          scoredUsers.push({
            id: other.userId,
            name: other.fullName,
            travelStyle: other.travelStyle,
            sharedInterests: sharedTags,
            score: sharedTags.length,
          });
        }
      }
      
      // Sort by score desc
      scoredUsers.sort((a, b) => b.score - a.score);
      
      return scoredUsers.slice(0, 5);
    } catch (fallbackError) {
      console.error("Critical: Failed to generate fallback similar travelers list:", fallbackError);
      return [];
    }
  }
}
