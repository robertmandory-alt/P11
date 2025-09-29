import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';

export interface SignaturePadRef {
    clear: () => void;
    isEmpty: () => boolean;
    toDataURL: (type?: string, quality?: number) => string | undefined;
}

const SignaturePad = forwardRef<SignaturePadRef>((props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.strokeStyle = '#374151'; // gray-700
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const getCoords = (event: MouseEvent | TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();

        if (event instanceof MouseEvent) {
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        }
        if (event.touches && event.touches.length > 0) {
            return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
        }
        return null;
    };

    const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const coords = getCoords(event.nativeEvent);
        if (!coords) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
        setIsEmpty(false);
    };

    const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const coords = getCoords(event.nativeEvent);
        if (!coords) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
    };

    useImperativeHandle(ref, () => ({
        clear: () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    setIsEmpty(true);
                }
            }
        },
        isEmpty: () => {
            return isEmpty;
        },
        toDataURL: (type = 'image/png', quality = 1.0) => {
            return canvasRef.current?.toDataURL(type, quality);
        }
    }));

    return (
        <canvas
            ref={canvasRef}
            width={500}
            height={200}
            className="w-full h-48 bg-gray-50 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
    );
});

export default SignaturePad;
