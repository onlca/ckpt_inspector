import * as fs from 'fs';
import * as path from 'path';

// 创建一个简单的测试safetensors文件
function createTestSafetensorsFile() {
    // 创建测试数据
    const header = {
        "tensor1": {
            "dtype": "F32",
            "shape": [2, 3],
            "data_offsets": [0, 24] // 2*3*4 = 24 bytes
        },
        "tensor2": {
            "dtype": "I64", 
            "shape": [10],
            "data_offsets": [24, 104] // 10*8 = 80 bytes, 24+80=104
        },
        "__metadata__": {
            "format": "test",
            "created_by": "ckpt-inspector test"
        }
    };
    
    const headerJson = JSON.stringify(header);
    const headerBytes = Buffer.from(headerJson, 'utf8');
    const headerLength = BigInt(headerBytes.length);
    
    // 创建假的张量数据
    const tensor1Data = Buffer.alloc(24); // 2*3*4 bytes
    const tensor2Data = Buffer.alloc(80); // 10*8 bytes
    
    // 填充一些测试数据
    for (let i = 0; i < 6; i++) {
        tensor1Data.writeFloatLE(i * 1.5, i * 4);
    }
    
    for (let i = 0; i < 10; i++) {
        tensor2Data.writeBigInt64LE(BigInt(i * 100), i * 8);
    }
    
    // 组合完整文件
    const headerLengthBuffer = Buffer.alloc(8);
    headerLengthBuffer.writeBigUInt64LE(headerLength, 0);
    
    const fullFile = Buffer.concat([
        headerLengthBuffer,
        headerBytes, 
        tensor1Data,
        tensor2Data
    ]);
    
    // 写入文件
    const testDir = path.join(__dirname, '..', 'test-files');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testFilePath = path.join(testDir, 'test.safetensors');
    fs.writeFileSync(testFilePath, fullFile);
    
    console.log(`Test safetensors file created at: ${testFilePath}`);
    return testFilePath;
}

// 如果直接运行此脚本
if (require.main === module) {
    createTestSafetensorsFile();
}

export { createTestSafetensorsFile };
