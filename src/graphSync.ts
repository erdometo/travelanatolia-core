import { runQuery } from "./neo4j";
import { TravelerProfile, Experience } from "./types";

/**
 * Synchronizes a TravelerProfile to Neo4j.
 * Creates the User node and connects it to relevant Interest and Style nodes.
 */
export async function syncUserProfileToGraph(profile: TravelerProfile) {
  console.log(`🔄 Syncing User ${profile.userId} (${profile.fullName}) to Neo4j Graph...`);

  // 1. Create/Update User Node
  const userQuery = `
    MERGE (u:User {id: $userId})
    SET u.name = $fullName,
        u.travelStyle = $travelStyle,
        u.budgetRange = $budgetRange,
        u.companion = $companion,
        u.persona = $personaDescription,
        u.updatedAt = datetime()
    RETURN u
  `;
  await runQuery(userQuery, {
    userId: profile.userId,
    fullName: profile.fullName,
    travelStyle: profile.travelStyle,
    budgetRange: profile.budgetRange,
    companion: profile.companion,
    personaDescription: profile.personaDescription,
  });

  // 2. Detach old interests to avoid accumulating outdated preferences
  const detachQuery = `
    MATCH (u:User {id: $userId})-[r:HAS_INTEREST]->()
    DELETE r
  `;
  await runQuery(detachQuery, { userId: profile.userId });

  // 3. Create Interest nodes and link them
  if (profile.interests && profile.interests.length > 0) {
    const interestQuery = `
      MATCH (u:User {id: $userId})
      UNWIND $interests AS interestName
      MERGE (i:Interest {name: toLower(trim(interestName))})
      MERGE (u)-[:HAS_INTEREST]->(i)
    `;
    await runQuery(interestQuery, {
      userId: profile.userId,
      interests: profile.interests,
    });
  }

  console.log(`✅ User ${profile.userId} synced to Neo4j Graph.`);
}

/**
 * Synchronizes an Experience to Neo4j.
 * Creates the Experience node, Location node, and links it to Interest/Tag nodes.
 */
export async function syncExperienceToGraph(exp: Experience) {
  console.log(`🔄 Syncing Experience ${exp.id} (${exp.name}) to Neo4j Graph...`);

  // 1. Create/Update Experience Node and Location
  const expQuery = `
    MERGE (e:Experience {id: $id})
    SET e.name = $name,
        e.category = $category,
        e.priceUSD = $priceUSD,
        e.updatedAt = datetime()
    
    MERGE (l:Location {name: $location})
    MERGE (e)-[:LOCATED_IN]->(l)
    RETURN e
  `;
  await runQuery(expQuery, {
    id: exp.id,
    name: exp.name,
    category: exp.category,
    priceUSD: exp.priceUSD,
    location: exp.location,
  });

  // 2. Detach old tags
  const detachQuery = `
    MATCH (e:Experience {id: $id})-[r:HAS_TAG]->()
    DELETE r
  `;
  await runQuery(detachQuery, { id: exp.id });

  // 3. Create Interest/Tag nodes and link them
  if (exp.tags && exp.tags.length > 0) {
    const tagQuery = `
      MATCH (e:Experience {id: $id})
      UNWIND $tags AS tagName
      MERGE (i:Interest {name: toLower(trim(tagName))})
      MERGE (e)-[:HAS_TAG]->(i)
    `;
    await runQuery(tagQuery, {
      id: exp.id,
      tags: exp.tags,
    });
  }

  console.log(`✅ Experience ${exp.id} synced to Neo4j Graph.`);
}
