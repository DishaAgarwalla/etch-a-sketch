// ============================================
// PIXEL CANVAS - BEAUTIFUL ETCH-A-SKETCH
// ============================================

console.log("🎨 Pixel Canvas loaded!");

class PixelCanvas {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.startAnimationLoop();
    }
    
    init() {
        // Canvas setup
        this.canvas = document.getElementById('drawing-canvas');
        this.gridCanvas = document.getElementById('grid-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridCtx = this.gridCanvas.getContext('2d');
        
        // State
        this.currentColor = '#FF6B6B';
        this.brushSize = 3;
        this.opacity = 100;
        this.isDrawing = false;
        this.gridSize = 16;
        this.showGrid = true;
        
        // Tools
        this.currentTool = 'freehand';
        this.colorMode = 'solid';
        
        // Stats
        this.pixelsDrawn = 0;
        this.brushStrokes = 0;
        this.sessionStart = Date.now();
        
        // History
        this.history = [];
        this.historyIndex = -1;
        
        // Initialize
        this.setupCanvas();
        this.drawGrid();
        this.updateUI();
        this.setupColorHistory();
    }

    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 800;
        this.gridCanvas.width = 800;
        this.gridCanvas.height = 800;
        
        // Set background
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
        
        if (!this.showGrid) return;
        
        const cellSize = this.canvas.width / this.gridSize;
        
        this.gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.gridCtx.lineWidth = 1;
        
        // Draw grid lines
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * cellSize;
            
            // Vertical lines
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(pos, 0);
            this.gridCtx.lineTo(pos, this.canvas.height);
            this.gridCtx.stroke();
            
            // Horizontal lines
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(0, pos);
            this.gridCtx.lineTo(this.canvas.width, pos);
            this.gridCtx.stroke();
        }
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDrawing({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.draw({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        });
        
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Color selection
        document.querySelectorAll('.color-circle').forEach(circle => {
            circle.addEventListener('click', (e) => {
                this.setColor(e.target.dataset.color || e.target.parentElement.dataset.color);
                document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Custom color
        document.getElementById('custom-color').addEventListener('input', (e) => {
            this.setColor(e.target.value);
        });
        
        // Color modes
        document.querySelectorAll('.color-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.colorMode = e.currentTarget.dataset.mode;
                document.querySelectorAll('.color-mode-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updateColorPreview();
            });
        });
        
        // Drawing modes
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentTool = e.currentTarget.dataset.mode;
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        
        // Brush size
        document.getElementById('brush-size').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brush-value').textContent = `${this.brushSize}px`;
            document.getElementById('brush-size-display').textContent = `${this.brushSize}px`;
        });
        
        // Opacity
        document.getElementById('opacity-slider').addEventListener('input', (e) => {
            this.opacity = parseInt(e.target.value);
            document.getElementById('opacity-value').textContent = `${this.opacity}%`;
        });
        
        // Grid size
        document.querySelectorAll('.grid-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.gridSize = parseInt(e.currentTarget.dataset.size);
                document.querySelectorAll('.grid-preset').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.getElementById('grid-size-display').textContent = `${this.gridSize}×${this.gridSize}`;
                this.drawGrid();
            });
        });
        
        // Grid toggle
        document.getElementById('grid-toggle').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
            this.drawGrid();
        });
        
        // Action buttons
        document.getElementById('clear-canvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('undo-action').addEventListener('click', () => this.undo());
        document.getElementById('redo-action').addEventListener('click', () => this.redo());
        document.getElementById('save-art').addEventListener('click', () => this.saveArt());
        
        // Effects
        document.querySelectorAll('.effect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyEffect(e.currentTarget.dataset.effect);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.stopDrawing();
            if (e.ctrlKey && e.key === 'z') this.undo();
            if (e.ctrlKey && e.key === 'y') this.redo();
            if (e.key === 'c') this.clearCanvas();
        });
        
        // Mouse coordinate tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / (rect.width / this.gridSize));
            const y = Math.floor((e.clientY - rect.top) / (rect.height / this.gridSize));
            document.getElementById('coordinates').textContent = `X: ${x}, Y: ${y}`;
        });
    }

    setColor(color) {
        this.currentColor = color;
        this.updateColorPreview();
        this.addToColorHistory(color);
    }

    updateColorPreview() {
        const preview = document.getElementById('current-color-preview');
        const code = document.getElementById('current-color-code');
        
        preview.style.background = this.getCurrentColor();
        code.textContent = this.currentColor;
    }

    getCurrentColor() {
        if (this.colorMode === 'rainbow') {
            return `hsl(${Math.random() * 360}, 80%, 60%)`;
        }
        if (this.colorMode === 'gradient') {
            const gradient = Math.sin(Date.now() / 1000) * 0.5 + 0.5;
            return `hsl(${gradient * 360}, 80%, 60%)`;
        }
        return this.currentColor;
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.saveState();
        
        const { x, y } = this.getCanvasCoordinates(e);
        this.lastX = x;
        this.lastY = y;
        
        if (this.currentTool === 'fill') {
            this.floodFill(x, y);
        } else {
            this.drawPoint(x, y);
        }
    }

    draw(e) {
        if (!this.isDrawing || this.currentTool === 'fill') return;
        
        const { x, y } = this.getCanvasCoordinates(e);
        
        if (this.currentTool === 'freehand') {
            this.drawLine(this.lastX, this.lastY, x, y);
            this.lastX = x;
            this.lastY = y;
        }
    }

    stopDrawing() {
        this.isDrawing = false;
        this.brushStrokes++;
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    drawPoint(x, y) {
        this.ctx.save();
        this.ctx.globalAlpha = this.opacity / 100;
        this.ctx.fillStyle = this.getCurrentColor();
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        this.pixelsDrawn++;
        this.updateStats();
    }

    drawLine(x1, y1, x2, y2) {
        this.ctx.save();
        this.ctx.globalAlpha = this.opacity / 100;
        this.ctx.strokeStyle = this.getCurrentColor();
        this.ctx.lineWidth = this.brushSize * 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
        
        this.pixelsDrawn += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        this.updateStats();
    }

    floodFill(x, y) {
        // Simple flood fill implementation
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const targetColor = this.getPixelColor(data, x, y);
        const fillColor = this.hexToRgb(this.getCurrentColor());
        
        if (this.colorsMatch(targetColor, fillColor)) return;
        
        const stack = [[Math.floor(x), Math.floor(y)]];
        
        while (stack.length) {
            const [cx, cy] = stack.pop();
            const index = (cy * this.canvas.width + cx) * 4;
            
            if (this.colorsMatch([data[index], data[index + 1], data[index + 2]], targetColor)) {
                data[index] = fillColor[0];
                data[index + 1] = fillColor[1];
                data[index + 2] = fillColor[2];
                data[index + 3] = 255;
                
                if (cx > 0) stack.push([cx - 1, cy]);
                if (cx < this.canvas.width - 1) stack.push([cx + 1, cy]);
                if (cy > 0) stack.push([cx, cy - 1]);
                if (cy < this.canvas.height - 1) stack.push([cx, cy + 1]);
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        this.pixelsDrawn += 100; // Approximate
        this.updateStats();
    }

    getPixelColor(data, x, y) {
        const index = (Math.floor(y) * this.canvas.width + Math.floor(x)) * 4;
        return [data[index], data[index + 1], data[index + 2]];
    }

    colorsMatch(color1, color2) {
        return Math.abs(color1[0] - color2[0]) < 10 &&
               Math.abs(color1[1] - color2[1]) < 10 &&
               Math.abs(color1[2] - color2[2]) < 10;
    }

    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    }

    clearCanvas() {
        this.saveState();
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.pixelsDrawn = 0;
        this.updateStats();
        
        // Animation
        const btn = document.getElementById('clear-canvas');
        btn.innerHTML = '<i class="fas fa-check"></i> Cleared!';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-eraser"></i> Clear Canvas';
        }, 1000);
    }

    saveState() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history.push(imageData);
        if (this.history.length > 20) this.history.shift();
        this.historyIndex = this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
            
            const btn = document.getElementById('undo-action');
            btn.innerHTML = '<i class="fas fa-check"></i> Undone';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-undo"></i> Undo';
            }, 1000);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
            
            const btn = document.getElementById('redo-action');
            btn.innerHTML = '<i class="fas fa-check"></i> Redone';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-redo"></i> Redo';
            }, 1000);
        }
    }

    saveArt() {
        const link = document.createElement('a');
        link.download = `pixel-art-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        const btn = document.getElementById('save-art');
        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-download"></i> Save Art';
        }, 1000);
    }

    applyEffect(effect) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        switch(effect) {
            case 'blur':
                // Simple blur
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = data[i + 1] = data[i + 2] = avg * 0.8 + data[i] * 0.2;
                }
                break;
                
            case 'sharpen':
                // Simple sharpen
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 1.2);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.2);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.2);
                }
                break;
                
            case 'invert':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
                break;
                
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = data[i + 1] = data[i + 2] = avg;
                }
                break;
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    setupColorHistory() {
        this.colorHistory = JSON.parse(localStorage.getItem('pixelCanvasColorHistory') || '[]');
        this.updateColorHistoryUI();
    }

    addToColorHistory(color) {
        if (!this.colorHistory.includes(color)) {
            this.colorHistory.unshift(color);
            if (this.colorHistory.length > 12) this.colorHistory.pop();
            localStorage.setItem('pixelCanvasColorHistory', JSON.stringify(this.colorHistory));
            this.updateColorHistoryUI();
        }
    }

    updateColorHistoryUI() {
        const container = document.getElementById('color-history');
        container.innerHTML = '';
        
        this.colorHistory.forEach(color => {
            const div = document.createElement('div');
            div.className = 'history-color';
            div.style.background = color;
            div.addEventListener('click', () => this.setColor(color));
            container.appendChild(div);
        });
    }

    updateStats() {
        // Update pixel count
        const totalPixels = this.gridSize * this.gridSize;
        const percentage = Math.min(100, Math.round((this.pixelsDrawn / 1000) * 100));
        document.getElementById('pixel-count').textContent = `${percentage}% drawn`;
        
        // Update session time
        const elapsed = Math.floor((Date.now() - this.sessionStart) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('session-time').textContent = `${minutes}:${seconds}`;
        
        // Update strokes
        document.getElementById('brush-strokes').textContent = this.brushStrokes;
    }

    updateUI() {
        this.updateColorPreview();
        this.updateStats();
        
        // Update brush display
        document.getElementById('brush-value').textContent = `${this.brushSize}px`;
        document.getElementById('brush-size-display').textContent = `${this.brushSize}px`;
        
        // Update grid display
        document.getElementById('grid-size-display').textContent = `${this.gridSize}×${this.gridSize}`;
    }

    startAnimationLoop() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const updateFPS = () => {
            frameCount++;
            const now = performance.now();
            
            if (now >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (now - lastTime));
                document.getElementById('fps-display').textContent = `${fps} FPS`;
                frameCount = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        updateFPS();
    }
}

// Initialize the app with a smooth animation
window.addEventListener('load', () => {
    setTimeout(() => {
        const app = new PixelCanvas();
        window.pixelCanvas = app;
        
        // Show welcome message
        console.log('✨ Pixel Canvas ready! Create something beautiful.');
    }, 500);
});
