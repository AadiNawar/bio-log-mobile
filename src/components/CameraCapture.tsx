import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  isCapturing?: boolean;
  className?: string;
}

export const CameraCapture = ({ onCapture, isCapturing = false, className }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(imageData);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className={cn("p-6 bg-gradient-background border shadow-soft", className)}>
      <div className="space-y-4">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {isActive ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Camera not active</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {!isActive ? (
            <Button 
              onClick={startCamera}
              className="bg-gradient-primary hover:shadow-medium transition-all duration-300"
              disabled={isCapturing}
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button
                onClick={captureImage}
                className="bg-gradient-primary hover:shadow-medium transition-all duration-300"
                disabled={isCapturing}
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Photo
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                disabled={isCapturing}
              >
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};