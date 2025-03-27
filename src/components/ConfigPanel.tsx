import { useState } from 'react';

interface Camera {
    id: string;
    url: string;
}

interface ConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
    cameras: Camera[];
    onSave: (cameras: Camera[]) => void;
}

export const ConfigPanel = ({ isOpen, onClose, cameras, onSave }: ConfigPanelProps) => {
    const [localCameras, setLocalCameras] = useState<Camera[]>(cameras);

    const handleUrlChange = (id: string, newUrl: string) => {
        setLocalCameras(prev =>
            prev.map(cam =>
                cam.id === id ? { ...cam, url: newUrl } : cam
            )
        );
    };

    const handleSave = () => {
        onSave(localCameras);
        onClose();
    };

    return (
        <>
            <button className="config-button" onClick={() => onClose()}>
                {isOpen ? 'Close' : 'Configure IPs'}
            </button>
            <div className={`config-panel ${isOpen ? 'open' : ''}`}>
                <h2>Camera IP Configuration</h2>
                <div className="camera-list">
                    {localCameras.map(camera => (
                        <div key={camera.id} className="camera-input">
                            <label>{camera.id}</label>
                            <input
                                type="text"
                                value={camera.url}
                                onChange={(e) => handleUrlChange(camera.id, e.target.value)}
                                placeholder="http://192.168.0.xxx/stream"
                            />
                        </div>
                    ))}
                </div>
                <button className="save-button" onClick={handleSave}>
                    Save Changes
                </button>
            </div>
        </>
    );
}; 