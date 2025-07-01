
import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, Shield, AlertTriangle } from 'lucide-react';
import { useSecureEventData } from '@/hooks/useSecureEventData';
import { validateQRData, logSecurityEvent } from '@/utils/security';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SecureQRScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const { checkInAttendee } = useSecureEventData();

  const SCAN_COOLDOWN = 3000; // 3 seconds between scans

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.destroy();
      }
    };
  }, [scanner]);

  const handleScan = async (result: QrScanner.ScanResult) => {
    const now = Date.now();
    
    // Implement scan cooldown to prevent rapid-fire scanning
    if (now - lastScanTime < SCAN_COOLDOWN) {
      return;
    }
    
    setLastScanTime(now);
    
    try {
      const qrData = result.data.trim();
      
      // Validate QR data before processing
      if (!validateQRData(qrData)) {
        setError('Invalid QR code format detected');
        await logSecurityEvent('INVALID_QR_SCAN_ATTEMPT', undefined, undefined, undefined, { 
          qrData: qrData.substring(0, 50) // Log only first 50 chars for security 
        });
        return;
      }

      // Attempt to check in the attendee
      const success = await checkInAttendee(qrData, qrData);
      
      if (success) {
        setError('');
        await logSecurityEvent('QR_CHECKIN_SUCCESS', 'attendees', qrData);
        
        // Briefly pause scanning after successful check-in
        if (scanner) {
          scanner.stop();
          setTimeout(() => {
            if (scanner && isScanning) {
              scanner.start();
            }
          }, 2000);
        }
      } else {
        setError('Check-in failed - please try again');
        await logSecurityEvent('QR_CHECKIN_FAILED', 'attendees', qrData);
      }
    } catch (error) {
      console.error('QR scan error:', error);
      setError('An error occurred while processing the QR code');
      await logSecurityEvent('QR_SCAN_EXCEPTION', undefined, undefined, undefined, { 
        error: String(error) 
      });
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      const qrScanner = new QrScanner(
        videoRef.current,
        handleScan,
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 1, // Limit scan frequency
        }
      );

      await qrScanner.start();
      setScanner(qrScanner);
      setIsScanning(true);
      setError('');
      await logSecurityEvent('QR_SCANNER_STARTED');
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      setError('Failed to start camera. Please check permissions.');
      await logSecurityEvent('QR_SCANNER_START_ERROR', undefined, undefined, undefined, { 
        error: String(error) 
      });
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      scanner.stop();
      scanner.destroy();
      setScanner(null);
    }
    setIsScanning(false);
    setError('');
    await logSecurityEvent('QR_SCANNER_STOPPED');
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-continental-white border-continental-gray3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-continental-black font-continental">
          <Camera className="h-5 w-5 text-continental-yellow" />
          Secure QR Scanner
        </CardTitle>
        <CardDescription>
          Scan attendee QR codes for secure check-in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full rounded-lg border-2 border-continental-gray3"
            style={{ aspectRatio: '1:1', objectFit: 'cover' }}
          />
          {!isScanning && (
            <div className="absolute inset-0 bg-continental-gray4/80 rounded-lg flex items-center justify-center">
              <p className="text-continental-gray1">Camera off</p>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            QR codes are validated for security. Rapid scanning is limited to prevent abuse.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              className="flex-1 bg-continental-yellow text-continental-black hover:bg-continental-yellow/90 font-medium"
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Scanner
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="outline"
              className="flex-1 border-continental-gray2 text-continental-gray1 hover:bg-continental-gray4"
            >
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanner
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SecureQRScanner;
