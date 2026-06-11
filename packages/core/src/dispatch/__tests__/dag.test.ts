import { describe, it, expect } from 'vitest';
import { parseTasksDag, type TaskNode } from '../dag.js';

const sampleTasksMd = `# Tasks

## Phase 3: User Story 1

- [ ] T012 [P] [US1] Create User model in src/models/user.ts
- [ ] T013 [P] [US1] Create Auth model in src/models/auth.ts
- [ ] T014 [US1] Implement UserService in src/services/user.ts (depends on T012, T013)
- [ ] T015 [US1] Implement auth endpoint in src/api/auth.ts (depends on T014)

## Phase 4: User Story 2

- [ ] T020 [P] [US2] Create Order model in src/models/order.ts
- [ ] T021 [US2] Implement OrderService in src/services/order.ts (depends on T020)
`;

describe('parseTasksDag', () => {
  it('parses tasks from markdown', () => {
    const dag = parseTasksDag(sampleTasksMd);
    expect(dag.nodes.length).toBe(6);
  });

  it('extracts task IDs', () => {
    const dag = parseTasksDag(sampleTasksMd);
    const ids = dag.nodes.map(n => n.id);
    expect(ids).toContain('T012');
    expect(ids).toContain('T015');
  });

  it('identifies parallel tasks', () => {
    const dag = parseTasksDag(sampleTasksMd);
    const parallel = dag.nodes.filter(n => n.parallel);
    expect(parallel.length).toBe(3);
  });

  it('parses dependencies', () => {
    const dag = parseTasksDag(sampleTasksMd);
    const t014 = dag.nodes.find(n => n.id === 'T014')!;
    expect(t014.dependsOn).toEqual(['T012', 'T013']);
  });

  it('identifies root tasks (no dependencies)', () => {
    const dag = parseTasksDag(sampleTasksMd);
    const roots = dag.getRoots();
    expect(roots.map(n => n.id)).toContain('T012');
    expect(roots.map(n => n.id)).toContain('T013');
    expect(roots.map(n => n.id)).toContain('T020');
  });

  it('gets next available batch (topo layer)', () => {
    const dag = parseTasksDag(sampleTasksMd);
    const batch1 = dag.getNextBatch([]);
    expect(batch1.map(n => n.id).sort()).toEqual(['T012', 'T013', 'T020']);
  });

  it('gets second batch after completing first', () => {
    const dag = parseTasksDag(sampleTasksMd);
    const batch2 = dag.getNextBatch(['T012', 'T013', 'T020']);
    expect(batch2.map(n => n.id).sort()).toEqual(['T014', 'T021']);
  });
});
