import { useEffect, useRef, useState } from 'react';

interface CameraStreamProps {
    id: string;
    url: string;
    isFullscreen?: boolean;
}

export const CameraStream = ({ id, url, isFullscreen = false }: CameraStreamProps) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'online' | 'offline'>('offline');
    const [fps, setFps] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const frameCountRef = useRef(0);
    const lastFrameTimeRef = useRef(Date.now());
    const streamTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        setIsLoading(true);
        setError(null);
        setStatus('offline');

        const handleLoad = () => {
            setIsLoading(false);
            setStatus('online');
            frameCountRef.current++;

            // Update FPS calculation
            const now = Date.now();
            if (now - lastFrameTimeRef.current >= 1000) {
                setFps(frameCountRef.current);
                frameCountRef.current = 0;
                lastFrameTimeRef.current = now;
            }

            // Update timestamp
            setLastUpdate(new Date());

            // Clear any existing timeout
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
            }

            // Set a timeout to check if the stream is still active
            streamTimeoutRef.current = window.setTimeout(() => {
                if (img.complete && img.naturalWidth === 0) {
                    setError('Stream disconnected');
                    setStatus('offline');
                }
            }, 5000);
        };

        const handleError = () => {
            setIsLoading(false);
            setError('Stream unavailable');
            setStatus('offline');
        };

        // Add a timestamp to the URL to prevent caching
        const timestamp = new Date().getTime();
        const streamUrl = `${url}${url.includes('?') ? '&' : '?'}_=${timestamp}`;

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);

        // Set the MJPEG stream URL
        img.src = streamUrl;

        // Update FPS every second
        const fpsInterval = setInterval(() => {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
        }, 1000);

        // Cleanup function
        return () => {
            // Clear timeouts and intervals
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
            }
            clearInterval(fpsInterval);

            // Remove event listeners
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);

            // Stop the stream by setting src to empty string
            img.src = '';
        };
    }, [url]);

    return (
        <div className={`camera-container ${isFullscreen ? 'fullscreen' : ''}`}>
            {isLoading && <div className="camera-loading">Loading...</div>}
            {error && (
                <>
                    <div className="static-background" />
                    <div className="tv-static" />
                    <div className="camera-error">{error}</div>
                </>
            )}
            <img
                ref={imgRef}
                alt="Camera stream"
                className="camera-stream"
                style={{ opacity: error ? 0 : 1 }}
            />
            <div className="camera-id">{id}</div>
            <div className="camera-overlay">
                <div className={`status-indicator ${status}`} />
                <div className="camera-stats">
                    <div className="fps">{fps} FPS</div>
                    <div className="timestamp">
                        {lastUpdate.toLocaleTimeString()}
                    </div>
                </div>
            </div>
        </div>
    );
}; 