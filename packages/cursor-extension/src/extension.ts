import * as vscode from "vscode";
import { execFile } from "node:child_process";

const CLI = "tucaken-signal";

export function activate(ctx: vscode.ExtensionContext): void {
  ctx.subscriptions.push(
    vscode.commands.registerCommand("tucaken.analyze", () => runCli(["--format=md"], "Tucaken: Analyze")),
    vscode.commands.registerCommand("tucaken.preview", () => runCli(["preview"], "Tucaken: Preview")),
    vscode.commands.registerCommand("tucaken.compareStages", () => runCli(["compare-stages"], "Tucaken: Compare stages")),
  );
}

export function deactivate(): void {/* no-op */}

function runCli(args: string[], title: string): void {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!folder) {
    vscode.window.showErrorMessage("Open a folder to run Tucaken Signal.");
    return;
  }
  vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title, cancellable: false },
    () =>
      new Promise<void>((resolveProgress) => {
        execFile(CLI, args, { cwd: folder, maxBuffer: 4 * 1024 * 1024 }, async (err, stdout, stderr) => {
          if (err) {
            vscode.window.showErrorMessage(`Tucaken Signal failed: ${stderr || err.message}`);
            resolveProgress();
            return;
          }
          const doc = await vscode.workspace.openTextDocument({ content: stdout, language: "markdown" });
          await vscode.window.showTextDocument(doc, { preview: false });
          resolveProgress();
        });
      })
  );
}
