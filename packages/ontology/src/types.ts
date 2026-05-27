export type ArchetypeId =
  | "production_saas"
  | "open_source_library"
  | "internal_tool"
  | "ml_research"
  | "devops_infra"
  | "monorepo"
  | "cli_tool"
  | "mobile_app"
  | "static_site";

export type StageId = "junior" | "mid" | "senior" | "staff";

export type PillarId =
  | "authenticity"
  | "readability"
  | "system_thinking"
  | "production_reality"
  | "stage_calibration";

export interface ClassificationSignals {
  required_any?: string[];
  positive?: string[];
  negative?: string[];
}

export interface ArchetypeDef {
  id: ArchetypeId;
  name: string;
  description: string;
  classification_signals: ClassificationSignals;
  expected_sections: string[];
  expected_artifacts: string[];
  pillar_weights: Record<PillarId, number>;
}

export interface StageSuggestionTemplate {
  id: string;
  pillar: PillarId;
  title: string;
  description: string;
  trigger: string;
  impact: number;
  effort: number;
}

export interface StageDef {
  stage: StageId;
  archetype: ArchetypeId;
  priority_sections: string[];
  priority_artifacts: string[];
  deemphasized_sections?: string[];
  required_pillars: PillarId[];
  stage_specific_suggestions: StageSuggestionTemplate[];
}

export interface OntologyVersion {
  version: string;
  released: string;
}
