import { useState, useEffect } from 'react'
import './App.css'
import { CameraStream } from './components/CameraStream'
import { ConfigPanel } from './components/ConfigPanel'
import { TilingLayout } from './components/TilingLayout'
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

  // Register MQTT message handler only once on mount
  useEffect(() => {
    // Handler function
    const handler = (topic: string, message: Buffer) => {
      let ip: string | null = null;
      try {
        // Try to parse as JSON first
        const msgStr = message.toString();
        if (msgStr.trim().startsWith('{')) {
          const obj = JSON.parse(msgStr);
          if (obj.ip && typeof obj.ip === 'string') {
            ip = obj.ip;
          }
        } else {
          // Fallback: extract IP from plain string
          ip = extractIpFromMessage(message);
        }
      } catch (e) {
        // Fallback: extract IP from plain string
        ip = extractIpFromMessage(message);
      }

      if (ip) {
        setCameras(prevCameras => {
          const exists = prevCameras.some(cam => cam.url.includes(ip));
          if (!exists) {
            const newCameraId = `CAM-${String(prevCameras.length + 1).padStart(3, '0')}`;
            const newCamera: Camera = {
              id: newCameraId,
              url: `http://${ip}/stream`,
              order: prevCameras.length
            };
            toast.success(`New camera detected: ${newCameraId} (${ip})`, {
              duration: 5000,
              icon: '📷'
            });
            return [...prevCameras, newCamera];
          } else {
            // Only show toast if this is not the first camera
            if (prevCameras.length > 0) {
              toast(`Camera with IP ${ip} already exists`, {
                duration: 3000,
                icon: 'ℹ️'
              });
            }
            return prevCameras;
          }
        });
      } else {
        toast.error('Received MQTT message, but no IP found', { duration: 3000 });
      }
    };
    mqttService.onMessage(handler);
    // No built-in way to remove handler, but this prevents stacking in dev/hot reload
    return () => {
      // No-op: would remove handler if mqttService supported it
    };
  }, []);

  // Automatically connect to MQTT broker on mount and update status
  useEffect(() => {
    mqttService.connect();
    setMqttStatus(mqttService.getConnectionStatus());
    const interval = setInterval(() => {
      setMqttStatus(mqttService.getConnectionStatus());
    }, 1000);
    return () => {
      mqttService.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleSaveCameras = (newCameras: Camera[]) => {
    setCameras(newCameras);
  };

  const handleCameraClick = (camera: Camera) => {
    setFullscreenCamera(camera);
  };

  const exitFullscreen = () => {
    setFullscreenCamera(null);
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
      {/* MQTT LED Indicator */}
      <div className={`mqtt-led-indicator ${mqttStatus}`}></div>
      <h1>StoneView</h1>

      {/* Hidden settings area in top right */}
      <div className="settings-hover-area">
        <button
          className="settings-glow-btn"
          onClick={() => setIsConfigOpen(true)}
        >
          Settings
        </button>
      </div>

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
        <div style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
          <TilingLayout
            cameras={sortedCameras}
            onCameraClick={handleCameraClick}
          />
        </div>
      )}

      {/* Camera Configuration Panel Overlay */}
      {isConfigOpen && (
        <div className="config-panel-overlay">
          <ConfigPanel
            isOpen={isConfigOpen}
            onClose={() => setIsConfigOpen(false)}
            cameras={cameras}
            onSave={handleSaveCameras}
            clearAllCameras={clearAllCameras}
          />
        </div>
      )}

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
