import { useState } from 'react';

interface Camera {
    id: string;
    url: string;
    order: number;
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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, camera: Camera) => {
        e.dataTransfer.setData('text/plain', camera.id);
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCamera: Camera) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedCamera = localCameras.find(c => c.id === draggedId);

        if (!draggedCamera || draggedCamera.id === targetCamera.id) return;

        const updatedCameras = localCameras.map(cam => {
            if (cam.id === draggedId) {
                return { ...cam, order: targetCamera.order };
            }
            if (cam.id === targetCamera.id) {
                return { ...cam, order: draggedCamera.order };
            }
            return cam;
        });

        setLocalCameras(updatedCameras);
    };

    const handleSave = () => {
        onSave(localCameras);
        onClose();
    };

    const sortedCameras = [...localCameras].sort((a, b) => a.order - b.order);

    return (
        <>
            <button className="config-button" onClick={() => onClose()}>
                {isOpen ? 'Close' : 'Configure IPs'}
            </button>
            <div className={`config-panel ${isOpen ? 'open' : ''}`}>
                <div className="config-panel-header">
                    <h2>Camera Configuration</h2>
                </div>
                <div className="camera-list">
                    {sortedCameras.map(camera => (
                        <div
                            key={camera.id}
                            className="camera-input"
                            draggable
                            onDragStart={(e) => handleDragStart(e, camera)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, camera)}
                        >
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
                <div className="config-panel-footer">
                    <button className="save-button" onClick={handleSave}>
                        Save Changes
                    </button>
                </div>
            </div>
        </>
    );
}; 