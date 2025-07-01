
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, Users, Video, Mic, AlertCircle, CheckCircle } from 'lucide-react';
import { WebRTCService } from '@/services/webrtcService';

interface SessionDiagnosticsProps {
  webrtcService: WebRTCService | null;
  sessionId: string;
  userId: string;
  isVisible: boolean;
  onClose: () => void;
}

const SessionDiagnostics: React.FC<SessionDiagnosticsProps> = ({
  webrtcService,
  sessionId,
  userId,
  isVisible,
  onClose
}) => {
  const [diagnostics, setDiagnostics] = useState({
    webrtc: {
      status: 'unknown',
      connections: 0,
      localStream: false,
      errors: [] as string[]
    },
    network: {
      online: navigator.onLine,
      connection: 'unknown'
    },
    permissions: {
      camera: 'unknown',
      microphone: 'unknown'
    }
  });

  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    if (isVisible) {
      runDiagnostics();
    }
  }, [isVisible, webrtcService]);

  const runDiagnostics = async () => {
    setIsRunningTests(true);
    
    try {
      // Check permissions
      const permissions = await checkPermissions();
      
      // Check WebRTC status
      const webrtcStatus = checkWebRTCStatus();
      
      // Check network status
      const networkStatus = checkNetworkStatus();

      setDiagnostics({
        webrtc: webrtcStatus,
        network: networkStatus,
        permissions
      });
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const checkPermissions = async () => {
    const permissions = {
      camera: 'unknown',
      microphone: 'unknown'
    };

    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      permissions.camera = cameraPermission.state;
    } catch (error) {
      console.warn('Could not check camera permission:', error);
    }

    try {
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      permissions.microphone = microphonePermission.state;
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
    }

    return permissions;
  };

  const checkWebRTCStatus = () => {
    const status = {
      status: 'disconnected',
      connections: 0,
      localStream: false,
      errors: [] as string[]
    };

    if (webrtcService) {
      try {
        const stats = webrtcService.getConnectionStats();
        status.connections = stats.totalConnections;
        status.status = stats.totalConnections > 0 ? 'connected' : 'no_peers';
        
        // Check if we have local stream
        // This would need to be exposed by the WebRTC service
        status.localStream = true; // Placeholder
      } catch (error) {
        status.errors.push('Failed to get WebRTC stats');
        status.status = 'error';
      }
    } else {
      status.status = 'not_initialized';
    }

    return status;
  };

  const checkNetworkStatus = () => {
    return {
      online: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };
  };

  const testMediaAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Stop the stream immediately after testing
      stream.getTracks().forEach(track => track.stop());
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
      case 'connected':
      case true:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
      case 'error':
      case 'failed':
      case false:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted':
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'denied':
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Session Diagnostics</h2>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>

          <div className="space-y-6">
            {/* WebRTC Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="h-5 w-5" />
                  <span>WebRTC Connection</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagnostics.webrtc.status)}
                    <Badge className={getStatusColor(diagnostics.webrtc.status)}>
                      {diagnostics.webrtc.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Peer Connections</span>
                  <Badge variant="outline">{diagnostics.webrtc.connections}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Local Stream</span>
                  {getStatusIcon(diagnostics.webrtc.localStream.toString())}
                </div>
                {diagnostics.webrtc.errors.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-red-600">Errors:</span>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {diagnostics.webrtc.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Permissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="h-4 w-4" />
                    <span>Camera</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagnostics.permissions.camera)}
                    <Badge className={getStatusColor(diagnostics.permissions.camera)}>
                      {diagnostics.permissions.camera}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mic className="h-4 w-4" />
                    <span>Microphone</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagnostics.permissions.microphone)}
                    <Badge className={getStatusColor(diagnostics.permissions.microphone)}>
                      {diagnostics.permissions.microphone}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5" />
                  <span>Network</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Online Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagnostics.network.online.toString())}
                    <Badge className={getStatusColor(diagnostics.network.online ? 'connected' : 'disconnected')}>
                      {diagnostics.network.online ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Connection Type</span>
                  <Badge variant="outline">{diagnostics.network.connection}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Session ID</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {sessionId.substring(0, 8)}...
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span>User ID</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {userId.substring(0, 8)}...
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunningTests}
              className="flex-1"
            >
              {isRunningTests ? 'Running Tests...' : 'Refresh Diagnostics'}
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                const result = await testMediaAccess();
                if (result.success) {
                  alert('Media access test successful!');
                } else {
                  alert(`Media access test failed: ${result.error}`);
                }
              }}
            >
              Test Media Access
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDiagnostics;
