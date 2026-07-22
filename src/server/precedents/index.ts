export {
  listPrecedents,
  getPrecedent,
  getPrecedentWithVersions,
  createPrecedent,
  updatePrecedent,
  deletePrecedent,
  findSimilarPrecedents,
  getPrecedentVersions,
} from "./precedent-service";

export { computeSimilarity, matchPrecedents } from "./similarity-engine";

export {
  autoCreatePrecedent,
  buildPrecedentMatchContext,
  createPrecedentFromAssessment,
} from "./auto-precedent";

export type {
  Precedent,
  PrecedentCreateInput,
  PrecedentUpdateInput,
  PrecedentFilter,
  PrecedentSearchResult,
  PrecedentMatchContext,
  MatchedPrecedent,
} from "@/features/precedents/types";
