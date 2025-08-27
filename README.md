# Checkpoint Inspector

一个用于检查和查看 safetensors 和 PyTorch 模型文件内容的 VS Code 扩展。

## 功能特性

- 🔍 **自定义编辑器**：为 `.safetensors` 和 `.pt/.pth` 文件提供专用的查看器
- 📊 **详细信息展示**：显示每个张量的名称、数据类型、形状、元素数量和大小
- 📋 **元数据查看**：展示文件中的元数据信息
- 📏 **文件摘要**：显示文件总大小和张量总数
- 🔄 **实时刷新**：支持文件内容更新后的实时刷新
- 🚀 **大文件支持**：智能处理超过2GB的大文件，仅读取头部信息以提高性能
- ⚡ **内存优化**：流式读取，避免将整个大文件加载到内存中
- 🔥 **PyTorch支持**：完整支持PyTorch pickle格式的模型文件
- 🛠️ **智能错误处理**：友好的错误信息和安装指导

## 使用方法

### 自动打开
当你在 VS Code 中打开 `.safetensors`、`.pt` 或 `.pth` 文件时，扩展会自动使用相应的自定义编辑器来显示文件内容。

### 手动打开
1. 在文件资源管理器中右键点击模型文件
2. 选择 "Open with Safetensors Inspector" 或 "Open with PyTorch Inspector"

### 命令面板
1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS) 打开命令面板
2. 输入相应的检查器命令并选择
3. 选择要检查的模型文件

## 支持的文件格式

### Safetensors (.safetensors)
- 高效的张量存储格式
- 内置元数据支持
- 大文件优化处理

### PyTorch (.pt, .pth)
- 标准PyTorch pickle格式
- 支持完整的checkpoint文件
- 支持state_dict文件
- 支持单个张量文件
- 训练状态和超参数显示

## 显示信息

扩展会显示以下信息：

### 文件摘要
- 张量总数
- 文件大小
- 元素总数

### 张量详情表格
- **名称**：张量的名称
- **数据类型**：数据类型（如 F32, I64, F16 等）
- **形状**：张量的维度
- **元素数量**：张量中元素的总数
- **大小**：张量数据的字节大小

### 元数据
- 显示文件中包含的所有元数据信息

### 大文件处理
- 自动检测超过2GB的大文件
- 显示性能警告和模式指示器
- 仅读取头部信息，不加载实际张量数据到内存

## 系统要求

### 基本要求
- VS Code 1.103.0 或更高版本

### PyTorch 文件支持
要查看 `.pt/.pth` 文件，需要：
- Python 3.6 或更高版本
- PyTorch 库 (`pip install torch`)

如果没有安装 PyTorch，扩展会显示友好的安装指导。

## 支持的数据类型

- F64, F32, F16 (浮点数)
- I64, I32, I16, I8 (有符号整数)
- U64, U32, U16, U8 (无符号整数)
- BOOL (布尔值)

## 开发

### 运行扩展
1. 在 VS Code 中打开项目
2. 按 `F5` 启动新的扩展开发主机窗口
3. 在新窗口中打开包含 safetensors 文件的文件夹

### 构建
```bash
npm run compile
```

### 监视模式
```bash
npm run watch
```

### 测试
项目包含测试文件：
- `test-files/test.safetensors` - Safetensors 格式测试文件
- `test-files/test.pt` - PyTorch 格式测试文件

你可以用这些文件来测试扩展功能。

## 故障排除

### PyTorch 文件无法打开
1. 确保已安装 Python 3
2. 安装 PyTorch: `pip install torch`
3. 检查文件是否为有效的 PyTorch pickle 文件

### 大文件处理慢
- 对于超过2GB的文件，扩展会自动启用头部模式
- 这是正常行为，用于避免内存问题

## 许可证

MIT