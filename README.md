# Checkpoint Inspector

一个用于检查和查看 safetensors 文件内容的 VS Code 扩展。

## 功能特性

- 🔍 **自定义编辑器**：为 `.safetensors` 文件提供专用的查看器
- 📊 **详细信息展示**：显示每个张量的名称、数据类型、形状、元素数量和大小
- 📋 **元数据查看**：展示文件中的元数据信息
- 📏 **文件摘要**：显示文件总大小和张量总数
- 🔄 **实时刷新**：支持文件内容更新后的实时刷新
- 🚀 **大文件支持**：智能处理超过2GB的大文件，仅读取头部信息以提高性能
- ⚡ **内存优化**：流式读取，避免将整个大文件加载到内存中

## 使用方法

### 自动打开
当你在 VS Code 中打开 `.safetensors` 文件时，扩展会自动使用自定义编辑器来显示文件内容。

### 手动打开
1. 在文件资源管理器中右键点击 `.safetensors` 文件
2. 选择 "Open with Safetensors Inspector"

### 命令面板
1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS) 打开命令面板
2. 输入 "Open with Safetensors Inspector" 并选择该命令
3. 选择要检查的 safetensors 文件

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
项目包含一个测试 safetensors 文件，位于 `test-files/test.safetensors`，你可以用它来测试扩展功能。

## 许可证

MIT

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
