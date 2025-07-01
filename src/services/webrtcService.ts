
import { supabase } from '@/integrations/supabase/client';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left';
  data: unknown;
  from: string;
  to?: string;
  sessionId: string;
}

export class WebRTCService {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private sessionId: string;
  private userId: string;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private isCleaningUp: boolean = false;
  private onRemoteStreamCallback?: (userId: string, stream: MediaStream) => void;
  private onUserLeftCallback?: (userId: string) => void;
  private onConnectionStateCallback?: (state: string) => void;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  async initialize(localVideoElement: HTMLVideoElement) {
    try {
      console.log('Initializing WebRTC service...');
      
      // Get user media with error handling
      this.localStream = await this.getUserMedia();
      
      if (localVideoElement) {
        localVideoElement.srcObject = this.localStream;
      }

      // Setup Supabase channel for signaling
      this.setupSignalingChannel();

      console.log('WebRTC service initialized successfully');
      return this.localStream;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      this.onConnectionStateCallback?.('failed');
      throw error;
    }
  }

  private async getUserMedia(): Promise<MediaStream> {
    try {
      console.log('Requesting user media...');
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('User media obtained successfully');
      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      
      // Try with more basic constraints
      try {
        console.log('Trying with basic constraints...');
        const basicStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log('Basic user media obtained');
        return basicStream;
      } catch (basicError) {
        console.error('Basic user media also failed:', basicError);
        throw new Error('Camera and microphone access denied or unavailable');
      }
    }
  }

  private setupSignalingChannel() {
    if (this.channel || this.isCleaningUp) {
      console.log('Channel already exists or cleaning up, skipping setup');
      return;
    }

    try {
      console.log('Setting up signaling channel...');
      this.channel = supabase.channel(`webrtc-${this.sessionId}`)
        .on('broadcast', { event: 'signaling' }, (payload) => {
          if (!this.isCleaningUp) {
            this.handleSignalingMessage(payload.payload as SignalingMessage);
          }
        })
        .subscribe((status) => {
          console.log('Channel subscription status:', status);
          if (status === 'SUBSCRIBED' && !this.isCleaningUp) {
            this.onConnectionStateCallback?.('connected');
            this.sendSignalingMessage({
              type: 'user-joined',
              data: {},
              from: this.userId,
              sessionId: this.sessionId
            });
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to WebRTC channel');
            this.onConnectionStateCallback?.('failed');
          }
        });
    } catch (error) {
      console.error('Error setting up signaling channel:', error);
      this.onConnectionStateCallback?.('failed');
    }
  }

  private async handleSignalingMessage(message: SignalingMessage) {
    if (message.from === this.userId || this.isCleaningUp) return;

    console.log('Received signaling message:', message.type, 'from:', message.from);

    try {
      switch (message.type) {
        case 'user-joined':
          await this.createPeerConnection(message.from, true);
          break;
        case 'offer':
          await this.handleOffer(message.from, message.data as RTCSessionDescriptionInit);
          break;
        case 'answer':
          await this.handleAnswer(message.from, message.data as RTCSessionDescriptionInit);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(message.from, message.data);
          break;
        case 'user-left':
          this.handleUserLeft(message.from);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  private async createPeerConnection(userId: string, isInitiator: boolean) {
    if (this.isCleaningUp) return;

    console.log('Creating peer connection for user:', userId, 'initiator:', isInitiator);

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    };

    const peerConnection = new RTCPeerConnection(configuration);
    this.peerConnections.set(userId, peerConnection);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from:', userId);
      if (this.onRemoteStreamCallback && !this.isCleaningUp) {
        this.onRemoteStreamCallback(userId, event.streams[0]);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && !this.isCleaningUp) {
        console.log('Sending ICE candidate to:', userId);
        this.sendSignalingMessage({
          type: 'ice-candidate',
          data: event.candidate,
          from: this.userId,
          to: userId,
          sessionId: this.sessionId
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed') {
        console.log('Peer connection failed, attempting to restart');
        this.restartIce(userId);
      }
    };

    // Create offer if initiator
    if (isInitiator && !this.isCleaningUp) {
      try {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await peerConnection.setLocalDescription(offer);
        
        this.sendSignalingMessage({
          type: 'offer',
          data: offer,
          from: this.userId,
          to: userId,
          sessionId: this.sessionId
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
  }

  private async restartIce(userId: string) {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection && !this.isCleaningUp) {
      try {
        await peerConnection.restartIce();
      } catch (error) {
        console.error('Error restarting ICE:', error);
      }
    }
  }

  private async handleOffer(from: string, offer: RTCSessionDescriptionInit) {
    if (this.isCleaningUp) return;

    console.log('Handling offer from:', from);

    let peerConnection = this.peerConnections.get(from);
    
    if (!peerConnection) {
      await this.createPeerConnection(from, false);
      peerConnection = this.peerConnections.get(from);
    }

    if (peerConnection && !this.isCleaningUp) {
      try {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        this.sendSignalingMessage({
          type: 'answer',
          data: answer,
          from: this.userId,
          to: from,
          sessionId: this.sessionId
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    }
  }

  private async handleAnswer(from: string, answer: RTCSessionDescriptionInit) {
    if (this.isCleaningUp) return;

    console.log('Handling answer from:', from);

    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }

  private async handleIceCandidate(from: string, candidate: RTCIceCandidateInit) {
    if (this.isCleaningUp) return;

    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  private handleUserLeft(userId: string) {
    console.log('User left:', userId);
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }
    
    if (this.onUserLeftCallback && !this.isCleaningUp) {
      this.onUserLeftCallback(userId);
    }
  }

  private sendSignalingMessage(message: SignalingMessage) {
    if (this.channel && !this.isCleaningUp) {
      try {
        this.channel?.send({
          type: 'broadcast',
          event: 'signaling',
          payload: message
        });
      } catch (error) {
        console.error('Error sending signaling message:', error);
      }
    }
  }

  onRemoteStream(callback: (userId: string, stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onUserLeft(callback: (userId: string) => void) {
    this.onUserLeftCallback = callback;
  }

  onConnectionState(callback: (state: string) => void) {
    this.onConnectionStateCallback = callback;
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('Audio muted:', !audioTrack.enabled);
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log('Video disabled:', !videoTrack.enabled);
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  getConnectionStats() {
    const stats = {
      totalConnections: this.peerConnections.size,
      connections: {} as Record<string, string>
    };

    this.peerConnections.forEach((pc, userId) => {
      stats.connections[userId] = pc.connectionState;
    });

    return stats;
  }

  cleanup() {
    console.log('Cleaning up WebRTC service...');
    this.isCleaningUp = true;

    // Send user left message before cleanup
    if (this.channel) {
      try {
        this.sendSignalingMessage({
          type: 'user-left',
          data: {},
          from: this.userId,
          sessionId: this.sessionId
        });
      } catch (error) {
        console.error('Error sending user left message:', error);
      }
    }

    // Close all peer connections
    this.peerConnections.forEach((pc, userId) => {
      try {
        console.log('Closing peer connection for:', userId);
        pc.close();
      } catch (error) {
        console.error('Error closing peer connection:', error);
      }
    });
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.error('Error stopping track:', error);
        }
      });
      this.localStream = null;
    }

    // Unsubscribe from channel
    if (this.channel) {
      try {
        this.channel?.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from channel:', error);
      } finally {
        this.channel = null;
      }
    }

    console.log('WebRTC cleanup completed');
  }
}
