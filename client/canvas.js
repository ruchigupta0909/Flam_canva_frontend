// Canvas drawing operations and state management
class CanvasManager {
    constructor(canvasId, cursorLayerId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cursorLayer = document.getElementById(cursorLayerId);
        this.cursorCtx = this.cursorLayer.getContext('2d');
        
        this.isDrawing = false;
        this.currentStroke = null;
        this.strokes = new Map(); // strokeId -> stroke data
        this.shapes = new Map(); // shapeId -> shape data (rectangles, circles, lines)
        this.texts = new Map(); // textId -> text data
        this.images = new Map(); // imageId -> image data
        this.remoteCursors = new Map(); // userId -> cursor data
        
        this.tool = 'brush';
        this.color = '#000000';
        this.lineWidth = 5;
        this.fontSize = 24;
        this.startPoint = null;
        
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        // Set canvas size to match container
        const resize = () => {
            const container = this.canvas.parentElement;
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            this.canvas.width = width;
            this.canvas.height = height;
            this.cursorLayer.width = width;
            this.cursorLayer.height = height;
            
            // Redraw all strokes after resize
            this.redraw();
        };
        
        resize();
        window.addEventListener('resize', resize);
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        const coords = this.getCanvasCoordinates(e);
        this.startPoint = coords;
        
        // Handle different tools
        if (this.tool === 'text') {
            this.startTextInput(coords);
            return;
        }
        
        if (this.tool === 'image') {
            document.getElementById('image-input').click();
            return;
        }
        
        // For shape tools (rectangle, circle, line), we need to track start and end
        if (['rectangle', 'circle', 'line'].includes(this.tool)) {
            this.isDrawing = true;
            const shapeId = `shape-${Date.now()}-${Math.random()}`;
            this.currentStroke = {
                id: shapeId,
                startX: coords.x,
                startY: coords.y,
                endX: coords.x,
                endY: coords.y,
                color: this.color,
                lineWidth: this.lineWidth,
                tool: this.tool
            };
            return;
        }
        
        // For brush and eraser (original behavior)
        this.isDrawing = true;
        const strokeId = `local-${Date.now()}-${Math.random()}`;
        this.currentStroke = {
            id: strokeId,
            points: [coords],
            color: this.tool === 'eraser' ? '#FFFFFF' : this.color,
            lineWidth: this.lineWidth,
            tool: this.tool
        };
        
        this.strokes.set(strokeId, this.currentStroke);
        
        // Notify WebSocket manager
        if (window.wsManager) {
            window.wsManager.startDrawing(coords, strokeId);
        }
        
        this.drawPoint(coords, this.currentStroke);
    }

    draw(e) {
        if (!this.isDrawing || !this.currentStroke) return;
        
        const coords = this.getCanvasCoordinates(e);
        
        // Handle shape tools (preview while drawing)
        if (['rectangle', 'circle', 'line'].includes(this.tool)) {
            this.currentStroke.endX = coords.x;
            this.currentStroke.endY = coords.y;
            // Redraw to show preview
            this.redraw();
            this.drawShapePreview(this.currentStroke);
            return;
        }
        
        // For brush and eraser (original behavior)
        this.currentStroke.points.push(coords);
        
        // Draw line segment
        const lastPoint = this.currentStroke.points[this.currentStroke.points.length - 2];
        this.drawLine(lastPoint, coords, this.currentStroke);
        
        // Notify WebSocket manager
        if (window.wsManager) {
            window.wsManager.drawMove(coords, this.currentStroke.id);
        }
    }

