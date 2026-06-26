import type { EngineType } from '../../types';

export type DetailType = 'engine' | 'parent' | 'child' | 'tool' | 'deliverable';

export interface DetailItem {
  type: DetailType;
  id: string;
  name: string;
  engineType: EngineType;
}
