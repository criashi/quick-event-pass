import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, CheckCircle, XCircle, Scan, AlertTriangle } from "lucide-react";
import { Attendee } from "@/types/attendee";
import { toast } from "@/hooks/use-toast";
import QrScanner from "qr-scanner";

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
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const processQRCode = async (result: string) => {
    const now = Date.now();
    
    // Prevent duplicate scans - both same content and time-based cooldown
    if (result === lastScanned || now - lastScanTimeRef.current < 3000) {
      console.log('Duplicate scan prevented:', { result, lastScanned, timeSinceLastScan: now - lastScanTimeRef.current });
      return;
    }

    // Prevent multiple simultaneous scans
    if (isScanning) {
      console.log('Scan already in progress, ignoring');
      return;
    }

    console.log('QR Code scanned:', result);
    setLastScanned(result);
    lastScanTimeRef.current = now;
    setIsScanning(true);
    
    // Try to extract attendee ID from QR code data
    let attendeeId = result;
    
    // Handle different QR code formats
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(result);
      if (parsed.attendeeId) {
        attendeeId = parsed.attendeeId;
      } else if (parsed.id) {
        attendeeId = parsed.id;
      } else if (parsed.attendee_id) {
        attendeeId = parsed.attendee_id;
      }
    } catch {
      // If not JSON, check if it's a URL or contains an ID
      if (result.includes('attendee_id=')) {
        const urlParams = new URLSearchParams(result.split('?')[1] || result);
        attendeeId = urlParams.get('attendee_id') || result;
      } else if (result.includes('id=')) {
        const urlParams = new URLSearchParams(result.split('?')[1] || result);
        attendeeId = urlParams.get('id') || result;
      }
      // Otherwise use the raw result as attendee ID
    }

    console.log('Extracted attendee ID:', attendeeId);

    // Find attendee by ID or by matching QR code data
    const attendee = attendees.find(a => 
      a.id === attendeeId || 
      a.qr_code_data === result ||
      a.id === result
    );
    
    if (!attendee) {
      console.log('Available attendees:', attendees.map(a => ({ id: a.id, name: a.full_name, qr_code_data: a.qr_code_data })));
      setScanResult({
        success: false,
        message: `QR code not recognized. Scanned: ${result.substring(0, 50)}...`
      });
      toast({
        title: "Invalid QR Code",
        description: "This QR code is not registered for this event.",
        variant: "destructive",
      });
      setIsScanning(false);
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
      setIsScanning(false);
      return;
    }

    const success = await onCheckIn(attendee.id);
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
    
    setIsScanning(false);
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setCameraError("");
      console.log('Attempting to start camera...');

      if (!videoRef.current) {
        console.error('Video element not found in ref');
        setCameraError("Video element not found. Please try again.");
        setIsLoading(false);
        return;
      }

      console.log('Video element found, initializing QR scanner...');

      // Stop any existing scanner first
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }

      // Reset scan tracking
      setLastScanned("");
      lastScanTimeRef.current = 0;

      // Initialize QR Scanner with minimal interference
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => processQRCode(result.data),
        {
          onDecodeError: (error) => {
            console.debug('QR decode error (normal):', error);
          },
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 2, // Reduced from 3 to help prevent duplicates
        }
      );

      console.log('Starting QR scanner...');
      await qrScannerRef.current.start();
      
      setIsCameraOn(true);
      setIsLoading(false);
      console.log('QR scanner started successfully');

    } catch (error: any) {
      console.error('Error starting QR scanner:', error);
      setIsLoading(false);
      
      let errorMessage = "Could not access camera. ";
      
      if (error.name === 'NotAllowedError') {
        errorMessage += "Camera permission denied. Please allow camera access and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage += "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage += "Camera not supported in this browser. Try using Chrome or Safari.";
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
    console.log('Stopping QR scanner...');
    setIsLoading(false);
    
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
      console.log('QR scanner stopped and destroyed');
    }
    
    // Reset scan tracking
    setLastScanned("");
    lastScanTimeRef.current = 0;
    
    setIsCameraOn(false);
    setCameraError("");
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
                {/* Video element - let QR Scanner library handle it completely */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Camera off state overlay */}
                {!isCameraOn && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
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

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}

                {/* Scanning status */}
                {isCameraOn && !isLoading && (
                  <div className="absolute top-4 left-4 right-4 z-30">
                    <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm text-center">
                      {isScanning ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing QR Code...
                        </div>
                      ) : (
                        "Ready to scan - Position QR code in camera view"
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

            {/* Mobile QR Scanning Tips */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">📱 QR Scanning Tips:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Allow camera permissions when prompted</li>
                <li>• Hold the QR code steady in the camera view</li>
                <li>• Ensure good lighting for clear scanning</li>
                <li>• The scanner will automatically detect QR codes</li>
                <li>• Green outline indicates successful detection</li>
                <li>• Move the QR code away after scanning to avoid duplicates</li>
              </ul>
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
                <div className="text-lg font-medium mb-2">Ready to Scan</div>
                <p className="text-sm">Start the camera and point it at a QR code to begin check-in</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRScanner;
