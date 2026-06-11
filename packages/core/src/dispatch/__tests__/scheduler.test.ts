import { describe, it, expect } from 'vitest';
import { Scheduler } from '../scheduler.js';
import { parseTasksDag } from '../dag.js';

const tasksMd = `# Tasks

- [ ] T001 [P] [US1] Create model A in src/a.ts
- [ ] T002 [P] [US1] Create model B in src/b.ts
- [ ] T003 [US1] Combine A+B in src/ab.ts (depends on T001, T002)
- [ ] T004 [P] [US2] Independent task in src/c.ts
- [ ] T005 [US2] Depends on T004 in src/d.ts (depends on T004)
`;

describe('Scheduler', () => {
  it('generates execution layers from DAG', () => {
    const dag = parseTasksDag(tasksMd);
    const scheduler = new Scheduler(dag);
    const layers = scheduler.getLayers();
    expect(layers.length).toBeGreaterThanOrEqual(2);
    expect(layers[0].map(n => n.id).sort()).toEqual(['T001', 'T002', 'T004']);
    expect(layers[1].map(n => n.id).sort()).toEqual(['T003', 'T005']);
  });

  it('identifies max parallelism per layer', () => {
    const dag = parseTasksDag(tasksMd);
    const scheduler = new Scheduler(dag);
    const layers = scheduler.getLayers();
    expect(layers[0].length).toBe(3);
  });

  it('total layers equals longest chain', () => {
    const dag = parseTasksDag(tasksMd);
    const scheduler = new Scheduler(dag);
    expect(scheduler.getCriticalPathLength()).toBe(2);
  });
});
