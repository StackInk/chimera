import * as vscode from 'vscode';
import { KanbanViewProvider } from './providers/kanban-view';
import { KnowledgeTreeProvider } from './providers/knowledge-view';
import { ConstitutionTreeProvider } from './providers/constitution-view';
import { StateWatcher } from './watchers/state-watcher';

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) return;

  // Kanban Webview
  const kanbanProvider = new KanbanViewProvider(context.extensionUri, workspaceRoot);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(KanbanViewProvider.viewType, kanbanProvider)
  );

  // Knowledge TreeView
  const knowledgeProvider = new KnowledgeTreeProvider(workspaceRoot);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('chimera.knowledgeView', knowledgeProvider)
  );

  // Constitution TreeView
  const constitutionProvider = new ConstitutionTreeProvider(workspaceRoot);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('chimera.constitutionView', constitutionProvider)
  );

  // File Watcher — refresh views on state change
  const watcher = new StateWatcher(workspaceRoot);
  watcher.onStateChanged(() => {
    kanbanProvider.refresh();
    knowledgeProvider.refresh();
    constitutionProvider.refresh();
  });
  watcher.start();
  context.subscriptions.push(watcher);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('chimera.refresh', () => {
      kanbanProvider.refresh();
      knowledgeProvider.refresh();
      constitutionProvider.refresh();
      vscode.window.showInformationMessage('Chimera: Views refreshed');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('chimera.openState', () => {
      const statePath = vscode.Uri.file(`${workspaceRoot}/.chimera/state.json`);
      vscode.window.showTextDocument(statePath);
    })
  );
}

export function deactivate() {}
