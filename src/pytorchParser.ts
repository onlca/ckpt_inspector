import * as fs from 'fs';
import * as path from 'path';
import { PythonShell } from 'python-shell';

export interface PyTorchTensorInfo {
    name: string;
    dtype: string;
    shape: number[];
    numel: number;
    size_bytes: number;
    device: string;
    error?: string;
}

export interface PyTorchMetadata {
    tensors: PyTorchTensorInfo[];
    metadata: { [key: string]: any };
    file_size: number;
    total_tensors: number;
    total_parameters: number;
    format_type: string;
    error?: string;
    traceback?: string;
}

export class PyTorchParser {
    private static readonly SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'pytorch_parser.py');
    
    static async parseFile(filePath: string): Promise<PyTorchMetadata> {
        try {
            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // 检查Python脚本是否存在
            if (!fs.existsSync(this.SCRIPT_PATH)) {
                throw new Error(`Python parser script not found: ${this.SCRIPT_PATH}`);
            }

            // 准备Python shell选项
            const options = {
                mode: 'text' as const,
                pythonPath: 'python3', // 或 'python'，取决于系统配置
                args: [filePath],
                scriptPath: path.dirname(this.SCRIPT_PATH)
            };

            // 执行Python脚本
            const results = await new Promise<string[]>((resolve, reject) => {
                const pyshell = new PythonShell(path.basename(this.SCRIPT_PATH), options);
                
                let output = '';
                pyshell.on('message', (message: string) => {
                    output += message + '\n';
                });

                pyshell.end((err: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve([output]);
                    }
                });
            });

            // 解析JSON结果
            const output = results.join('\n');
            if (!output.trim()) {
                throw new Error('No output from Python parser');
            }

            const parsed = JSON.parse(output) as PyTorchMetadata;
            
            // 验证结果
            if (parsed.error) {
                throw new Error(parsed.error);
            }

            return parsed;

        } catch (error) {
            // 如果Python解析失败，返回基本文件信息
            const stats = fs.statSync(filePath);
            return {
                tensors: [],
                metadata: {},
                file_size: stats.size,
                total_tensors: 0,
                total_parameters: 0,
                format_type: 'pytorch_pickle',
                error: error instanceof Error ? error.message : 'Unknown error parsing PyTorch file'
            };
        }
    }

    static formatSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    static formatDtype(dtype: string): string {
        // 标准化PyTorch数据类型显示
        const dtypeMap: { [key: string]: string } = {
            'torch.float32': 'F32',
            'torch.float64': 'F64',
            'torch.float16': 'F16',
            'torch.int64': 'I64',
            'torch.int32': 'I32',
            'torch.int16': 'I16',
            'torch.int8': 'I8',
            'torch.uint8': 'U8',
            'torch.bool': 'BOOL'
        };

        return dtypeMap[dtype] || dtype;
    }

    static getDtypeCategory(dtype: string): string {
        const formatted = this.formatDtype(dtype);
        if (formatted.startsWith('F')) return 'float';
        if (formatted.startsWith('I')) return 'int';
        if (formatted.startsWith('U')) return 'uint';
        if (formatted === 'BOOL') return 'bool';
        return 'other';
    }

    static calculateTotalSize(tensors: PyTorchTensorInfo[]): number {
        return tensors.reduce((sum, tensor) => sum + tensor.size_bytes, 0);
    }

    static groupTensorsByPrefix(tensors: PyTorchTensorInfo[]): { [prefix: string]: PyTorchTensorInfo[] } {
        const groups: { [prefix: string]: PyTorchTensorInfo[] } = {};
        
        tensors.forEach(tensor => {
            const parts = tensor.name.split('.');
            const prefix = parts.length > 1 ? parts[0] : 'root';
            
            if (!groups[prefix]) {
                groups[prefix] = [];
            }
            groups[prefix].push(tensor);
        });

        return groups;
    }
}
