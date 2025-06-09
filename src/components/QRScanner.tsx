
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, CheckCircle, XCircle, Scan, AlertTriangle } from "lucide-react";
import { Attendee } from "@/types/attendee";
import { toast } from "@/hooks/use-toast";

interface QRScannerProps {
  onCheckIn: (attendeeId: string) => Promise<boolean>;
  attendees: Attendee[];
}

const QRScanner = ({ onCheckIn, attendees }: QRScannerProps) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>("");
  const [scanResult, setScanResult] = useState<{ success: boolean; attendee?: Attendee; message: string } | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraError("");
      console.log('Attempting to start camera...');
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Mobile-optimized camera constraints
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: false
      };

      console.log('Requesting camera access with constraints:', constraints);
      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera stream obtained successfully');
      } catch (error) {
        console.log('Fallback to basic constraints due to error:', error);
        // Fallback to minimal constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        console.log('Camera stream obtained with fallback constraints');
      }

      if (videoRef.current && stream) {
        console.log('Setting video source...');
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Force video properties for mobile
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        // Wait for metadata and then play
        const playVideo = () => {
          if (videoRef.current) {
            console.log('Video metadata loaded, attempting to play...');
            videoRef.current.play()
              .then(() => {
                console.log('Video is now playing');
                setIsCameraOn(true);
                setIsLoading(false);
              })
              .catch((playError) => {
                console.error('Error playing video:', playError);
                setCameraError('Failed to display camera feed. Try refreshing the page.');
                setIsLoading(false);
              });
          }
        };

        if (videoRef.current.readyState >= 2) {
          // Metadata already loaded
          playVideo();
        } else {
          videoRef.current.onloadedmetadata = playVideo;
        }

        // Add additional event listeners for troubleshooting
        videoRef.current.oncanplay = () => {
          console.log('Video can start playing');
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video element error:', error);
          setCameraError('Video display error. Please try again.');
          setIsLoading(false);
        };
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setIsLoading(false);
      
      let errorMessage = "Could not access camera. ";
      
      if (error.name === 'NotAllowedError') {
        errorMessage += "Camera permission denied. Please allow camera access and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage += "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage += "Camera not supported in this browser. Try using Chrome or Safari.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += "Camera constraints not supported. Trying with basic settings...";
      } else {
        errorMessage += "Please check camera permissions and try again.";
      }
      
      setCameraError(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    setIsLoading(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped');
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setCameraError("");
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Simulate QR code scanning (in real implementation, use a QR scanning library)
  const simulateQRScan = async (mockId: string) => {
    const attendee = attendees.find(a => a.id === mockId);
    
    if (!attendee) {
      setScanResult({
        success: false,
        message: "QR code not recognized. Please check your registration."
      });
      toast({
        title: "Invalid QR Code",
        description: "This QR code is not registered for this event.",
        variant: "destructive",
      });
      return;
    }

    if (attendee.checked_in) {
      setScanResult({
        success: false,
        attendee,
        message: `${attendee.full_name} is already checked in.`
      });
      toast({
        title: "Already Checked In",
        description: `${attendee.full_name} was already checked in at ${attendee.check_in_time ? new Date(attendee.check_in_time).toLocaleTimeString() : 'unknown time'}.`,
        variant: "destructive",
      });
      return;
    }

    const success = await onCheckIn(mockId);
    if (success) {
      setScanResult({
        success: true,
        attendee,
        message: `Successfully checked in ${attendee.full_name}!`
      });
      toast({
        title: "Check-in Successful",
        description: `${attendee.full_name} has been checked in.`,
      });
    }
    
    setLastScanned(mockId);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Interface */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
              <Scan className="h-6 w-6 text-blue-600" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Point the camera at the attendee's QR code to check them in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera View */}
            <div className="relative">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                {isCameraOn || isLoading ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ 
                        transform: 'scaleX(-1)', // Mirror the video for better UX
                        backgroundColor: '#000'
                      }}
                    />
                    {/* Loading overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p className="text-sm">Starting camera...</p>
                        </div>
                      </div>
                    )}
                    {/* Scanning overlay - only show when camera is actually on */}
                    {isCameraOn && !isLoading && (
                      <div className="absolute inset-0 border-2 border-blue-500 border-dashed animate-pulse">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-48 h-48 border-4 border-blue-500 bg-blue-500/10 rounded-lg">
                            <div className="w-full h-full flex items-center justify-center">
                              <p className="text-white font-medium text-center px-2">Position QR Code Here</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400 p-4">
                      {cameraError ? (
                        <>
                          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-orange-400" />
                          <p className="text-lg font-medium text-orange-400">Camera Error</p>
                          <p className="text-sm mt-2">{cameraError}</p>
                        </>
                      ) : (
                        <>
                          <CameraOff className="h-16 w-16 mx-auto mb-4" />
                          <p className="text-lg font-medium">Camera is off</p>
                          <p className="text-sm">Click "Start Camera" to begin scanning</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Camera Controls */}
            <div className="flex gap-3">
              {!isCameraOn ? (
                <Button 
                  onClick={startCamera}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={stopCamera}
                  variant="destructive"
                  className="flex-1"
                >
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              )}
            </div>

            {/* Mobile Camera Tips */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">📱 Mobile Tips:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Allow camera permissions when prompted</li>
                <li>• If camera doesn't show, try refreshing the page</li>
                <li>• Use the rear camera for better QR scanning</li>
                <li>• Ensure good lighting for clear scanning</li>
                <li>• Hold the QR code steady in the frame</li>
              </ul>
            </div>

            {/* Demo Buttons for Testing */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">Demo - Test with sample attendees:</p>
              <div className="grid grid-cols-2 gap-2">
                {attendees.slice(0, 4).map((attendee, index) => (
                  <Button 
                    key={attendee.id}
                    variant="outline" 
                    size="sm"
                    onClick={() => simulateQRScan(attendee.id)}
                  >
                    Scan {attendee.full_name.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scan Results */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Scan Results</CardTitle>
            <CardDescription>Latest scan status and attendee information</CardDescription>
          </CardHeader>
          <CardContent>
            {scanResult ? (
              <div className={`p-6 rounded-lg ${scanResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {scanResult.success ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <Badge 
                      variant="secondary" 
                      className={scanResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {scanResult.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                </div>
                
                <p className={`font-medium mb-3 ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {scanResult.message}
                </p>

                {scanResult.attendee && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-700">Name</p>
                        <p className="text-gray-600">{scanResult.attendee.full_name}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Business Area</p>
                        <p className="text-gray-600">{scanResult.attendee.business_area}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Email</p>
                        <p className="text-gray-600">{scanResult.attendee.continental_email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Status</p>
                        <Badge 
                          variant="secondary" 
                          className={scanResult.attendee.checked_in ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                        >
                          {scanResult.attendee.checked_in ? 'Checked In' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    
                    {scanResult.attendee.vegetarian_vegan_option === 'Yes' && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="font-medium text-yellow-800">🥗 Dietary Requirements</p>
                        <p className="text-yellow-700 text-sm">Vegetarian/Vegan option required</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  Scanned at {new Date().toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Scan className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Ready to Scan</p>
                <p className="text-sm">No QR codes scanned yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRScanner;
