#!/usr/bin/env python3
"""
PyTorch模型文件解析器
用于提取.pt/.pth文件中的张量信息和元数据
"""

import sys
import json
from pathlib import Path

# 尝试导入torch，如果失败则提供友好的错误信息
try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None

import traceback

def get_tensor_info(tensor, name):
    """提取张量信息"""
    try:
        shape = list(tensor.shape) if hasattr(tensor, 'shape') else []
        dtype = str(tensor.dtype) if hasattr(tensor, 'dtype') else 'unknown'
        
        # 计算元素数量
        numel = tensor.numel() if hasattr(tensor, 'numel') else 0
        
        # 计算字节大小
        element_size = tensor.element_size() if hasattr(tensor, 'element_size') else 4
        size_bytes = numel * element_size
        
        return {
            'name': name,
            'dtype': dtype,
            'shape': shape,
            'numel': numel,
            'size_bytes': size_bytes,
            'device': str(tensor.device) if hasattr(tensor, 'device') else 'unknown'
        }
    except Exception as e:
        return {
            'name': name,
            'dtype': 'error',
            'shape': [],
            'numel': 0,
            'size_bytes': 0,
            'device': 'unknown',
            'error': str(e)
        }

def parse_state_dict(obj, prefix=''):
    """递归解析状态字典"""
    tensors = []
    metadata = {}
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            full_key = f"{prefix}.{key}" if prefix else key
            
            if torch.is_tensor(value):
                tensor_info = get_tensor_info(value, full_key)
                tensors.append(tensor_info)
            elif isinstance(value, dict):
                # 递归处理嵌套字典
                sub_tensors, sub_metadata = parse_state_dict(value, full_key)
                tensors.extend(sub_tensors)
                if sub_metadata:
                    metadata[full_key] = sub_metadata
            elif isinstance(value, (str, int, float, bool, list)):
                # 保存简单的元数据
                metadata[full_key] = value
            else:
                # 其他类型转换为字符串
                metadata[full_key] = str(type(value).__name__)
    
    return tensors, metadata

def analyze_pytorch_file(file_path):
    """分析PyTorch模型文件"""
    
    if not TORCH_AVAILABLE:
        return {
            'error': 'PyTorch is not installed. Please install PyTorch: pip install torch',
            'file_size': Path(file_path).stat().st_size if Path(file_path).exists() else 0,
            'suggestions': [
                'Install PyTorch: pip install torch',
                'Install PyTorch with conda: conda install pytorch',
                'Check PyTorch installation guide: https://pytorch.org/get-started/locally/'
            ]
        }
    
    try:
        # 获取文件大小
        file_size = Path(file_path).stat().st_size
        
        # 加载模型
        try:
            # 首先尝试加载到CPU避免CUDA问题
            checkpoint = torch.load(file_path, map_location='cpu')
        except Exception as e:
            return {
                'error': f'Failed to load PyTorch file: {str(e)}',
                'file_size': file_size
            }
        
        tensors = []
        metadata = {}
        
        # 分析不同类型的checkpoint格式
        if isinstance(checkpoint, dict):
            if 'state_dict' in checkpoint:
                # 标准训练checkpoint格式
                state_dict = checkpoint['state_dict']
                tensors, state_metadata = parse_state_dict(state_dict)
                
                # 提取其他元数据
                for key, value in checkpoint.items():
                    if key != 'state_dict':
                        if isinstance(value, (str, int, float, bool, list)):
                            metadata[key] = value
                        else:
                            metadata[key] = str(type(value).__name__)
            else:
                # 直接的state_dict或其他格式
                tensors, metadata = parse_state_dict(checkpoint)
        elif torch.is_tensor(checkpoint):
            # 单个张量文件
            tensor_info = get_tensor_info(checkpoint, 'tensor')
            tensors = [tensor_info]
        else:
            metadata['type'] = str(type(checkpoint).__name__)
            metadata['content'] = str(checkpoint)[:1000]  # 限制长度
        
        return {
            'tensors': tensors,
            'metadata': metadata,
            'file_size': file_size,
            'total_tensors': len(tensors),
            'total_parameters': sum(t['numel'] for t in tensors),
            'format_type': 'pytorch_pickle'
        }
        
    except Exception as e:
        return {
            'error': f'Error analyzing file: {str(e)}',
            'traceback': traceback.format_exc(),
            'file_size': Path(file_path).stat().st_size if Path(file_path).exists() else 0
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python pytorch_parser.py <file_path>'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not Path(file_path).exists():
        print(json.dumps({'error': f'File not found: {file_path}'}))
        sys.exit(1)
    
    result = analyze_pytorch_file(file_path)
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
