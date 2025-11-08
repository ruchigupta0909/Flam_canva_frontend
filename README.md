# Real-Time Collaborative Drawing Canvas

A modern, feature-rich multi-user drawing application where multiple people can draw simultaneously on the same canvas with real-time synchronization. Built with vanilla JavaScript, TypeScript, and Socket.io.

![Collaborative Canvas](https://img.shields.io/badge/Canvas-Collaborative-blue)
![Node.js](https://img.shields.io/badge/Node.js-v16+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/ruchigupta0909/Flam_canva_frontend.git
cd Flam_canva_frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the TypeScript code:**
```bash
npm run build
```

4. **Start the server:**
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## ✨ Features

### 🎨 Drawing Tools

- **🖌️ Brush Tool**: Freehand drawing with customizable colors and brush sizes
- **🧹 Eraser Tool**: Erase parts of your drawing
- **▭ Rectangle Tool**: Draw rectangles by clicking and dragging
- **⭕ Circle Tool**: Draw circles by clicking and dragging
- **➖ Line Tool**: Draw straight lines
- **📝 Text Tool**: Add text with customizable font sizes
- **🖼️ Image Import**: Import and place images on the canvas

### 💾 Session Management

- **Save Sessions**: Save your current canvas state with a custom name
- **Load Sessions**: Restore previously saved sessions
- **Session List**: View all saved sessions with timestamps
- **Delete Sessions**: Remove unwanted sessions
- **Auto-Save**: Automatic backup on page unload (restores within 24 hours)

### 📥 Export Features

- **Export as PNG**: Download your canvas as a high-quality PNG image
- **Complete Export**: Includes all strokes, shapes, text, and images

### 🌐 Real-Time Collaboration

- **Live Synchronization**: See other users' drawings in real-time
- **Cursor Indicators**: Visual indicators showing where other users are drawing
- **User Management**: Color-coded user badges showing who's online
- **Global Undo/Redo**: Synchronized undo/redo across all users
- **Connection Status**: Real-time connection indicator

### 🎨 Modern UI/UX

- **Glassmorphism Design**: Beautiful translucent effects with backdrop blur
- **Gradient Themes**: Modern gradient color schemes
- **Smooth Animations**: Fluid transitions and hover effects
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Custom Scrollbars**: Styled scrollbars matching the theme
- **Interactive Elements**: Hover effects and visual feedback on all controls

### 🛠️ Technical Features

- **Vanilla JavaScript**: No frontend frameworks - pure DOM
- **TypeScript Backend**: Type-safe server code
- **WebSocket Communication**: Real-time bidirectional communication using Socket.io
- **Efficient Canvas Operations**: Optimized path drawing and redrawing
- **State Synchronization**: Server-side state management for consistency
- **Mobile Support**: Touch events for drawing on mobile devices
- **Local Storage**: Browser-based session persistence

## 📁 Project Structure

```
Flam_canva_frontend/
├── client/                      # Frontend files
│   ├── index.html              # Main HTML structure
│   ├── style.css               # Modern styling with animations
│   ├── canvas.js               # Canvas drawing logic & tools
│   ├── websocket.js            # WebSocket client management
│   └── main.js                 # App initialization & event handlers
├── server/                      # Backend files (TypeScript)
│   ├── server.ts               # Express + Socket.io server
│   ├── rooms.ts                # Room management
│   └── drawing-state.ts        # Canvas state management
├── dist/                        # Compiled JavaScript (generated)
│   └── server/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD workflow
├── package.json
├── tsconfig.json
├── Procfile                     # Railway deployment config
├── railway.json                 # Railway platform configuration
└── README.md
```

## 🎯 Usage Guide

### Drawing Tools

1. **Select a Tool**: Click on any tool button (Brush, Rectangle, Circle, etc.)
2. **Choose Color**: Use the color picker or color presets
3. **Adjust Size**: Use the brush size slider (affects all tools)
4. **Draw**: Click and drag on the canvas to draw

### Text Tool

1. **Select Text Tool**: Click the "Text" button
2. **Click Canvas**: Click where you want to add text
3. **Enter Text**: Type in the text input field in the toolbar
4. **Adjust Font Size**: Use the font size slider
5. **Place Text**: Press Enter to place the text

### Image Import

1. **Select Image Tool**: Click the "Image" button
2. **Choose File**: Select an image file from your device
3. **Place Image**: Image will be placed at the center of the canvas

### Saving Sessions

1. **Click "Save Session"**: Green button in the Save & Load section
2. **Enter Name**: Give your session a name
3. **Confirm**: Session is saved to browser storage

### Loading Sessions

1. **Click "Load Session"**: Blue button to view saved sessions
2. **Select Session**: Click on a session name to load it
3. **Confirm**: Confirm to replace current canvas with saved session

### Exporting Canvas

1. **Click "Export as PNG"**: Orange button in the Save & Load section
2. **Download**: PNG file will automatically download

## 🧪 Testing with Multiple Users

1. **Open multiple browser windows/tabs** or use different devices on the same network
2. Navigate to `http://localhost:3000` in each window
3. Start drawing in one window - you should see the drawing appear in real-time in all other windows
4. Try drawing simultaneously from multiple windows to test conflict resolution
5. Test undo/redo functionality - actions should be synchronized across all users
6. Test save/load functionality - each user can save their own sessions

### Testing Checklist

- ✅ Real-time drawing synchronization
- ✅ Multiple users drawing simultaneously
- ✅ Cursor position indicators for other users
- ✅ Undo/redo works globally
- ✅ Tool switching (brush, eraser, shapes, text)
- ✅ Color and brush size changes
- ✅ User list updates when users join/leave
- ✅ Shape tools (rectangle, circle, line)
- ✅ Text tool functionality
- ✅ Image import and display
- ✅ Save/load sessions
- ✅ Export as PNG
- ✅ Auto-save functionality

## 🚀 Deployment

### Deploy to Railway (Recommended)

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose your repository
4. **Auto-Deploy**: Railway will automatically detect Node.js and deploy
5. **Share URL**: Your app will be live at `https://your-app-name.railway.app`

### Deploy to Render

1. **Create Render Account**: Go to [render.com](https://render.com)
2. **New Web Service**: Connect your GitHub repository
3. **Configure**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node
4. **Deploy**: Click "Create Web Service"

### Deploy to Heroku

1. **Install Heroku CLI**: `npm install -g heroku`
2. **Login**: `heroku login`
3. **Create App**: `heroku create your-app-name`
4. **Deploy**: `git push heroku main`

## 🔧 Troubleshooting

### Server won't start

- Ensure port 3000 is not already in use
- Check that all dependencies are installed: `npm install`
- Verify TypeScript compilation: `npm run build`

### Drawings not syncing

- Check browser console for WebSocket connection errors
- Verify server is running and accessible
- Check network connectivity between clients and server

### Canvas not displaying

- Check browser console for JavaScript errors
- Ensure all client files are being served correctly
- Verify canvas element exists in DOM

### Sessions not saving

- Check browser localStorage availability
- Ensure browser allows local storage
- Check console for storage quota exceeded errors

### Export not working

- Ensure canvas has content to export
- Check browser download permissions
- Verify images have loaded before exporting

## 📊 Technical Details

### Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Backend**: Node.js, Express, TypeScript
- **Real-time**: Socket.io
- **Storage**: Browser localStorage
- **Build Tool**: TypeScript Compiler

### Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance

- Optimized for up to 10 simultaneous users
- Efficient canvas redrawing
- Minimal memory footprint
- Fast WebSocket communication

## 🎨 UI/UX Highlights

- **Modern Design**: Glassmorphism effects, gradients, and smooth animations
- **Color Scheme**: Purple-blue gradient theme with accent colors
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Accessible**: Clear visual feedback and intuitive controls
- **Polished**: Professional appearance with attention to detail

## 🔮 Future Enhancements

- [ ] Server-side session persistence
- [ ] Share sessions via URL
- [ ] Session thumbnails
- [ ] Import/export session files
- [ ] Cloud backup integration
- [ ] Drawing playback/timeline
- [ ] Layer system
- [ ] More shape tools (polygon, arrow, etc.)
- [ ] Drawing effects and filters
- [ ] Zoom and pan functionality

## Deployment Link 
web-production-70bf0.up.railway.app

## 📝 License

MIT

## 👤 Author

Built as a technical assignment demonstrating real-time collaborative application development.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.




---



