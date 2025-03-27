import { useState, useEffect } from 'react'
import './App.css'
import { CameraStream } from './components/CameraStream'
import { ConfigPanel } from './components/ConfigPanel'

interface Camera {
  id: string;
  url: string;
  order: number;
}

// Initial camera configuration
const initialCameras: Camera[] = [
  { id: 'CAM-001', url: 'http://192.168.0.100/stream', order: 0 },
  { id: 'CAM-002', url: 'http://192.168.0.101/stream', order: 1 },
  { id: 'CAM-003', url: 'http://192.168.0.102/stream', order: 2 },
  { id: 'CAM-004', url: 'http://192.168.0.103/stream', order: 3 },
  { id: 'CAM-005', url: 'http://192.168.0.104/stream', order: 4 },
  { id: 'CAM-006', url: 'http://192.168.0.105/stream', order: 5 },
  { id: 'CAM-007', url: 'http://192.168.0.106/stream', order: 6 },
  { id: 'CAM-008', url: 'http://192.168.0.107/stream', order: 7 },
  { id: 'CAM-009', url: 'http://192.168.0.108/stream', order: 8 },
];

function App() {
  const [cameras, setCameras] = useState<Camera[]>(() => {
    const saved = localStorage.getItem('cameras');
    return saved ? JSON.parse(saved) : initialCameras;
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);

  // Save cameras to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cameras', JSON.stringify(cameras));
  }, [cameras]);

  const handleSaveCameras = (newCameras: Camera[]) => {
    // Preserve the order from the config panel
    setCameras(newCameras);
  };

  const handleCameraClick = (camera: Camera) => {
    setFullscreenCamera(camera);
  };

  const exitFullscreen = () => {
    setFullscreenCamera(null);
  };

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenCamera) {
        exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fullscreenCamera]);

  const sortedCameras = [...cameras].sort((a, b) => a.order - b.order);

  return (
    <div className="container">
      <h1>StoneView</h1>
      {fullscreenCamera ? (
        <div className="fullscreen-container">
          <button className="exit-fullscreen" onClick={exitFullscreen}>
            Exit Fullscreen
          </button>
          <CameraStream
            key={fullscreenCamera.id}
            id={fullscreenCamera.id}
            url={fullscreenCamera.url}
            isFullscreen
          />
        </div>
      ) : (
        <div className="grid">
          {sortedCameras.map((camera) => (
            <div
              key={camera.id}
              className="grid-item"
              onClick={() => handleCameraClick(camera)}
            >
              <CameraStream id={camera.id} url={camera.url} />
            </div>
          ))}
        </div>
      )}
      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(!isConfigOpen)}
        cameras={cameras}
        onSave={handleSaveCameras}
      />
    </div>
  )
}

export default App
