import { useState } from 'react'
import './App.css'
import { CameraStream } from './components/CameraStream'
import { ConfigPanel } from './components/ConfigPanel'

// ESP32-CAM MJPEG stream URLs
const initialCameras = [
  { id: 'CAM-001', url: 'http://192.168.0.100/stream' },
  { id: 'CAM-002', url: 'http://192.168.0.101/stream' },
  { id: 'CAM-003', url: 'http://192.168.0.102/stream' },
  { id: 'CAM-004', url: 'http://192.168.0.103/stream' },
  { id: 'CAM-005', url: 'http://192.168.0.104/stream' },
  { id: 'CAM-006', url: 'http://192.168.0.105/stream' },
  { id: 'CAM-007', url: 'http://192.168.0.106/stream' },
  { id: 'CAM-008', url: 'http://192.168.0.107/stream' },
  { id: 'CAM-009', url: 'http://192.168.0.108/stream' },
]

function App() {
  const [cameras, setCameras] = useState(initialCameras);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleSaveCameras = (newCameras: typeof cameras) => {
    setCameras(newCameras);
  };

  return (
    <div className="container">
      <h1>StoneView</h1>
      <div className="grid">
        {cameras.map((camera) => (
          <div key={camera.id} className="grid-item">
            <CameraStream id={camera.id} url={camera.url} />
          </div>
        ))}
      </div>
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
