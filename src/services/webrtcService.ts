
import { supabase } from '@/integrations/supabase/client';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left';
  data: any;
  from: string;
  to?: string;
  sessionId: string;
}

export class WebRTCService {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private sessionId: string;
  private userId: string;
  private channel: any = null;
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
    // Don't create a new channel if one already exists
    if (this.channel) {
      console.log('Channel already exists, skipping setup');
      return;
    }

    this.channel = supabase.channel(`webrtc-${this.sessionId}`)
      .on('broadcast', { event: 'signaling' }, (payload) => {
        this.handleSignalingMessage(payload.payload as SignalingMessage);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Only announce user joined after successful subscription
          this.sendSignalingMessage({
            type: 'user-joined',
            data: {},
            from: this.userId,
            sessionId: this.sessionId
          });
        }
      });
  }

  private async handleSignalingMessage(message: SignalingMessage) {
    if (message.from === this.userId) return;

    console.log('Received signaling message:', message);

    switch (message.type) {
      case 'user-joined':
        await this.createPeerConnection(message.from, true);
        break;
      case 'offer':
        await this.handleOffer(message.from, message.data);
        break;
      case 'answer':
        await this.handleAnswer(message.from, message.data);
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
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(userId, event.streams[0]);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
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
    if (isInitiator) {
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
    let peerConnection = this.peerConnections.get(from);
    
    if (!peerConnection) {
      await this.createPeerConnection(from, false);
      peerConnection = this.peerConnections.get(from);
    }

    if (peerConnection) {
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
    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }

  private async handleIceCandidate(from: string, candidate: RTCIceCandidateInit) {
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
    
    if (this.onUserLeftCallback) {
      this.onUserLeftCallback(userId);
    }
  }

  private sendSignalingMessage(message: SignalingMessage) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'signaling',
        payload: message
      });
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
    // Send user left message
    if (this.channel) {
      this.sendSignalingMessage({
        type: 'user-left',
        data: {},
        from: this.userId,
        sessionId: this.sessionId
      });
    }

    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Unsubscribe from channel
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
