import * as vscode from 'vscode';
import * as path from 'path';

export class StateWatcher implements vscode.Disposable {
  private watcher: vscode.FileSystemWatcher | undefined;
  private _onStateChanged = new vscode.EventEmitter<void>();
  readonly onStateChanged = this._onStateChanged.event;

  constructor(private workspaceRoot: string) {}

  start(): void {
    const pattern = new vscode.RelativePattern(
      this.workspaceRoot,
      '.chimera/state.json'
    );

    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);
    this.watcher.onDidChange(() => this._onStateChanged.fire());
    this.watcher.onDidCreate(() => this._onStateChanged.fire());
    this.watcher.onDidDelete(() => this._onStateChanged.fire());
  }

  dispose(): void {
    this.watcher?.dispose();
    this._onStateChanged.dispose();
  }
}
