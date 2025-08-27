# Change Log

All notable changes to the "ckpt-inspector" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.1] - 2025-08-27

### Added
- 🎉 Initial release of Checkpoint Inspector
- 🔍 Custom editor for `.safetensors` files
- 📊 Display detailed tensor information including:
  - Tensor names
  - Data types (F32, F64, I64, etc.)
  - Tensor shapes and dimensions
  - Element counts
  - Memory size usage
- 📋 Metadata viewer for embedded file information
- 📏 File summary with total tensors, file size, and element count
- 🔄 Refresh functionality for updated files
- 🎨 VS Code theme-aware UI with proper color schemes
- 📱 Responsive table layout with scrollable containers
- 🏷️ Data type badges with color coding
- ⚡ Robust error handling and validation
- 🔧 Context menu integration for right-click file opening
- 🎯 Command palette support for manual file selection
- 🚀 **Large file support (>2GB)**: Smart handling of large safetensors files
- 💾 **Memory optimization**: Stream-based reading to avoid loading entire files into memory
- ⚠️ **Performance warnings**: Visual indicators for large file processing mode

### Features
- Automatic file association with `.safetensors` files
- Sorted tensor list for better organization  
- Human-readable size formatting (B, KB, MB, GB)
- Sticky table headers for better navigation
- Hover effects and improved UX
- Detailed error messages for malformed files
- **Large file detection**: Automatically switches to header-only mode for files >2GB
- **Header-only parsing**: Efficient reading of tensor metadata without loading data

### Technical
- TypeScript implementation with proper type definitions
- Modular architecture with separate parser and editor components
- VS Code Custom Editor API integration
- Buffer-based file parsing for efficient memory usage
- Comprehensive safetensors format support
- **Stream-based file I/O**: Uses fs.readSync for controlled memory usage
- **Configurable limits**: MAX_SAFE_FILE_SIZE and MAX_HEADER_SIZE constants