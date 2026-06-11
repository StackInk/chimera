export interface TaskNode {
  id: string;
  description: string;
  parallel: boolean;
  story?: string;
  dependsOn: string[];
  filePath?: string;
}

export class TaskDAG {
  nodes: TaskNode[];

  constructor(nodes: TaskNode[]) {
    this.nodes = nodes;
  }

  getRoots(): TaskNode[] {
    return this.nodes.filter(n => n.dependsOn.length === 0);
  }

  getNextBatch(completedIds: string[]): TaskNode[] {
    const completedSet = new Set(completedIds);
    return this.nodes.filter(node => {
      if (completedSet.has(node.id)) return false;
      return node.dependsOn.every(dep => completedSet.has(dep));
    });
  }

  getDependents(taskId: string): TaskNode[] {
    return this.nodes.filter(n => n.dependsOn.includes(taskId));
  }
}

export function parseTasksDag(markdown: string): TaskDAG {
  const nodes: TaskNode[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^- \[ \] (T\d+)\s+(.*)$/);
    if (!match) continue;

    const [, id, rest] = match;
    const parallel = rest.includes('[P]');
    const storyMatch = rest.match(/\[US(\d+)\]/);
    const story = storyMatch ? `US${storyMatch[1]}` : undefined;

    const depsMatch = rest.match(/\(depends on ([^)]+)\)/);
    const dependsOn = depsMatch
      ? depsMatch[1].split(',').map(d => d.trim())
      : [];

    const pathMatch = rest.match(/in\s+([\w/./-]+\.\w+)/);
    const filePath = pathMatch ? pathMatch[1] : undefined;

    const description = rest
      .replace(/\[P\]\s*/, '')
      .replace(/\[US\d+\]\s*/, '')
      .replace(/\(depends on [^)]+\)\s*/, '')
      .trim();

    nodes.push({ id, description, parallel, story, dependsOn, filePath });
  }

  return new TaskDAG(nodes);
}
