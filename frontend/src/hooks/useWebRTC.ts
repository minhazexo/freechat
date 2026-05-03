import { useCallback, useEffect, useRef } from 'react'
import SimplePeer from 'simple-peer'
import { useWebRTCStore } from '@/stores/webrtcStore'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'
import { subscribeToUser } from '@/services/websocket'
import { toast } from 'sonner'

type SignalData = {
  type: 'offer' | 'answer' | 'candidate'
  sdp?: string
  candidate?: string
  sdpMid?: string | null
  sdpMLineIndex?: number | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PeerSignal = (data: any) => void

export const useWebRTC = (chatId: number | null) => {
  const { user } = useAuthStore()
  const {
    localStream,
    remoteStream,
    peer,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    setLocalStream,
    setRemoteStream,
    setPeer,
    toggleVideo,
    toggleAudio,
    setScreenSharing,
    reset,
  } = useWebRTCStore()

  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Initialize media stream
  const initMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setLocalStream(stream)
      return stream
    } catch (error) {
      console.error('Failed to get media stream:', error)
      toast.error('Failed to access camera/microphone')
      return null
    }
  }, [setLocalStream])

  // Create peer connection (initiator)
  const createPeer = useCallback((stream: MediaStream, initiator: boolean) => {
    const newPeer = new SimplePeer({
      initiator,
      trickle: false,
      stream,
    })

    newPeer.on('signal', async (data) => {
      try {
        if (data.type === 'offer') {
          await api.post('/signaling/offer', {
            chat_id: chatId,
            sdp: data.sdp,
            type: data.type,
          })
        } else if (data.type === 'answer') {
          await api.post('/signaling/answer', {
            chat_id: chatId,
            sdp: data.sdp,
            type: data.type,
          })
        }
      } catch (error) {
        console.error('Signaling error:', error)
      }
    })

    newPeer.on('stream', (remoteStream) => {
      setRemoteStream(remoteStream)
    })

    newPeer.on('error', (err) => {
      console.error('Peer error:', err)
      toast.error('Connection error')
    })

    newPeer.on('close', () => {
      setRemoteStream(null)
    })

    setPeer(newPeer)
    return newPeer
  }, [chatId, setPeer, setRemoteStream])

  // Subscribe to WebRTC signaling
  useEffect(() => {
    if (!chatId || !user) return

    unsubscribeRef.current = subscribeToUser(user.id, {
      onOffer: (data: unknown) => {
        const offerData = data as { sdp: string; from_user_id: number }
        if (peer && !peer.destroyed) {
          peer.signal({ type: 'offer', sdp: offerData.sdp })
        }
      },
      onAnswer: (data: unknown) => {
        const answerData = data as { sdp: string; from_user_id: number }
        if (peer && !peer.destroyed) {
          peer.signal({ type: 'answer', sdp: answerData.sdp })
        }
      },
      onIceCandidate: (data: unknown) => {
        const iceData = data as { candidate: string; sdp_mid?: string; sdp_m_line_index?: number }
        if (peer && !peer.destroyed) {
          const signalData: SignalData = {
            type: 'candidate',
            candidate: iceData.candidate,
            sdpMid: iceData.sdp_mid || null,
            sdpMLineIndex: iceData.sdp_m_line_index ?? null,
          }
          ;(peer.signal as PeerSignal)(signalData)
        }
      },
      onToggleMedia: (data: unknown) => {
        const mediaData = data as { media_type: 'video' | 'audio'; enabled: boolean }
        toast.info(`Other user ${mediaData.enabled ? 'enabled' : 'disabled'} ${mediaData.media_type}`)
      },
      onScreenShare: (data: unknown) => {
        const screenData = data as { active: boolean }
        toast.info(`Other user ${screenData.active ? 'started' : 'stopped'} screen sharing`)
      },
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [chatId, user?.id, peer])

  // Start video call
  const startCall = useCallback(async (initiator: boolean) => {
    const stream = await initMediaStream()
    if (stream) {
      createPeer(stream, initiator)
    }
  }, [initMediaStream, createPeer])

  // End call
  const endCall = useCallback(() => {
    reset()
  }, [reset])

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (!localStream) return

    try {
      if (isScreenSharing) {
        // Stop screen sharing and return to camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        
        // Replace track in peer connection
        if (peer && !peer.destroyed) {
          const videoTrack = cameraStream.getVideoTracks()[0]
          const sender = (peer as unknown as { _pc: RTCPeerConnection })._pc
            .getSenders()
            .find((s) => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        }
        
        setLocalStream(cameraStream)
        setScreenSharing(false)
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })
        
        // Replace track in peer connection
        if (peer && !peer.destroyed) {
          const videoTrack = screenStream.getVideoTracks()[0]
          const sender = (peer as unknown as { _pc: RTCPeerConnection })._pc
            .getSenders()
            .find((s) => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        }
        
        // Stop camera stream
        localStream.getTracks().forEach((track) => track.stop())
        
        setLocalStream(screenStream)
        setScreenSharing(true)
        
        // Notify other user
        await api.post('/signaling/screen-share', {
          chat_id: chatId,
          active: true,
        })
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = async () => {
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
          setLocalStream(cameraStream)
          setScreenSharing(false)
          
          await api.post('/signaling/screen-share', {
            chat_id: chatId,
            active: false,
          })
        }
      }
    } catch (error) {
      console.error('Screen share error:', error)
      toast.error('Failed to toggle screen share')
    }
  }, [localStream, peer, isScreenSharing, chatId, setLocalStream, setScreenSharing])

  // Send ICE candidate
  const sendIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    if (!chatId) return

    try {
      await api.post('/signaling/ice-candidate', {
        chat_id: chatId,
        candidate: candidate.candidate,
        sdp_mid: candidate.sdpMid,
        sdp_m_line_index: candidate.sdpMLineIndex,
      })
    } catch (error) {
      console.error('Send ICE candidate error:', error)
    }
  }, [chatId])

  // Toggle media and notify
  const handleToggleVideo = useCallback(async () => {
    toggleVideo()
    
    if (chatId) {
      try {
        await api.post('/signaling/toggle-media', {
          chat_id: chatId,
          media_type: 'video',
          enabled: !isVideoEnabled,
        })
      } catch (error) {
        console.error('Toggle media error:', error)
      }
    }
  }, [chatId, isVideoEnabled, toggleVideo])

  const handleToggleAudio = useCallback(async () => {
    toggleAudio()
    
    if (chatId) {
      try {
        await api.post('/signaling/toggle-media', {
          chat_id: chatId,
          media_type: 'audio',
          enabled: !isAudioEnabled,
        })
      } catch (error) {
        console.error('Toggle media error:', error)
      }
    }
  }, [chatId, isAudioEnabled, toggleAudio])

  return {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    startCall,
    endCall,
    toggleVideo: handleToggleVideo,
    toggleAudio: handleToggleAudio,
    toggleScreenShare,
    sendIceCandidate,
  }
}
