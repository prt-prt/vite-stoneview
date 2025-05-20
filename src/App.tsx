import { useState, useEffect } from 'react'
import './App.css'
import { CameraStream } from './components/CameraStream'
import { ConfigPanel } from './components/ConfigPanel'
import { TilingLayout } from './components/TilingLayout'
import { mqttService, extractIpFromMessage } from './services/mqtt'
import { Toaster, toast } from 'react-hot-toast'
import { ReactComponent as SettingsIcon } from './assets/settings.svg'

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

  // Automatically connect to MQTT broker on mount
  useEffect(() => {
    mqttService.connect();
    return () => {
      mqttService.disconnect();
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
      {/* MQTT LED Indicator */}
      <div className={`mqtt-led-indicator ${mqttStatus}`}></div>
      <h1>StoneView</h1>

      {/* Settings Icon Button */}
      <button
        className="config-button"
        onClick={() => setIsConfigOpen(!isConfigOpen)}
        style={{ position: 'fixed', right: '2rem', top: '2rem', zIndex: 100 }}
        aria-label="Settings"
      >
        {/* Inline SVG for settings icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z" /></svg>
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
        <div style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
          <TilingLayout
            cameras={sortedCameras}
            onCameraClick={handleCameraClick}
          />
        </div>
      )}

      {/* Camera Configuration Panel */}
      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(!isConfigOpen)}
        cameras={cameras}
        onSave={handleSaveCameras}
        clearAllCameras={clearAllCameras}
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
