import * as vscode from 'vscode';
import { PyTorchParser, PyTorchMetadata } from './pytorchParser';

export class PyTorchEditorProvider implements vscode.CustomReadonlyEditorProvider {
    
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new PyTorchEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            PyTorchEditorProvider.viewType, 
            provider
        );
        return providerRegistration;
    }

    private static readonly viewType = 'ckpt-inspector.pytorch';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public async openCustomDocument(
        uri: vscode.Uri,
        openContext: { backupId?: string },
        _token: vscode.CancellationToken
    ): Promise<PyTorchDocument> {
        const document = await PyTorchDocument.create(uri, openContext.backupId);
        return document;
    }

    public async resolveCustomEditor(
        document: PyTorchDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // 设置webview选项
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        // 设置webview内容
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);

        // 监听来自webview的消息
        webviewPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'refresh':
                        // 重新加载文档
                        document.reload().then(() => {
                            webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);
                        });
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private getHtmlForWebview(webview: vscode.Webview, document: PyTorchDocument): string {
        const metadata = document.metadata;
        
        if (!metadata) {
            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>PyTorch Model Inspector</title>
                    <style>
                        body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 20px; }
                        .error { color: var(--vscode-errorForeground); background: var(--vscode-inputValidation-errorBackground); padding: 15px; border-radius: 4px; border-left: 4px solid var(--vscode-errorForeground); }
                    </style>
                </head>
                <body>
                    <h1>🔥 PyTorch Model Inspector</h1>
                    <div class="error">
                        <h2>❌ Error</h2>
                        <p>${document.error || 'Unable to parse PyTorch file'}</p>
                        <details>
                            <summary>Troubleshooting</summary>
                            <p>Make sure you have:</p>
                            <ul>
                                <li>Python 3 installed and accessible</li>
                                <li>PyTorch installed (<code>pip install torch</code>)</li>
                                <li>Valid .pt/.pth file</li>
                            </ul>
                        </details>
                    </div>
                </body>
                </html>
            `;
        }

        // 检查是否有错误
        if (metadata.error) {
            const suggestions = (metadata as any).suggestions || [];
            const suggestionsHtml = suggestions.length > 0 ? `
                <h3>💡 Suggestions</h3>
                <ul>
                    ${suggestions.map((s: string) => `<li>${s}</li>`).join('')}
                </ul>
            ` : '';

            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>PyTorch Model Inspector</title>
                    <style>
                        body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 20px; }
                        .error { color: var(--vscode-errorForeground); background: var(--vscode-inputValidation-errorBackground); padding: 15px; border-radius: 4px; border-left: 4px solid var(--vscode-errorForeground); }
                        .traceback { font-family: var(--vscode-editor-font-family); background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px; margin-top: 10px; overflow-x: auto; }
                        .suggestions { background: var(--vscode-inputValidation-infoBackground); border-left: 4px solid var(--vscode-inputValidation-infoBorder); padding: 15px; border-radius: 4px; margin-top: 15px; }
                        .suggestions ul { margin: 10px 0; padding-left: 20px; }
                        .suggestions li { margin: 5px 0; }
                        code { background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 2px; font-family: var(--vscode-editor-font-family); }
                    </style>
                </head>
                <body>
                    <h1>🔥 PyTorch Model Inspector</h1>
                    <div class="error">
                        <h2>❌ Parsing Error</h2>
                        <p>${metadata.error}</p>
                        <p><strong>File Size:</strong> ${PyTorchParser.formatSize(metadata.file_size)}</p>
                        ${metadata.traceback ? `
                        <details>
                            <summary>Error Details</summary>
                            <pre class="traceback">${metadata.traceback}</pre>
                        </details>
                        ` : ''}
                    </div>
                    ${suggestionsHtml ? `<div class="suggestions">${suggestionsHtml}</div>` : ''}
                </body>
                </html>
            `;
        }

        // 检查是否是大文件
        const isLargeFile = metadata.file_size > (1024 * 1024 * 1024); // 1GB
        const largeFileWarning = isLargeFile ? `
            <div class="warning">
                <h3>⚠️ Large File Notice</h3>
                <p>This is a large PyTorch file (${PyTorchParser.formatSize(metadata.file_size)}). Parsing may take some time and consume significant memory.</p>
            </div>
        ` : '';

        const tensorsHtml = metadata.tensors
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(tensor => `
            <tr>
                <td class="tensor-name">${tensor.name}</td>
                <td><span class="dtype-badge dtype-${PyTorchParser.getDtypeCategory(tensor.dtype)}">${PyTorchParser.formatDtype(tensor.dtype)}</span></td>
                <td class="shape-cell">[${tensor.shape.join(', ')}]</td>
                <td class="number-cell">${tensor.numel.toLocaleString()}</td>
                <td class="size-cell">${PyTorchParser.formatSize(tensor.size_bytes)}</td>
                <td class="device-cell">${tensor.device}</td>
                ${tensor.error ? `<td class="error-cell">⚠️ ${tensor.error}</td>` : '<td></td>'}
            </tr>
        `).join('');

        const metadataHtml = Object.keys(metadata.metadata).length > 0
            ? Object.entries(metadata.metadata).map(([key, value]) => `
                <tr>
                    <td><strong>${key}</strong></td>
                    <td class="metadata-value">${JSON.stringify(value, null, 2)}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="2" style="text-align: center; color: var(--vscode-descriptionForeground); font-style: italic;">No metadata found</td></tr>';

        // 计算张量统计
        const tensorsByType = metadata.tensors.reduce((acc, tensor) => {
            const category = PyTorchParser.getDtypeCategory(tensor.dtype);
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const typeStatsHtml = Object.entries(tensorsByType).map(([type, count]) => `
            <div class="stat-item">
                <span class="stat-label">${type.toUpperCase()}:</span>
                <span>${count}</span>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PyTorch Model Inspector</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                        padding: 20px;
                        line-height: 1.6;
                    }
                    h1, h2 {
                        color: var(--vscode-titleBar-activeForeground);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 8px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    th, td {
                        padding: 8px 12px;
                        text-align: left;
                        border: 1px solid var(--vscode-panel-border);
                    }
                    th {
                        background: var(--vscode-editor-selectionBackground);
                        font-weight: bold;
                        position: sticky;
                        top: 0;
                        z-index: 10;
                    }
                    tr:nth-child(even) {
                        background: var(--vscode-list-hoverBackground);
                    }
                    tr:hover {
                        background: var(--vscode-list-activeSelectionBackground);
                    }
                    .summary {
                        background: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textBlockQuote-border);
                        padding: 15px;
                        margin: 15px 0;
                        border-radius: 4px;
                    }
                    .warning {
                        background: var(--vscode-inputValidation-warningBackground);
                        border-left: 4px solid var(--vscode-inputValidation-warningBorder);
                        padding: 15px;
                        margin: 15px 0;
                        border-radius: 4px;
                        color: var(--vscode-inputValidation-warningForeground);
                    }
                    .summary-item {
                        margin: 5px 0;
                        display: flex;
                        justify-content: space-between;
                    }
                    .summary-label {
                        font-weight: bold;
                    }
                    .tensor-name {
                        font-family: var(--vscode-editor-font-family);
                        font-weight: bold;
                        color: var(--vscode-symbolIcon-variableForeground);
                    }
                    .dtype-badge {
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 0.85em;
                        font-weight: bold;
                        color: white;
                    }
                    .dtype-float {
                        background: #007acc;
                    }
                    .dtype-int {
                        background: #e74c3c;
                    }
                    .dtype-uint {
                        background: #e67e22;
                    }
                    .dtype-bool {
                        background: #9b59b6;
                    }
                    .dtype-other {
                        background: #95a5a6;
                    }
                    .shape-cell {
                        font-family: var(--vscode-editor-font-family);
                        color: var(--vscode-symbolIcon-arrayForeground);
                    }
                    .number-cell, .size-cell {
                        text-align: right;
                        font-family: var(--vscode-editor-font-family);
                    }
                    .device-cell {
                        font-family: var(--vscode-editor-font-family);
                        font-size: 0.9em;
                        color: var(--vscode-symbolIcon-methodForeground);
                    }
                    .error-cell {
                        color: var(--vscode-errorForeground);
                        font-size: 0.85em;
                    }
                    .refresh-btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 3px;
                        cursor: pointer;
                        margin-bottom: 15px;
                        font-size: 14px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .refresh-btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .metadata-value {
                        font-family: var(--vscode-editor-font-family);
                        background: var(--vscode-textCodeBlock-background);
                        padding: 2px 4px;
                        border-radius: 2px;
                        word-break: break-all;
                    }
                    .table-container {
                        max-height: 70vh;
                        overflow-y: auto;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 10px;
                        margin: 10px 0;
                    }
                    .stat-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px;
                        background: var(--vscode-list-hoverBackground);
                        border-radius: 3px;
                    }
                    .stat-label {
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <h1>🔥 PyTorch Model Inspector</h1>
                
                <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
                
                ${largeFileWarning}
                
                <div class="summary">
                    <h3>📊 Model Summary</h3>
                    <div class="summary-item">
                        <span class="summary-label">Total Tensors:</span>
                        <span>${metadata.total_tensors}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total Parameters:</span>
                        <span>${metadata.total_parameters.toLocaleString()}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">File Size:</span>
                        <span>${PyTorchParser.formatSize(metadata.file_size)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Model Size:</span>
                        <span>${PyTorchParser.formatSize(PyTorchParser.calculateTotalSize(metadata.tensors))}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Format:</span>
                        <span>PyTorch Pickle</span>
                    </div>
                    
                    <h4>📈 Tensor Types</h4>
                    <div class="stats-grid">
                        ${typeStatsHtml}
                    </div>
                </div>

                <h2>📋 Tensors</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Data Type</th>
                                <th>Shape</th>
                                <th>Parameters</th>
                                <th>Size</th>
                                <th>Device</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tensorsHtml}
                        </tbody>
                    </table>
                </div>

                <h2>🏷️ Metadata</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${metadataHtml}
                        </tbody>
                    </table>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function refresh() {
                        vscode.postMessage({ type: 'refresh' });
                    }
                </script>
            </body>
            </html>
        `;
    }
}

class PyTorchDocument implements vscode.CustomDocument {
    
    public static async create(
        uri: vscode.Uri,
        backupId: string | undefined
    ): Promise<PyTorchDocument> {
        const document = new PyTorchDocument(uri);
        await document.reload();
        return document;
    }

    private constructor(
        public readonly uri: vscode.Uri
    ) { }

    public metadata: PyTorchMetadata | null = null;
    public error: string | null = null;

    public async reload(): Promise<void> {
        try {
            this.metadata = await PyTorchParser.parseFile(this.uri.fsPath);
            this.error = null;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Unknown error';
            this.metadata = null;
        }
    }

    dispose(): void {
        // 清理资源
    }
}
