import neo4j, { Driver } from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "password";

let driver: Driver | null = null;

/**
 * Retrieves the singleton instance of the Neo4j driver.
 */
export function getNeo4jDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

/**
 * Closes the Neo4j driver connection.
 */
export async function closeNeo4j() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Runs a Cypher query with optional parameters in a single write/read session transaction.
 */
export async function runQuery(query: string, params: Record<string, any> = {}) {
  const drv = getNeo4jDriver();
  const session = drv.session();
  try {
    const result = await session.run(query, params);
    return result;
  } finally {
    await session.close();
  }
}
