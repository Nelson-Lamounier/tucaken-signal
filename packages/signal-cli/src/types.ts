import type { ArchetypeId, PillarId, StageId } from "@tucaken/ontology";

export interface EvidenceRef {
  kind: string;
  path?: string;
  snippet?: string;
  note?: string;
}

export interface EvidenceMap {
  files: {
    readme?: { path: string; content: string; lines: string[] };
    packageJson?: { path: string; content: Record<string, unknown> };
    pyprojectToml?: { path: string };
    dockerfile?: string;
    composeFile?: string;
    iacRoots: string[];
    ciWorkflows: string[];
    adrDir?: string;
    runbookFiles: string[];
    aiUsageDoc?: string;
    notebooks: string[];
    k8sManifests: string[];
    helmCharts: string[];
    contentDirs: string[];
    examplesDirs: string[];
  };
  signals: Record<string, boolean>;
  metrics: Record<string, number>;
  notes: string[];
}

export interface PillarScore {
  pillar: PillarId;
  score: number;
  notes: string[];
}

export interface TrustSignalReport {
  archetype: { id: ArchetypeId; confidence: number };
  stage: { id: StageId; inferred: boolean; confidence: number; explanation: string };
  pillars: PillarScore[];
  overallScore: number;
  recruiterGlance: {
    visible: string[];
    invisible: string[];
  };
  suggestions: Suggestion[];
  anticipatedQuestions: AnticipatedQuestion[];
  ontologyVersion: string;
}

export interface AnticipatedQuestion {
  question: string;
  topic: string;
  documentedHere: string | null;
}

export interface Suggestion {
  id: string;
  pillar: PillarId;
  category: "missing" | "thin" | "enhancement" | "structural" | "stage_specific";
  stageTarget: StageId | "any";
  title: string;
  description: string;
  evidenceBasis: EvidenceRef[];
  impactScore: number;
  effortScore: number;
  pillarWeight: number;
  combinedRank: number;
  targetPath?: string;
  draftAvailable: boolean;
}