    stopDrawing() {
        if (!this.isDrawing || !this.currentStroke) return;
        
        // Handle shape tools - finalize the shape
        if (['rectangle', 'circle', 'line'].includes(this.tool)) {
            const shape = {
                id: this.currentStroke.id,
                startX: this.currentStroke.startX,
                startY: this.currentStroke.startY,
                endX: this.currentStroke.endX,
                endY: this.currentStroke.endY,
                color: this.currentStroke.color,
                lineWidth: this.currentStroke.lineWidth,
                tool: this.currentStroke.tool
            };
            
            this.shapes.set(shape.id, shape);
            
            // Notify WebSocket manager
            if (window.wsManager) {
                window.wsManager.drawShape(shape);
            }
            
            this.redraw();
        } else if (this.currentStroke && window.wsManager) {
            // For brush and eraser
            window.wsManager.endDrawing(this.currentStroke.id);
        }
        
        this.isDrawing = false;
        this.currentStroke = null;
        this.startPoint = null;
    }

    drawPoint(point, stroke) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, stroke.lineWidth / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = stroke.color;
        this.ctx.fill();
    }

    drawLine(from, to, stroke) {
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineWidth = stroke.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (stroke.tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        this.ctx.stroke();
        this.ctx.globalCompositeOperation = 'source-over';
    }

    // Remote drawing methods
    remoteDrawStart(data) {
        const stroke = {
            id: data.strokeId,
            points: [{ x: data.x, y: data.y }],
            color: data.tool === 'eraser' ? '#FFFFFF' : data.color,
            lineWidth: data.lineWidth,
            tool: data.tool,
            userId: data.userId
        };
        
        this.strokes.set(data.strokeId, stroke);
        this.drawPoint({ x: data.x, y: data.y }, stroke);
    }

    remoteDrawMove(data) {
        const stroke = this.strokes.get(data.strokeId);
        if (!stroke) return;
        
        const newPoint = { x: data.x, y: data.y };
        stroke.points.push(newPoint);
        
        if (stroke.points.length >= 2) {
            const lastPoint = stroke.points[stroke.points.length - 2];
            this.drawLine(lastPoint, newPoint, stroke);
        }
    }

    remoteDrawEnd(data) {
        // Stroke is already complete, no action needed
    }

    // Update remote cursor position
    updateRemoteCursor(userId, x, y, color) {
        this.remoteCursors.set(userId, { x, y, color });
        this.drawCursors();
    }

    drawCursors() {
        // Clear cursor layer
        this.cursorCtx.clearRect(0, 0, this.cursorLayer.width, this.cursorLayer.height);
        
        // Draw all remote cursors
        this.remoteCursors.forEach((cursor, userId) => {
            this.cursorCtx.beginPath();
            this.cursorCtx.arc(cursor.x, cursor.y, 10, 0, Math.PI * 2);
            this.cursorCtx.strokeStyle = cursor.color;
            this.cursorCtx.lineWidth = 2;
            this.cursorCtx.stroke();
            
            this.cursorCtx.beginPath();
            this.cursorCtx.arc(cursor.x, cursor.y, 3, 0, Math.PI * 2);
            this.cursorCtx.fillStyle = cursor.color;
            this.cursorCtx.fill();
        });
    }

    // Undo/Redo operations
    undoStroke(strokeId) {
        const stroke = this.strokes.get(strokeId);
        if (stroke) {
            this.strokes.delete(strokeId);
            this.redraw();
        }
    }

    redoStroke(strokeData) {
        // Convert server stroke format to client format
        const stroke = {
            id: strokeData.id,
            points: strokeData.points || [],
            color: strokeData.color,
            lineWidth: strokeData.lineWidth,
            tool: strokeData.tool,
            userId: strokeData.userId
        };
        this.strokes.set(stroke.id, stroke);
        this.redrawStroke(stroke);
    }

    // Redraw entire canvas
    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Redraw all images first (background layer)
        this.images.forEach(image => {
            this.redrawImage(image);
        });
        
        // Redraw all strokes
        this.strokes.forEach(stroke => {
            this.redrawStroke(stroke);
        });
        
        // Redraw all shapes
        this.shapes.forEach(shape => {
            this.redrawShape(shape);
        });
        
        // Redraw all texts
        this.texts.forEach(text => {
            this.redrawText(text);
        });
    }

    redrawStroke(stroke) {
        if (stroke.points.length === 0) return;
        
        // Draw first point
        this.drawPoint(stroke.points[0], stroke);
        
        // Draw lines between points
        for (let i = 1; i < stroke.points.length; i++) {
            this.drawLine(stroke.points[i - 1], stroke.points[i], stroke);
        }
    }

    // Load canvas state from server
    loadState(history, currentState) {
        this.strokes.clear();
        
        // Add all strokes from history
        history.forEach(strokeData => {
            const stroke = {
                id: strokeData.id,
                points: strokeData.points,
                color: strokeData.color,
                lineWidth: strokeData.lineWidth,
                tool: strokeData.tool,
                userId: strokeData.userId
            };
            this.strokes.set(stroke.id, stroke);
        });
        
        this.redraw();
    }

    // Clear canvas
    clear() {
        this.strokes.clear();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Set tool
    setTool(tool) {
        this.tool = tool;
    }

    // Set color
    setColor(color) {
        this.color = color;
    }

    // Set line width
    setLineWidth(width) {
        this.lineWidth = width;
    }

    // Set font size
    setFontSize(size) {
        this.fontSize = size;
    }

    // Shape drawing methods
    drawShapePreview(shape) {
        if (shape.tool === 'rectangle') {
            const x = Math.min(shape.startX, shape.endX);
            const y = Math.min(shape.startY, shape.endY);
            const width = Math.abs(shape.endX - shape.startX);
            const height = Math.abs(shape.endY - shape.startY);
            
            this.ctx.strokeStyle = shape.color;
            this.ctx.lineWidth = shape.lineWidth;
            this.ctx.strokeRect(x, y, width, height);
        } else if (shape.tool === 'circle') {
            const centerX = (shape.startX + shape.endX) / 2;
            const centerY = (shape.startY + shape.endY) / 2;
            const radiusX = Math.abs(shape.endX - shape.startX) / 2;
            const radiusY = Math.abs(shape.endY - shape.startY) / 2;
            const radius = Math.max(radiusX, radiusY);
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = shape.color;
            this.ctx.lineWidth = shape.lineWidth;
            this.ctx.stroke();
        } else if (shape.tool === 'line') {
            this.ctx.beginPath();
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.strokeStyle = shape.color;
            this.ctx.lineWidth = shape.lineWidth;
            this.ctx.stroke();
        }
    }

    redrawShape(shape) {
        if (shape.tool === 'rectangle') {
            const x = Math.min(shape.startX, shape.endX);
            const y = Math.min(shape.startY, shape.endY);
            const width = Math.abs(shape.endX - shape.startX);
            const height = Math.abs(shape.endY - shape.startY);
            
            this.ctx.strokeStyle = shape.color;
            this.ctx.lineWidth = shape.lineWidth;
            this.ctx.strokeRect(x, y, width, height);
        } else if (shape.tool === 'circle') {
            const centerX = (shape.startX + shape.endX) / 2;
            const centerY = (shape.startY + shape.endY) / 2;
            const radiusX = Math.abs(shape.endX - shape.startX) / 2;
            const radiusY = Math.abs(shape.endY - shape.startY) / 2;
            const radius = Math.max(radiusX, radiusY);
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = shape.color;
            this.ctx.lineWidth = shape.lineWidth;
            this.ctx.stroke();
        } else if (shape.tool === 'line') {
            this.ctx.beginPath();
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.strokeStyle = shape.color;
            this.ctx.lineWidth = shape.lineWidth;
            this.ctx.stroke();
        }
    }

    // Text methods
    startTextInput(coords) {
        const textInput = document.getElementById('text-input');
        if (textInput) {
            // Position input near click location (optional - can be improved)
            textInput.focus();
            textInput.onblur = () => {
                if (textInput.value.trim()) {
                    this.addText(coords.x, coords.y, textInput.value);
                }
                textInput.value = '';
            };
            textInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    if (textInput.value.trim()) {
                        this.addText(coords.x, coords.y, textInput.value);
                    }
                    textInput.value = '';
                    textInput.blur();
                } else if (e.key === 'Escape') {
                    textInput.value = '';
                    textInput.blur();
                }
            };
        }
    }

    addText(x, y, text) {
        const textId = `text-${Date.now()}-${Math.random()}`;
        const textData = {
            id: textId,
            x: x,
            y: y,
            text: text,
            color: this.color,
            fontSize: this.fontSize
        };
        
        this.texts.set(textId, textData);
        this.redraw();
        
        // Notify WebSocket manager
        if (window.wsManager) {
            window.wsManager.drawText(textData);
        }
    }

    redrawText(text) {
        this.ctx.fillStyle = text.color;
        this.ctx.font = `${text.fontSize}px Arial`;
        this.ctx.fillText(text.text, text.x, text.y);
    }

    // Image methods
    addImage(x, y, imageData) {
        const imageId = `image-${Date.now()}-${Math.random()}`;
        const img = new Image();
        img.onload = () => {
            const imageObj = {
                id: imageId,
                x: x,
                y: y,
                width: img.width,
                height: img.height,
                data: imageData
            };
            
            this.images.set(imageId, imageObj);
            this.redraw();
            
            // Notify WebSocket manager
            if (window.wsManager) {
                window.wsManager.drawImage(imageObj);
            }
        };
        img.src = imageData;
    }

    redrawImage(image) {
        if (!image.data) return;
        const img = new Image();
        img.onload = () => {
            this.ctx.drawImage(img, image.x, image.y, image.width, image.height);
        };
        img.onerror = () => {
            console.error('Failed to load image:', image.id);
        };
        img.src = image.data;
    }

    // Remote shape methods
    remoteDrawShape(shapeData) {
        this.shapes.set(shapeData.id, shapeData);
        this.redraw();
    }

    remoteDrawText(textData) {
        this.texts.set(textData.id, textData);
        this.redraw();
    }

    remoteDrawImage(imageData) {
        this.images.set(imageData.id, imageData);
        this.redraw();
    }

    // Update loadState to handle shapes, texts, and images
    loadState(history, currentState) {
        this.strokes.clear();
        this.shapes.clear();
        this.texts.clear();
        this.images.clear();
        
        // Add all strokes from history
        history.forEach(strokeData => {
            if (strokeData.type === 'shape') {
                this.shapes.set(strokeData.id, strokeData);
            } else if (strokeData.type === 'text') {
                this.texts.set(strokeData.id, strokeData);
            } else if (strokeData.type === 'image') {
                this.images.set(strokeData.id, strokeData);
            } else {
                const stroke = {
                    id: strokeData.id,
                    points: strokeData.points,
                    color: strokeData.color,
                    lineWidth: strokeData.lineWidth,
                    tool: strokeData.tool,
                    userId: strokeData.userId
                };
                this.strokes.set(stroke.id, stroke);
            }
        });
        
        this.redraw();
    }

    // Clear canvas
    clear() {
        this.strokes.clear();
        this.shapes.clear();
        this.texts.clear();
        this.images.clear();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Export canvas state for saving
    exportState() {
        return {
            strokes: Array.from(this.strokes.values()),
            shapes: Array.from(this.shapes.values()),
            texts: Array.from(this.texts.values()),
            images: Array.from(this.images.values()),
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            timestamp: Date.now()
        };
    }

    // Import canvas state for loading
    importState(state) {
        if (!state) return false;

        // Clear current canvas
        this.clear();

        // Restore canvas dimensions if provided
        if (state.canvasWidth && state.canvasHeight) {
            this.canvas.width = state.canvasWidth;
            this.canvas.height = state.canvasHeight;
            this.cursorLayer.width = state.canvasWidth;
            this.cursorLayer.height = state.canvasHeight;
        }

        // Restore strokes
        if (state.strokes && Array.isArray(state.strokes)) {
            state.strokes.forEach(stroke => {
                this.strokes.set(stroke.id, stroke);
            });
        }

        // Restore shapes
        if (state.shapes && Array.isArray(state.shapes)) {
            state.shapes.forEach(shape => {
                this.shapes.set(shape.id, shape);
            });
        }

        // Restore texts
        if (state.texts && Array.isArray(state.texts)) {
            state.texts.forEach(text => {
                this.texts.set(text.id, text);
            });
        }

        // Restore images
        if (state.images && Array.isArray(state.images)) {
            state.images.forEach(image => {
                this.images.set(image.id, image);
            });
        }

        // Redraw everything
        this.redraw();

        return true;
    }

    // Export canvas as PNG image
    exportAsPNG() {
        // Create a temporary canvas to render everything
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Fill with white background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Collect all image loading promises
        const imagePromises = [];
        const imageMap = new Map();

        // Load all images
        this.images.forEach(image => {
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    imageMap.set(image.id, img);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = image.data;
            });
            imagePromises.push(promise);
        });

        // Wait for all images to load, then draw everything
        Promise.all(imagePromises).then(() => {
            // Draw all images first (background layer)
            this.images.forEach(image => {
                const img = imageMap.get(image.id);
                if (img) {
                    tempCtx.drawImage(img, image.x, image.y, image.width, image.height);
                }
            });

            // Draw all strokes
            this.strokes.forEach(stroke => {
                this.drawStrokeOnContext(tempCtx, stroke);
            });

            // Draw all shapes
            this.shapes.forEach(shape => {
                this.drawShapeOnContext(tempCtx, shape);
            });

            // Draw all texts
            this.texts.forEach(text => {
                tempCtx.fillStyle = text.color;
                tempCtx.font = `${text.fontSize}px Arial`;
                tempCtx.fillText(text.text, text.x, text.y);
            });

            // Export as PNG
            const dataURL = tempCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `canvas-${Date.now()}.png`;
            link.href = dataURL;
            link.click();
        }).catch(error => {
            console.error('Error exporting canvas:', error);
            alert('Error exporting canvas. Please try again.');
        });

        // If no images, export immediately
        if (this.images.size === 0) {
            // Draw all strokes
            this.strokes.forEach(stroke => {
                this.drawStrokeOnContext(tempCtx, stroke);
            });

            // Draw all shapes
            this.shapes.forEach(shape => {
                this.drawShapeOnContext(tempCtx, shape);
            });

            // Draw all texts
            this.texts.forEach(text => {
                tempCtx.fillStyle = text.color;
                tempCtx.font = `${text.fontSize}px Arial`;
                tempCtx.fillText(text.text, text.x, text.y);
            });

            // Export as PNG
            const dataURL = tempCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `canvas-${Date.now()}.png`;
            link.href = dataURL;
            link.click();
        }
    }

    // Helper method to draw stroke on any context
    drawStrokeOnContext(ctx, stroke) {
        if (!stroke.points || stroke.points.length === 0) return;

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }

        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }

    // Helper method to draw shape on any context
    drawShapeOnContext(ctx, shape) {
        if (shape.tool === 'rectangle') {
            const x = Math.min(shape.startX, shape.endX);
            const y = Math.min(shape.startY, shape.endY);
            const width = Math.abs(shape.endX - shape.startX);
            const height = Math.abs(shape.endY - shape.startY);
            
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = shape.lineWidth;
            ctx.strokeRect(x, y, width, height);
        } else if (shape.tool === 'circle') {
            const centerX = (shape.startX + shape.endX) / 2;
            const centerY = (shape.startY + shape.endY) / 2;
            const radiusX = Math.abs(shape.endX - shape.startX) / 2;
            const radiusY = Math.abs(shape.endY - shape.startY) / 2;
            const radius = Math.max(radiusX, radiusY);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = shape.lineWidth;
            ctx.stroke();
        } else if (shape.tool === 'line') {
            ctx.beginPath();
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.endX, shape.endY);
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = shape.lineWidth;
            ctx.stroke();
        }
    }
}

