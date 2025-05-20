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
    const handleUrlChange = (id: string, newUrl: string) => {
        const updatedCameras = cameras.map(cam =>
            cam.id === id ? { ...cam, url: newUrl } : cam
        );
        onSave(updatedCameras);
    };

    const handleAddCamera = () => {
        const newCameraId = `CAM-${String(cameras.length + 1).padStart(3, '0')}`;
        const newCamera: Camera = {
            id: newCameraId,
            url: '',
            order: cameras.length
        };
        onSave([...cameras, newCamera]);
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
        const draggedCamera = cameras.find(c => c.id === draggedId);

        if (!draggedCamera || draggedCamera.id === targetCamera.id) return;

        const updatedCameras = cameras.map(cam => {
            if (cam.id === draggedId) {
                return { ...cam, order: targetCamera.order };
            }
            if (cam.id === targetCamera.id) {
                return { ...cam, order: draggedCamera.order };
            }
            return cam;
        });

        onSave(updatedCameras);
    };

    const handleDeleteCamera = (id: string) => {
        const updatedCameras = cameras.filter(cam => cam.id !== id);
        onSave(updatedCameras);
    };

    const sortedCameras = [...cameras].sort((a, b) => a.order - b.order);

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
                            <div className="camera-input-header">
                                <label>{camera.id}</label>
                                <button
                                    className="delete-camera-btn"
                                    onClick={() => handleDeleteCamera(camera.id)}
                                    style={{
                                        backgroundColor: '#ff6b6b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.25rem 0.5rem',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                            <input
                                type="text"
                                value={camera.url}
                                onChange={(e) => handleUrlChange(camera.id, e.target.value)}
                                placeholder="http://192.168.0.xxx/stream"
                            />
                        </div>
                    ))}
                    <button
                        className="add-camera-btn"
                        onClick={handleAddCamera}
                        style={{
                            backgroundColor: '#4dabf7',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.75rem',
                            cursor: 'pointer',
                            width: '100%',
                            marginTop: '1rem',
                            fontFamily: 'monospace'
                        }}
                    >
                        + Add Camera
                    </button>
                </div>
            </div>
        </>
    );
}; 