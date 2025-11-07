// Main application initialization and coordination
(function() {
    // Initialize canvas manager
    window.canvasManager = new CanvasManager('drawing-canvas', 'cursor-layer');
    
    // Initialize WebSocket manager
    window.wsManager = new WebSocketManager();
    window.wsManager.connect();
    
    // Tool selection
    const toolButtons = document.querySelectorAll('.tool-btn');
    const textOptions = document.getElementById('text-options');
    
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Skip if it's the image input button
            if (btn.id === 'image-tool') {
                return; // Image tool is handled separately
            }
            
            toolButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tool = btn.getAttribute('data-tool');
            window.canvasManager.setTool(tool);
            
            // Show/hide text options
            if (textOptions) {
                if (tool === 'text') {
                    textOptions.style.display = 'block';
                } else {
                    textOptions.style.display = 'none';
                }
            }
        });
    });
    
    // Image tool handler
    const imageTool = document.getElementById('image-tool');
    const imageInput = document.getElementById('image-input');
    if (imageTool && imageInput) {
        imageTool.addEventListener('click', () => {
            toolButtons.forEach(b => b.classList.remove('active'));
            imageTool.classList.add('active');
            window.canvasManager.setTool('image');
            imageInput.click();
        });
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                    const canvas = document.getElementById('drawing-canvas');
                    const rect = canvas.getBoundingClientRect();
                    const x = rect.width / 2;
                    const y = rect.height / 2;
                    window.canvasManager.addImage(x, y, loadEvent.target.result);
                };
                reader.readAsDataURL(file);
            }
            // Reset input so same file can be selected again
            e.target.value = '';
        });
    }
    
    // Color picker
    const colorInput = document.getElementById('color-input');
    colorInput.addEventListener('change', (e) => {
        window.canvasManager.setColor(e.target.value);
    });
    
    // Color presets
    const colorPresets = document.querySelectorAll('.color-preset');
    colorPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.getAttribute('data-color');
            window.canvasManager.setColor(color);
            colorInput.value = color;
        });
    });
    
    // Brush size
    const brushSize = document.getElementById('brush-size');
    const brushSizeValue = document.getElementById('brush-size-value');
    brushSize.addEventListener('input', (e) => {
        const size = parseInt(e.target.value);
        window.canvasManager.setLineWidth(size);
        brushSizeValue.textContent = size + 'px';
    });
    
    // Font size for text tool
    const fontSize = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    if (fontSize && fontSizeValue) {
        fontSize.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            window.canvasManager.setFontSize(size);
            fontSizeValue.textContent = size + 'px';
        });
    }
    
    // Undo/Redo buttons
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    undoBtn.addEventListener('click', () => {
        window.wsManager.undo();
    });
    
    redoBtn.addEventListener('click', () => {
        window.wsManager.redo();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z or Cmd+Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            window.wsManager.undo();
        }
        // Ctrl+Shift+Z or Cmd+Shift+Z for redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
            e.preventDefault();
            window.wsManager.redo();
        }
    });
    
    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire canvas?')) {
            window.canvasManager.clear();
            // Note: In a full implementation, you'd also notify the server
        }
    });
    
    // Track cursor movement for remote cursor display
    const canvas = document.getElementById('drawing-canvas');
    canvas.addEventListener('mousemove', (e) => {
        if (window.wsManager && window.wsManager.connected) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            window.wsManager.socket.emit('cursor-move', { x, y });
        }
    });
    
    console.log('Collaborative Canvas initialized');
})();

