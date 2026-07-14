import type { RelationshipType } from "@/server/engineering/constants";

export interface RelationshipConnectorRule {
  relationshipType: RelationshipType;
  connector: RegExp;
  method: string;
}

/**
 * Connector phrases used to detect a relationship between two entities that
 * were both already extracted on the same line of text. Purely lexical -
 * no inference about whether the relationship is actually true.
 */
export const RELATIONSHIP_CONNECTOR_RULES: RelationshipConnectorRule[] = [
  {
    relationshipType: "DEPENDS_ON",
    connector: /\bdepends on\b/i,
    method: "regex:connector-depends-on-v1",
  },
  {
    relationshipType: "CONTAINS",
    connector: /\bcontains\b/i,
    method: "regex:connector-contains-v1",
  },
  {
    relationshipType: "IMPLEMENTS",
    connector: /\bimplements\b/i,
    method: "regex:connector-implements-v1",
  },
  {
    relationshipType: "VERIFIES",
    connector: /\bverifies\b|\bis verified by\b/i,
    method: "regex:connector-verifies-v1",
  },
  {
    relationshipType: "MANUFACTURED_BY",
    connector: /\bmanufactured by\b/i,
    method: "regex:connector-manufactured-by-v1",
  },
  {
    relationshipType: "SUPPLIED_BY",
    connector: /\bsupplied by\b/i,
    method: "regex:connector-supplied-by-v1",
  },
  {
    relationshipType: "TESTED_BY",
    connector: /\btested by\b/i,
    method: "regex:connector-tested-by-v1",
  },
  {
    relationshipType: "CERTIFIED_BY",
    connector: /\bcertified by\b/i,
    method: "regex:connector-certified-by-v1",
  },
  {
    relationshipType: "DERIVED_FROM",
    connector: /\bderived from\b/i,
    method: "regex:connector-derived-from-v1",
  },
  {
    relationshipType: "SUPERSEDES",
    connector: /\bsupersedes\b/i,
    method: "regex:connector-supersedes-v1",
  },
];
