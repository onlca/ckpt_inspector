#!/usr/bin/env python3
"""
创建测试PyTorch模型文件
"""

import torch
import torch.nn as nn
import os

def create_test_pytorch_model():
    """创建一个简单的测试模型"""
    
    # 定义一个简单的神经网络
    class SimpleModel(nn.Module):
        def __init__(self):
            super(SimpleModel, self).__init__()
            self.linear1 = nn.Linear(784, 128)
            self.linear2 = nn.Linear(128, 64)
            self.linear3 = nn.Linear(64, 10)
            self.relu = nn.ReLU()
            self.dropout = nn.Dropout(0.2)
            
        def forward(self, x):
            x = self.relu(self.linear1(x))
            x = self.dropout(x)
            x = self.relu(self.linear2(x))
            x = self.dropout(x)
            x = self.linear3(x)
            return x
    
    # 创建模型实例
    model = SimpleModel()
    
    # 创建优化器
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    # 模拟训练状态
    checkpoint = {
        'epoch': 50,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': 0.1234,
        'accuracy': 0.9876,
        'hyperparameters': {
            'batch_size': 32,
            'learning_rate': 0.001,
            'hidden_size': 128
        },
        'model_info': {
            'architecture': 'SimpleModel',
            'total_params': sum(p.numel() for p in model.parameters()),
            'trainable_params': sum(p.numel() for p in model.parameters() if p.requires_grad)
        }
    }
    
    # 创建test-files目录
    os.makedirs('test-files', exist_ok=True)
    
    # 保存完整的checkpoint
    torch.save(checkpoint, 'test-files/test_model.pt')
    
    # 保存仅包含模型状态的文件
    torch.save(model.state_dict(), 'test-files/test_state_dict.pt')
    
    # 保存单个张量
    sample_tensor = torch.randn(100, 784)
    torch.save(sample_tensor, 'test-files/test_tensor.pt')
    
    print("Created test PyTorch files:")
    print("- test-files/test_model.pt (full checkpoint)")
    print("- test-files/test_state_dict.pt (state dict only)")
    print("- test-files/test_tensor.pt (single tensor)")

if __name__ == '__main__':
    create_test_pytorch_model()
