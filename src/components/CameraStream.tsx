import { useEffect, useRef, useState } from 'react';

interface CameraStreamProps {
    id: string;
    url: string;
}

export const CameraStream = ({ id, url }: CameraStreamProps) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        setIsLoading(true);
        setError(null);

        const handleLoad = () => {
            setIsLoading(false);
        };

        const handleError = () => {
            setIsLoading(false);
            setError('Stream unavailable');
        };

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);

        // Set the MJPEG stream URL
        img.src = url;

        // Cleanup function
        return () => {
            img.src = '';
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
        };
    }, [url]);

    return (
        <div className="camera-container">
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
        </div>
    );
}; 