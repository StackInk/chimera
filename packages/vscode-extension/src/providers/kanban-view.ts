import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface FeatureState {
  id: string;
  name: string;
  phase: string;
  updated_at: string;
}

interface ProjectState {
  version: string;
  features: FeatureState[];
}

const PHASES = ['idle', 'spec', 'plan', 'tasks', 'workspace', 'implement', 'review', 'finish', 'archive'];

export class KanbanViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'chimera.kanbanView';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly workspaceRoot: string
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    this.refresh();
  }

  refresh(): void {
    if (!this._view) return;
    const state = this.loadState();
    this._view.webview.html = this.getHtml(state);
  }

  private loadState(): ProjectState | null {
    const statePath = path.join(this.workspaceRoot, '.chimera', 'state.json');
    if (!fs.existsSync(statePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    } catch {
      return null;
    }
  }

  private getHtml(state: ProjectState | null): string {
    if (!state) {
      return `<!DOCTYPE html><html><body><p>No .chimera/state.json found. Run <code>chimera init</code>.</p></body></html>`;
    }

    const columns = PHASES.map(phase => {
      const features = state.features.filter(f => f.phase === phase);
      const cards = features.map(f => `
        <div class="card">
          <div class="card-title">${escapeHtml(f.name)}</div>
          <div class="card-id">${escapeHtml(f.id)}</div>
        </div>
      `).join('');

      return `
        <div class="column">
          <div class="column-header">${phase}</div>
          <div class="column-count">${features.length}</div>
          <div class="cards">${cards || '<div class="empty">—</div>'}</div>
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: var(--vscode-font-family); margin: 0; padding: 8px; background: var(--vscode-editor-background); color: var(--vscode-foreground); }
  .board { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; }
  .column { min-width: 120px; background: var(--vscode-sideBar-background); border-radius: 6px; padding: 8px; }
  .column-header { font-weight: bold; font-size: 11px; text-transform: uppercase; opacity: 0.7; margin-bottom: 4px; }
  .column-count { font-size: 10px; opacity: 0.5; margin-bottom: 8px; }
  .card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 8px; margin-bottom: 6px; }
  .card-title { font-size: 12px; font-weight: 500; }
  .card-id { font-size: 10px; opacity: 0.5; margin-top: 2px; }
  .empty { opacity: 0.3; font-size: 11px; text-align: center; }
  .meta { font-size: 11px; opacity: 0.6; margin-bottom: 12px; }
</style>
</head>
<body>
  <div class="meta">Chimera v${state.version} · ${state.features.length} features</div>
  <div class="board">${columns}</div>
</body>
</html>`;
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
