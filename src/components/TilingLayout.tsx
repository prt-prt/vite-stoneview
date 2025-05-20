import { useState, useRef, useEffect } from 'react';
import { CameraStream } from './CameraStream';

interface Camera {
    id: string;
    url: string;
    order: number;
}

interface Tile {
    id: string;
    camera: Camera | null;
    split: 'horizontal' | 'vertical' | null;
    children: Tile[];
    size: number;
}

interface TilingLayoutProps {
    cameras: Camera[];
    onCameraClick: (camera: Camera) => void;
}

export const TilingLayout = ({ cameras, onCameraClick }: TilingLayoutProps) => {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (cameras.length === 0) {
            setTiles([]);
            return;
        }

        // Always split the cameras array in half, and each split is 50/50
        const createBalancedTree = (cams: Camera[], depth: number = 0): Tile => {
            if (cams.length === 1) {
                return {
                    id: `tile-${depth}-${cams[0].id}`,
                    camera: cams[0],
                    split: null,
                    children: [],
                    size: 100
                };
            }
            const mid = Math.floor(cams.length / 2);
            const splitDirection = depth % 2 === 0 ? 'vertical' : 'horizontal';
            return {
                id: `tile-${depth}-${cams.map(c => c.id).join('-')}`,
                camera: null,
                split: splitDirection,
                children: [
                    createBalancedTree(cams.slice(0, mid), depth + 1),
                    createBalancedTree(cams.slice(mid), depth + 1)
                ],
                size: 100
            };
        };

        // Recursively set both children to 50% size
        const setEvenSizes = (tile: Tile): Tile => {
            if (!tile.split) return tile;
            return {
                ...tile,
                children: tile.children.map(setEvenSizes).map(child => ({ ...child, size: 50 }))
            };
        };

        const root = createBalancedTree(cameras);
        setTiles([setEvenSizes(root)]);
    }, [cameras]);

    const renderTile = (tile: Tile, isRoot = false) => {
        const style: React.CSSProperties = {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: tile.split === 'vertical' ? 'row' : 'column',
            position: 'relative',
            gap: '4px',
        };

        if (tile.split) {
            return (
                <div key={tile.id} style={style} className={isRoot ? 'tile-container' : ''}>
                    {tile.children.map((child) => (
                        <div
                            key={child.id}
                            style={{
                                flex: child.size,
                                position: 'relative',
                                minWidth: '100px',
                                minHeight: '100px',
                                display: 'flex',
                                flexDirection: child.split === 'vertical' ? 'row' : 'column',
                            }}
                        >
                            {renderTile(child)}
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div key={tile.id} className="tile-container" style={{ width: '100%', height: '100%', position: 'relative', boxSizing: 'border-box' }}>
                {tile.camera && (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            position: 'relative'
                        }}
                        onClick={() => onCameraClick(tile.camera!)}
                    >
                        <CameraStream
                            id={tile.camera.id}
                            url={tile.camera.url}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '600px',
                position: 'relative',
                gap: '4px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {tiles.map(tile => renderTile(tile, true))}
        </div>
    );
}; 