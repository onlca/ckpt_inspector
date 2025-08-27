import * as fs from 'fs';

export interface TensorInfo {
    name: string;
    dtype: string;
    shape: number[];
    dataOffsets: [number, number];
    sizeInBytes: number;
}

export interface SafetensorsMetadata {
    tensors: TensorInfo[];
    totalSize: number;
    metadata?: { [key: string]: any };
}

// 最大文件大小限制 (2GB)
const MAX_SAFE_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
// 头部读取的最大大小 (默认1MB应该足够大多数头部)
const MAX_HEADER_SIZE = 1024 * 1024;

export class SafetensorsParser {
    
    static async parseFile(filePath: string): Promise<SafetensorsMetadata> {
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;
        
        if (fileSize > MAX_SAFE_FILE_SIZE) {
            // 对于大文件，只读取头部信息
            return this.parseLargeFile(filePath, fileSize);
        } else {
            // 对于小文件，正常读取
            const buffer = fs.readFileSync(filePath);
            return this.parseBuffer(buffer);
        }
    }

    static async parseLargeFile(filePath: string, fileSize: number): Promise<SafetensorsMetadata> {
        const fd = fs.openSync(filePath, 'r');
        
        try {
            // 读取头部长度 (前8字节)
            const headerLengthBuffer = Buffer.alloc(8);
            fs.readSync(fd, headerLengthBuffer, 0, 8, 0);
            const headerLength = headerLengthBuffer.readBigUInt64LE(0);
            
            if (headerLength > BigInt(MAX_HEADER_SIZE) || headerLength < 0n) {
                throw new Error(`Header too large or invalid: ${headerLength} bytes. Maximum supported header size is ${MAX_HEADER_SIZE} bytes.`);
            }
            
            const headerLengthNum = Number(headerLength);
            if (fileSize < 8 + headerLengthNum) {
                throw new Error('Invalid safetensors file: header length exceeds file size');
            }

            // 读取JSON头部
            const headerBuffer = Buffer.alloc(headerLengthNum);
            fs.readSync(fd, headerBuffer, 0, headerLengthNum, 8);
            const headerJson = headerBuffer.toString('utf8');
            
            let header: any;
            try {
                header = JSON.parse(headerJson);
            } catch (error) {
                throw new Error('Invalid JSON in safetensors header: ' + (error instanceof Error ? error.message : 'Unknown JSON error'));
            }

            if (typeof header !== 'object' || header === null) {
                throw new Error('Header must be a JSON object');
            }

            const tensors: TensorInfo[] = [];
            let metadata: { [key: string]: any } | undefined;

            // 解析张量信息（不读取实际数据）
            for (const [name, info] of Object.entries(header)) {
                if (name === '__metadata__') {
                    metadata = info as { [key: string]: any };
                    continue;
                }

                const tensorInfo = info as any;
                if (!tensorInfo.dtype || !tensorInfo.shape || !tensorInfo.data_offsets) {
                    console.warn(`Skipping invalid tensor: ${name}`);
                    continue;
                }

                if (!Array.isArray(tensorInfo.shape) || !Array.isArray(tensorInfo.data_offsets)) {
                    console.warn(`Skipping tensor with invalid shape or data_offsets: ${name}`);
                    continue;
                }

                if (tensorInfo.data_offsets.length !== 2) {
                    console.warn(`Skipping tensor with invalid data_offsets length: ${name}`);
                    continue;
                }

                const [start, end] = tensorInfo.data_offsets;
                if (typeof start !== 'number' || typeof end !== 'number' || start < 0 || end <= start) {
                    console.warn(`Skipping tensor with invalid data offsets: ${name}`);
                    continue;
                }

                const sizeInBytes = end - start;
                
                tensors.push({
                    name,
                    dtype: tensorInfo.dtype,
                    shape: tensorInfo.shape,
                    dataOffsets: [start, end],
                    sizeInBytes
                });
            }

            return {
                tensors,
                totalSize: fileSize,
                metadata
            };
        } finally {
            fs.closeSync(fd);
        }
    }

    static parseBuffer(buffer: Buffer): SafetensorsMetadata {
        if (buffer.length < 8) {
            throw new Error('File too small to be a valid safetensors file');
        }

        try {
            // 读取头部长度 (小端序64位整数)
            const headerLength = buffer.readBigUInt64LE(0);
            
            if (headerLength > BigInt(buffer.length - 8) || headerLength < 0n) {
                throw new Error('Invalid safetensors file: header length is invalid');
            }

            if (buffer.length < 8 + Number(headerLength)) {
                throw new Error('Invalid safetensors file: header length exceeds file size');
            }

            // 读取JSON头部
            const headerStart = 8;
            const headerEnd = headerStart + Number(headerLength);
            const headerJson = buffer.slice(headerStart, headerEnd).toString('utf8');
            
            let header: any;
            try {
                header = JSON.parse(headerJson);
            } catch (error) {
                throw new Error('Invalid JSON in safetensors header: ' + (error instanceof Error ? error.message : 'Unknown JSON error'));
            }

            if (typeof header !== 'object' || header === null) {
                throw new Error('Header must be a JSON object');
            }

            const tensors: TensorInfo[] = [];
            let metadata: { [key: string]: any } | undefined;

            // 解析张量信息
            for (const [name, info] of Object.entries(header)) {
                if (name === '__metadata__') {
                    metadata = info as { [key: string]: any };
                    continue;
                }

                const tensorInfo = info as any;
                if (!tensorInfo.dtype || !tensorInfo.shape || !tensorInfo.data_offsets) {
                    console.warn(`Skipping invalid tensor: ${name}`);
                    continue;
                }

                if (!Array.isArray(tensorInfo.shape) || !Array.isArray(tensorInfo.data_offsets)) {
                    console.warn(`Skipping tensor with invalid shape or data_offsets: ${name}`);
                    continue;
                }

                if (tensorInfo.data_offsets.length !== 2) {
                    console.warn(`Skipping tensor with invalid data_offsets length: ${name}`);
                    continue;
                }

                const [start, end] = tensorInfo.data_offsets;
                if (typeof start !== 'number' || typeof end !== 'number' || start < 0 || end <= start) {
                    console.warn(`Skipping tensor with invalid data offsets: ${name}`);
                    continue;
                }

                const sizeInBytes = end - start;
                
                tensors.push({
                    name,
                    dtype: tensorInfo.dtype,
                    shape: tensorInfo.shape,
                    dataOffsets: [start, end],
                    sizeInBytes
                });
            }

            // 计算总大小
            const totalSize = buffer.length;

            return {
                tensors,
                totalSize,
                metadata
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Unknown error while parsing safetensors file');
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

    static calculateTensorElements(shape: number[]): number {
        return shape.reduce((acc, dim) => acc * dim, 1);
    }

    static getDtypeSize(dtype: string): number {
        const dtypeSizes: { [key: string]: number } = {
            'F64': 8, 'F32': 4, 'F16': 2,
            'I64': 8, 'I32': 4, 'I16': 2, 'I8': 1,
            'U64': 8, 'U32': 4, 'U16': 2, 'U8': 1,
            'BOOL': 1
        };
        return dtypeSizes[dtype] || 4; // 默认4字节
    }
}
