// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SafetensorsEditorProvider } from './safetensorsEditor';
import { PyTorchEditorProvider } from './pytorchEditor';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ckpt-inspector" is now active!');

	// Register the safetensors custom editor
	context.subscriptions.push(SafetensorsEditorProvider.register(context));

	// Register the PyTorch custom editor
	context.subscriptions.push(PyTorchEditorProvider.register(context));

	// Command to open safetensors files with the custom editor
	const openSafetensorsCommand = vscode.commands.registerCommand('ckpt-inspector.openSafetensors', async (uri: vscode.Uri) => {
		if (!uri) {
			// If no URI provided, let user select a file
			const fileUris = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					'Safetensors files': ['safetensors']
				}
			});

			if (fileUris && fileUris.length > 0) {
				uri = fileUris[0];
			} else {
				return;
			}
		}

		// Open the file with our custom editor
		await vscode.commands.executeCommand('vscode.openWith', uri, 'ckpt-inspector.safetensors');
	});

	context.subscriptions.push(openSafetensorsCommand);

	// Command to open PyTorch files with the custom editor
	const openPyTorchCommand = vscode.commands.registerCommand('ckpt-inspector.openPyTorch', async (uri: vscode.Uri) => {
		if (!uri) {
			// If no URI provided, let user select a file
			const fileUris = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					'PyTorch files': ['pt', 'pth']
				}
			});

			if (fileUris && fileUris.length > 0) {
				uri = fileUris[0];
			} else {
				return;
			}
		}

		// Open the file with our custom editor
		await vscode.commands.executeCommand('vscode.openWith', uri, 'ckpt-inspector.pytorch');
	});

	context.subscriptions.push(openPyTorchCommand);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('ckpt-inspector.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from ckpt_inspector!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
