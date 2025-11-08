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
    
    // Session Management
    const STORAGE_KEY = 'canvas_sessions';
    const sessionsList = document.getElementById('sessions-list');
    const sessionsContainer = document.getElementById('sessions-container');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const exportBtn = document.getElementById('export-btn');

    // Get all saved sessions from localStorage
    function getSessions() {
        try {
            const sessions = localStorage.getItem(STORAGE_KEY);
            return sessions ? JSON.parse(sessions) : {};
        } catch (e) {
            console.error('Error reading sessions:', e);
            return {};
        }
    }

    // Save sessions to localStorage
    function saveSessions(sessions) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        } catch (e) {
            console.error('Error saving sessions:', e);
            alert('Error saving session. Storage might be full.');
        }
    }

    // Save current session
    function saveSession() {
        const sessionName = prompt('Enter a name for this session:');
        if (!sessionName || sessionName.trim() === '') {
            return;
        }

        const state = window.canvasManager.exportState();
        const sessions = getSessions();
        sessions[sessionName.trim()] = {
            name: sessionName.trim(),
            state: state,
            savedAt: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        saveSessions(sessions);
        updateSessionsList();
        alert(`Session "${sessionName}" saved successfully!`);
    }

    // Load a session
    function loadSession(sessionName) {
        const sessions = getSessions();
        const session = sessions[sessionName];
        
        if (!session) {
            alert('Session not found!');
            return;
        }

        if (confirm(`Load session "${sessionName}"? This will replace your current canvas.`)) {
            const success = window.canvasManager.importState(session.state);
            if (success) {
                alert(`Session "${sessionName}" loaded successfully!`);
                sessionsList.style.display = 'none';
            } else {
                alert('Error loading session!');
            }
        }
    }

    // Delete a session
    function deleteSession(sessionName, event) {
        event.stopPropagation(); // Prevent loading when clicking delete
        
        if (confirm(`Delete session "${sessionName}"?`)) {
            const sessions = getSessions();
            delete sessions[sessionName];
            saveSessions(sessions);
            updateSessionsList();
        }
    }

    // Update sessions list UI
    function updateSessionsList() {
        const sessions = getSessions();
        const sessionNames = Object.keys(sessions).sort((a, b) => {
            return sessions[b].timestamp - sessions[a].timestamp; // Newest first
        });

        if (sessionNames.length === 0) {
            sessionsContainer.innerHTML = '<div style="padding: 10px; color: #999; font-size: 12px; text-align: center;">No saved sessions</div>';
            return;
        }

        sessionsContainer.innerHTML = sessionNames.map(name => {
            const session = sessions[name];
            const date = new Date(session.timestamp);
            const dateStr = date.toLocaleString();
            
            return `
                <div class="session-item" style="
                    padding: 10px;
                    margin-bottom: 8px;
                    background: rgba(102, 126, 234, 0.05);
                    border-radius: 8px;
                    border: 1px solid rgba(102, 126, 234, 0.1);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                " onclick="loadSession('${name.replace(/'/g, "\\'")}')">
                    <div>
                        <div style="font-weight: 600; color: #667eea; font-size: 13px; margin-bottom: 4px;">${name}</div>
                        <div style="font-size: 11px; color: #999;">${dateStr}</div>
                    </div>
                    <button onclick="deleteSession('${name.replace(/'/g, "\\'")}', event)" style="
                        background: #ff6b6b;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 4px 8px;
                        cursor: pointer;
                        font-size: 11px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#ff5252'" onmouseout="this.style.background='#ff6b6b'">Delete</button>
                </div>
            `;
        }).join('');

        // Add hover effect to session items
        const sessionItems = sessionsContainer.querySelectorAll('.session-item');
        sessionItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(102, 126, 234, 0.1)';
                this.style.transform = 'translateX(3px)';
            });
            item.addEventListener('mouseleave', function() {
                this.style.background = 'rgba(102, 126, 234, 0.05)';
                this.style.transform = 'translateX(0)';
            });
        });
    }

    // Make functions globally available for onclick handlers
    window.loadSession = loadSession;
    window.deleteSession = deleteSession;

    // Save button
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSession);
    }

    // Load button - toggle sessions list
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            if (sessionsList.style.display === 'none') {
                updateSessionsList();
                sessionsList.style.display = 'block';
            } else {
                sessionsList.style.display = 'none';
            }
        });
    }

    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.canvasManager.exportAsPNG();
        });
    }

    // Auto-save current session on page unload (optional)
    window.addEventListener('beforeunload', () => {
        // Optional: Auto-save to a temporary session
        try {
            const state = window.canvasManager.exportState();
            localStorage.setItem('canvas_autosave', JSON.stringify({
                state: state,
                timestamp: Date.now()
            }));
        } catch (e) {
            // Ignore errors on page unload
        }
    });

    // Check for auto-saved session on load
    window.addEventListener('load', () => {
        try {
            const autosave = localStorage.getItem('canvas_autosave');
            if (autosave) {
                const data = JSON.parse(autosave);
                // Only restore if it's from today (within 24 hours)
                const hoursSinceSave = (Date.now() - data.timestamp) / (1000 * 60 * 60);
                if (hoursSinceSave < 24) {
                    if (confirm('Found an auto-saved session from earlier. Restore it?')) {
                        window.canvasManager.importState(data.state);
                    }
                }
            }
        } catch (e) {
            // Ignore errors
        }
    });

    console.log('Collaborative Canvas initialized');
})();

