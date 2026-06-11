export type TDDCycle = 'red' | 'green' | 'refactor';

export interface TDDState {
  feature: string;
  task: string;
  cycle: TDDCycle;
  test_file?: string;
  src_file?: string;
  cycles_completed: number;
}
