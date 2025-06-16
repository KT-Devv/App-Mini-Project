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

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  async initialize(localVideoElement: HTMLVideoElement) {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localVideoElement.srcObject = this.localStream;

      // Setup Supabase channel for signaling
      this.setupSignalingChannel();

      return this.localStream;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      throw error;
    }
  }

  private setupSignalingChannel() {
    // Don't create a new channel if one already exists or if we're cleaning up
    if (this.channel || this.isCleaningUp) {
      console.log('Channel already exists or cleaning up, skipping setup');
      return;
    }

    try {
      this.channel = supabase.channel(`webrtc-${this.sessionId}`)
        .on('broadcast', { event: 'signaling' }, (payload) => {
          if (!this.isCleaningUp) {
            this.handleSignalingMessage(payload.payload as SignalingMessage);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && !this.isCleaningUp) {
            // Only announce user joined after successful subscription
            this.sendSignalingMessage({
              type: 'user-joined',
              data: {},
              from: this.userId,
              sessionId: this.sessionId
            });
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to WebRTC channel');
          }
        });
    } catch (error) {
      console.error('Error setting up signaling channel:', error);
    }
  }

  private async handleSignalingMessage(message: SignalingMessage) {
    if (message.from === this.userId || this.isCleaningUp) return;

    console.log('Received signaling message:', message);

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
  }

  private async createPeerConnection(userId: string, isInitiator: boolean) {
    if (this.isCleaningUp) return;

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

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
        this.sendSignalingMessage({
          type: 'ice-candidate',
          data: event.candidate,
          from: this.userId,
          to: userId,
          sessionId: this.sessionId
        });
      }
    };

    // Create offer if initiator
    if (isInitiator && !this.isCleaningUp) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      this.sendSignalingMessage({
        type: 'offer',
        data: offer,
        from: this.userId,
        to: userId,
        sessionId: this.sessionId
      });
    }
  }

  private async handleOffer(from: string, offer: RTCSessionDescriptionInit) {
    if (this.isCleaningUp) return;

    let peerConnection = this.peerConnections.get(from);
    
    if (!peerConnection) {
      await this.createPeerConnection(from, false);
      peerConnection = this.peerConnections.get(from);
    }

    if (peerConnection && !this.isCleaningUp) {
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
    }
  }

  private async handleAnswer(from: string, answer: RTCSessionDescriptionInit) {
    if (this.isCleaningUp) return;

    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }

  private async handleIceCandidate(from: string, candidate: RTCIceCandidateInit) {
    if (this.isCleaningUp) return;

    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }

  private handleUserLeft(userId: string) {
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

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
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
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  cleanup() {
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
    this.peerConnections.forEach(pc => {
      try {
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
  }
}
