import * as vscode from 'vscode';
import { SafetensorsParser, SafetensorsMetadata } from './safetensorsParser';

export class SafetensorsEditorProvider implements vscode.CustomReadonlyEditorProvider {
    
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new SafetensorsEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            SafetensorsEditorProvider.viewType, 
            provider
        );
        return providerRegistration;
    }

    private static readonly viewType = 'ckpt-inspector.safetensors';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    public async openCustomDocument(
        uri: vscode.Uri,
        openContext: { backupId?: string },
        _token: vscode.CancellationToken
    ): Promise<SafetensorsDocument> {
        const document = await SafetensorsDocument.create(uri, openContext.backupId);
        return document;
    }

    public async resolveCustomEditor(
        document: SafetensorsDocument,
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

    private getHtmlForWebview(webview: vscode.Webview, document: SafetensorsDocument): string {
        const metadata = document.metadata;
        
        if (!metadata) {
            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Safetensors Inspector</title>
                    <style>
                        body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 20px; }
                        .error { color: var(--vscode-errorForeground); }
                    </style>
                </head>
                <body>
                    <h1>Safetensors Inspector</h1>
                    <div class="error">
                        <h2>Error</h2>
                        <p>${document.error || 'Unable to parse safetensors file'}</p>
                    </div>
                </body>
                </html>
            `;
        }

        const tensorsHtml = metadata.tensors
            .sort((a, b) => a.name.localeCompare(b.name)) // 按名称排序
            .map(tensor => `
            <tr>
                <td class="tensor-name">${tensor.name}</td>
                <td><span class="dtype-badge dtype-${tensor.dtype.toLowerCase()}">${tensor.dtype}</span></td>
                <td class="shape-cell">[${tensor.shape.join(', ')}]</td>
                <td class="number-cell">${SafetensorsParser.calculateTensorElements(tensor.shape).toLocaleString()}</td>
                <td class="size-cell">${SafetensorsParser.formatSize(tensor.sizeInBytes)}</td>
            </tr>
        `).join('');

        // 检查是否是大文件
        const isLargeFile = metadata.totalSize > (2 * 1024 * 1024 * 1024); // 2GB
        const largeFileWarning = isLargeFile ? `
            <div class="warning">
                <h3>⚠️ Large File Notice</h3>
                <p>This is a large file (${SafetensorsParser.formatSize(metadata.totalSize)}). Only header information is displayed for performance reasons. Tensor data is not loaded into memory.</p>
            </div>
        ` : '';

        const metadataHtml = metadata.metadata 
            ? Object.entries(metadata.metadata).map(([key, value]) => `
                <tr>
                    <td><strong>${key}</strong></td>
                    <td class="metadata-value">${JSON.stringify(value, null, 2)}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="2" style="text-align: center; color: var(--vscode-descriptionForeground); font-style: italic;">No metadata found</td></tr>';

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Safetensors Inspector</title>
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
                    .dtype-f32, .dtype-f64, .dtype-f16 {
                        background: #007acc;
                    }
                    .dtype-i64, .dtype-i32, .dtype-i16, .dtype-i8 {
                        background: #e74c3c;
                    }
                    .dtype-u64, .dtype-u32, .dtype-u16, .dtype-u8 {
                        background: #e67e22;
                    }
                    .dtype-bool {
                        background: #9b59b6;
                    }
                    .shape-cell {
                        font-family: var(--vscode-editor-font-family);
                        color: var(--vscode-symbolIcon-arrayForeground);
                    }
                    .number-cell, .size-cell {
                        text-align: right;
                        font-family: var(--vscode-editor-font-family);
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
                </style>
            </head>
            <body>
                <h1>🔍 Safetensors Inspector</h1>
                
                <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
                
                ${largeFileWarning}
                
                <div class="summary">
                    <h3>📊 Summary</h3>
                    <div class="summary-item">
                        <span class="summary-label">Total Tensors:</span>
                        <span>${metadata.tensors.length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">File Size:</span>
                        <span>${SafetensorsParser.formatSize(metadata.totalSize)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total Elements:</span>
                        <span>${metadata.tensors.reduce((sum, t) => sum + SafetensorsParser.calculateTensorElements(t.shape), 0).toLocaleString()}</span>
                    </div>
                    ${isLargeFile ? `
                    <div class="summary-item">
                        <span class="summary-label">Performance Mode:</span>
                        <span>Large File (Header Only)</span>
                    </div>
                    ` : ''}
                </div>

                <h2>📋 Tensors</h2>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Data Type</th>
                                <th>Shape</th>
                                <th>Elements</th>
                                <th>Size</th>
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

class SafetensorsDocument implements vscode.CustomDocument {
    
    public static async create(
        uri: vscode.Uri,
        backupId: string | undefined
    ): Promise<SafetensorsDocument> {
        const document = new SafetensorsDocument(uri);
        await document.reload();
        return document;
    }

    private constructor(
        public readonly uri: vscode.Uri
    ) { }

    public metadata: SafetensorsMetadata | null = null;
    public error: string | null = null;

    public async reload(): Promise<void> {
        try {
            this.metadata = await SafetensorsParser.parseFile(this.uri.fsPath);
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
