import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface ConstitutionRule {
  id: string;
  priority: string;
  description: string;
}

export class ConstitutionTreeProvider implements vscode.TreeDataProvider<ConstitutionItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ConstitutionItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: ConstitutionItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ConstitutionItem): ConstitutionItem[] {
    if (element) return [];

    const constitutionPath = path.join(this.workspaceRoot, '.chimera', 'constitution.md');
    if (!fs.existsSync(constitutionPath)) return [];

    const content = fs.readFileSync(constitutionPath, 'utf-8');
    return this.parseRules(content);
  }

  private parseRules(content: string): ConstitutionItem[] {
    const items: ConstitutionItem[] = [];
    let currentPriority = '';

    for (const line of content.split('\n')) {
      const headerMatch = line.match(/^##\s+(MUST|SHOULD|MAY)\s*$/);
      if (headerMatch) {
        currentPriority = headerMatch[1];
        continue;
      }

      if (!currentPriority) continue;

      const ruleMatch = line.match(/^-\s+(C-\d+):\s*(.+)/);
      if (ruleMatch) {
        items.push(new ConstitutionItem({
          id: ruleMatch[1],
          priority: currentPriority,
          description: ruleMatch[2].replace(/\[scope:[^\]]+\]\s*/, '').trim(),
        }));
      }
    }

    return items;
  }
}

class ConstitutionItem extends vscode.TreeItem {
  constructor(public readonly rule: ConstitutionRule) {
    super(`${rule.id}: ${rule.description}`, vscode.TreeItemCollapsibleState.None);

    this.description = rule.priority;

    switch (rule.priority) {
      case 'MUST':
        this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        break;
      case 'SHOULD':
        this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
        break;
      case 'MAY':
        this.iconPath = new vscode.ThemeIcon('info');
        break;
    }

    this.tooltip = `[${rule.priority}] ${rule.id}: ${rule.description}`;
  }
}
