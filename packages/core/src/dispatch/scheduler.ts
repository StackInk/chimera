import type { TaskNode } from './dag.js';
import { TaskDAG } from './dag.js';

export class Scheduler {
  private dag: TaskDAG;
  private layers: TaskNode[][] | null = null;

  constructor(dag: TaskDAG) {
    this.dag = dag;
  }

  getLayers(): TaskNode[][] {
    if (this.layers) return this.layers;

    const layers: TaskNode[][] = [];
    const completed = new Set<string>();
    const allIds = new Set(this.dag.nodes.map(n => n.id));

    while (completed.size < allIds.size) {
      const batch = this.dag.getNextBatch([...completed]);
      if (batch.length === 0) break;
      layers.push(batch);
      for (const node of batch) {
        completed.add(node.id);
      }
    }

    this.layers = layers;
    return layers;
  }

  getCriticalPathLength(): number {
    return this.getLayers().length;
  }

  getMaxParallelism(): number {
    const layers = this.getLayers();
    return Math.max(...layers.map(l => l.length), 0);
  }
}
