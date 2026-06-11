import type { TaskNode } from './dag.js';
import { TaskDAG } from './dag.js';
import { Scheduler } from './scheduler.js';

export type TaskStatus = 'pending' | 'running' | 'done' | 'done_with_concerns' | 'needs_context' | 'blocked';

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  output?: string;
  concerns?: string[];
}

export interface DispatchPlan {
  layers: { tasks: TaskNode[]; parallelism: number }[];
  criticalPath: number;
  totalTasks: number;
}

export class Orchestrator {
  private dag: TaskDAG;
  private scheduler: Scheduler;
  private results: Map<string, TaskResult> = new Map();

  constructor(dag: TaskDAG) {
    this.dag = dag;
    this.scheduler = new Scheduler(dag);
  }

  getDispatchPlan(): DispatchPlan {
    const layers = this.scheduler.getLayers();
    return {
      layers: layers.map(layer => ({
        tasks: layer,
        parallelism: layer.length,
      })),
      criticalPath: this.scheduler.getCriticalPathLength(),
      totalTasks: this.dag.nodes.length,
    };
  }

  getNextBatch(): TaskNode[] {
    const completedIds = [...this.results.entries()]
      .filter(([, r]) => r.status === 'done' || r.status === 'done_with_concerns')
      .map(([id]) => id);
    return this.dag.getNextBatch(completedIds)
      .filter(n => !this.results.has(n.id));
  }

  recordResult(result: TaskResult): void {
    this.results.set(result.taskId, result);
  }

  isComplete(): boolean {
    const doneStatuses: TaskStatus[] = ['done', 'done_with_concerns'];
    return this.dag.nodes.every(n => {
      const r = this.results.get(n.id);
      return r && doneStatuses.includes(r.status);
    });
  }

  getProgress(): { done: number; total: number; blocked: number } {
    const done = [...this.results.values()].filter(r => r.status === 'done' || r.status === 'done_with_concerns').length;
    const blocked = [...this.results.values()].filter(r => r.status === 'blocked').length;
    return { done, total: this.dag.nodes.length, blocked };
  }
}
