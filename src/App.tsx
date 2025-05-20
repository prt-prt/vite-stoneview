import { useState, useEffect } from 'react'
import './App.css'
import { CameraStream } from './components/CameraStream'
import { ConfigPanel } from './components/ConfigPanel'
import { MqttConfig } from './components/MqttConfig'
import { mqttService, extractIpFromMessage } from './services/mqtt'
import { Toaster, toast } from 'react-hot-toast'

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
  const [mqttStatus, setMqttStatus] = useState<string>('disconnected');

  // Save cameras to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cameras', JSON.stringify(cameras));
  }, [cameras]);

  // Handle MQTT messages and extract IPs
  useEffect(() => {
    // Set up MQTT message handler
    mqttService.onMessage((topic, message) => {
      const ip = extractIpFromMessage(message);

      if (ip) {
        // Check if this IP is already in our list
        const existingCamera = cameras.find(cam => cam.url.includes(ip));

        if (!existingCamera) {
          // Add new camera with the discovered IP
          const newCameraId = `CAM-${String(cameras.length + 1).padStart(3, '0')}`;
          const newCamera: Camera = {
            id: newCameraId,
            url: `http://${ip}/stream`,
            order: cameras.length
          };

          setCameras(prevCameras => [...prevCameras, newCamera]);
          toast.success(`New camera detected: ${newCameraId} (${ip})`, {
            duration: 5000,
            icon: '📷'
          });
        } else {
          toast(`Camera with IP ${ip} already exists`, {
            duration: 3000,
            icon: 'ℹ️'
          });
        }
      } else {
        toast.error('Received MQTT message, but no IP found', { duration: 3000 });
      }
    });

    // No cleanup needed, the MQTT service manages its own lifecycle
  }, [cameras]);

  const handleSaveCameras = (newCameras: Camera[]) => {
    setCameras(newCameras);
  };

  const handleCameraClick = (camera: Camera) => {
    setFullscreenCamera(camera);
  };

  const exitFullscreen = () => {
    setFullscreenCamera(null);
  };

  const handleMqttStatusChange = (status: string) => {
    setMqttStatus(status);
  };

  const clearAllCameras = () => {
    setCameras([]);
    localStorage.setItem('cameras', JSON.stringify([]));
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

      {/* MQTT Connection Status Indicator */}
      <div className={`mqtt-indicator ${mqttStatus}`}>
        MQTT: {mqttStatus}
      </div>

      <button
        className="clear-cameras-btn"
        onClick={clearAllCameras}
        style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'monospace'
        }}
      >
        Clear All Cameras
      </button>

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

      {/* MQTT Configuration Panel */}
      <MqttConfig onConnectionStatusChange={handleMqttStatusChange} />

      {/* Camera Configuration Panel */}
      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(!isConfigOpen)}
        cameras={cameras}
        onSave={handleSaveCameras}
      />

      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          }
        }}
      />
    </div>
  )
}

export default App
