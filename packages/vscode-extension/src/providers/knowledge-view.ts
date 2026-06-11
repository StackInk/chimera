import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface KnowledgeBlock {
  id: string;
  title: string;
  status: string;
  tags: string[];
  expires_at: string | null;
}

export class KnowledgeTreeProvider implements vscode.TreeDataProvider<KnowledgeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<KnowledgeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: KnowledgeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): KnowledgeItem[] {
    const blocksDir = path.join(this.workspaceRoot, '.chimera', 'archive', 'blocks');
    if (!fs.existsSync(blocksDir)) return [];

    const files = fs.readdirSync(blocksDir).filter(f => f.endsWith('.json'));
    const items: KnowledgeItem[] = [];

    for (const file of files) {
      try {
        const block: KnowledgeBlock = JSON.parse(
          fs.readFileSync(path.join(blocksDir, file), 'utf-8')
        );
        items.push(new KnowledgeItem(block));
      } catch { /* skip invalid */ }
    }

    return items.sort((a, b) => {
      const statusOrder = { stale: 0, active: 1, archived: 2, invalidated: 3 };
      return (statusOrder[a.block.status as keyof typeof statusOrder] ?? 4) -
             (statusOrder[b.block.status as keyof typeof statusOrder] ?? 4);
    });
  }
}

class KnowledgeItem extends vscode.TreeItem {
  constructor(public readonly block: KnowledgeBlock) {
    super(block.title, vscode.TreeItemCollapsibleState.None);

    const icon = block.status === 'stale' ? '⚠️' :
                 block.status === 'active' ? '✓' :
                 block.status === 'archived' ? '📦' : '✗';

    this.description = `${icon} ${block.status} · ${block.tags.join(', ')}`;
    this.tooltip = `${block.id}: ${block.title}\nStatus: ${block.status}\nExpires: ${block.expires_at || 'never'}`;

    if (block.status === 'stale') {
      this.iconPath = new vscode.ThemeIcon('warning');
    } else if (block.status === 'active') {
      this.iconPath = new vscode.ThemeIcon('check');
    } else {
      this.iconPath = new vscode.ThemeIcon('archive');
    }
  }
}
