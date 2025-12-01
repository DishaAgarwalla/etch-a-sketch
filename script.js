// ============================================
// ETCH-A-SKETCH - SIMPLE WORKING VERSION
// ============================================

console.log("🎨 Etch-a-Sketch loaded!");

// Game state
let currentMode = 'rainbow'; // 'black', 'rainbow', 'eraser', 'custom'
let gridSize = 12;
let showGridLines = true;
let isDrawing = false;
let paintedCells = 0;
let totalCells = 144; // 12x12

// DOM Elements
const drawingGrid = document.getElementById('drawing-grid');
const gridSizeValue = document.getElementById('grid-size-value');
const gridSizeSlider = document.getElementById('grid-size-slider');
const gridLinesToggle = document.getElementById('grid-lines-toggle');
const colorPicker = document.getElementById('color-picker');
const currentModeDisplay = document.getElementById('current-mode');
const pixelCountDisplay = document.getElementById('pixel-count');

// Buttons
const blackBtn = document.getElementById('black-btn');
const rainbowBtn = document.getElementById('rainbow-btn');
const eraserBtn = document.getElementById('eraser-btn');
const clearBtn = document.getElementById('clear-btn');
const resetBtn = document.getElementById('reset-btn');

// Initialize the app
function init() {
    console.log("Initializing Etch-a-Sketch...");
    
    // Create initial grid
    createGrid();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update displays
    updateDisplays();
}

// Create the grid
function createGrid() {
    console.log(`Creating ${gridSize}x${gridSize} grid...`);
    
    // Clear existing grid
    drawingGrid.innerHTML = '';
    
    // Update grid styles
    drawingGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    drawingGrid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    
    // Remove or add gap based on grid lines setting
    if (showGridLines) {
        drawingGrid.style.gap = '1px';
    } else {
        drawingGrid.style.gap = '0';
    }
    
    // Create cells
    totalCells = gridSize * gridSize;
    paintedCells = 0;
    
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        // Set border based on grid lines setting
        if (showGridLines) {
            cell.style.border = '1px solid #eee';
        } else {
            cell.style.border = 'none';
        }
        
        // Mouse events
        cell.addEventListener('mousedown', (e) => {
            isDrawing = true;
            paintCell(cell);
            e.preventDefault(); // Prevent text selection
        });
        
        cell.addEventListener('mouseover', () => {
            if (isDrawing) {
                paintCell(cell);
            }
        });
        
        drawingGrid.appendChild(cell);
    }
    
    updateDisplays();
}

// Paint a cell
function paintCell(cell) {
    let color;
    
    switch(currentMode) {
        case 'black':
            color = '#000000';
            break;
        case 'rainbow':
            color = getRandomColor();
            break;
        case 'eraser':
            color = 'white';
            break;
        case 'custom':
            color = colorPicker.value;
            break;
    }
    
    // Only count if changing from white to colored
    if (cell.style.backgroundColor !== color) {
        if (cell.style.backgroundColor === '' || cell.style.backgroundColor === 'white' || cell.style.backgroundColor === 'rgb(255, 255, 255)') {
            if (color !== 'white') {
                paintedCells++;
            }
        } else if (color === 'white') {
            paintedCells--;
        }
        
        cell.style.backgroundColor = color;
        updateDisplays();
    }
}

// Get random color
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', 
        '#118AB2', '#073B4C', '#7209B7', '#F72585',
        '#3A86FF', '#FB5607', '#8338EC', '#FF006E'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Update all displays
function updateDisplays() {
    // Update mode display
    currentModeDisplay.textContent = `Current: ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}`;
    
    // Update pixel count
    pixelCountDisplay.textContent = `Pixels: ${paintedCells}/${totalCells}`;
    
    // Update grid size display
    gridSizeValue.textContent = `${gridSize} x ${gridSize}`;
}

// Clear grid
function clearGrid() {
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
        cell.style.backgroundColor = '';
    });
    paintedCells = 0;
    updateDisplays();
    
    // Visual feedback
    clearBtn.innerHTML = '<i class="fas fa-check"></i> Cleared!';
    setTimeout(() => {
        clearBtn.innerHTML = '<i class="fas fa-broom"></i> Clear Grid';
    }, 1000);
}

// Reset everything
function resetAll() {
    // Reset variables
    currentMode = 'rainbow';
    gridSize = 12;
    showGridLines = true;
    paintedCells = 0;
    
    // Reset UI
    gridSizeSlider.value = 12;
    gridLinesToggle.checked = true;
    colorPicker.value = '#ff0000';
    
    // Reset buttons
    blackBtn.classList.remove('active');
    rainbowBtn.classList.add('active');
    eraserBtn.classList.remove('active');
    
    // Recreate grid
    createGrid();
    
    // Visual feedback
    resetBtn.innerHTML = '<i class="fas fa-check"></i> Reset!';
    setTimeout(() => {
        resetBtn.innerHTML = '<i class="fas fa-redo"></i> Reset All';
    }, 1000);
}

// Set up event listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Stop drawing when mouse is released
    document.addEventListener('mouseup', () => {
        isDrawing = false;
    });
    
    // Grid size slider
    gridSizeSlider.addEventListener('input', (e) => {
        gridSize = parseInt(e.target.value);
        createGrid();
    });
    
    // Grid lines toggle
    gridLinesToggle.addEventListener('change', (e) => {
        showGridLines = e.target.checked;
        createGrid();
    });
    
    // Color picker
    colorPicker.addEventListener('input', () => {
        currentMode = 'custom';
        updateButtonStates();
        updateDisplays();
    });
    
    // Color buttons
    blackBtn.addEventListener('click', () => {
        currentMode = 'black';
        updateButtonStates();
        updateDisplays();
    });
    
    rainbowBtn.addEventListener('click', () => {
        currentMode = 'rainbow';
        updateButtonStates();
        updateDisplays();
    });
    
    eraserBtn.addEventListener('click', () => {
        currentMode = 'eraser';
        updateButtonStates();
        updateDisplays();
    });
    
    // Tool buttons
    clearBtn.addEventListener('click', clearGrid);
    resetBtn.addEventListener('click', resetAll);
    
    // Prevent drag behavior
    drawingGrid.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
    
    // Touch events for mobile
    drawingGrid.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        const touch = e.touches[0];
        const cell = document.elementFromPoint(touch.clientX, touch.clientY);
        if (cell && cell.classList.contains('grid-cell')) {
            paintCell(cell);
        }
    });
    
    drawingGrid.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDrawing) {
            const touch = e.touches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            if (cell && cell.classList.contains('grid-cell')) {
                paintCell(cell);
            }
        }
    });
    
    drawingGrid.addEventListener('touchend', () => {
        isDrawing = false;
    });
}

// Update button active states
function updateButtonStates() {
    blackBtn.classList.remove('active');
    rainbowBtn.classList.remove('active');
    eraserBtn.classList.remove('active');
    
    switch(currentMode) {
        case 'black':
            blackBtn.classList.add('active');
            break;
        case 'rainbow':
            rainbowBtn.classList.add('active');
            break;
        case 'eraser':
            eraserBtn.classList.add('active');
            break;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case '1':
            blackBtn.click();
            break;
        case '2':
            rainbowBtn.click();
            break;
        case '3':
            eraserBtn.click();
            break;
        case 'c':
            clearGrid();
            break;
        case 'r':
            resetAll();
            break;
        case 'escape':
            isDrawing = false;
            break;
    }
});

console.log("✅ Etch-a-Sketch ready!");
console.log("🖱️ Click and drag to draw!");
console.log("🎨 Press 1, 2, 3 to switch colors!");