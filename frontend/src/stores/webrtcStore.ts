import { create } from 'zustand'
import SimplePeer from 'simple-peer'

interface WebRTCState {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  peer: SimplePeer.Instance | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
}

interface WebRTCStore extends WebRTCState {
  setLocalStream: (stream: MediaStream | null) => void
  setRemoteStream: (stream: MediaStream | null) => void
  setPeer: (peer: SimplePeer.Instance | null) => void
  toggleVideo: () => void
  toggleAudio: () => void
  setScreenSharing: (sharing: boolean) => void
  reset: () => void
}

const initialState: WebRTCState = {
  localStream: null,
  remoteStream: null,
  peer: null,
  isVideoEnabled: true,
  isAudioEnabled: true,
  isScreenSharing: false,
}

export const useWebRTCStore = create<WebRTCStore>((set, get) => ({
  ...initialState,

  setLocalStream: (stream) => set({ localStream: stream }),

  setRemoteStream: (stream) => set({ remoteStream: stream }),

  setPeer: (peer) => set({ peer }),

  toggleVideo: () => {
    const { localStream, isVideoEnabled } = get()
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled
      })
      set({ isVideoEnabled: !isVideoEnabled })
    }
  },

  toggleAudio: () => {
    const { localStream, isAudioEnabled } = get()
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled
      })
      set({ isAudioEnabled: !isAudioEnabled })
    }
  },

  setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),

  reset: () => {
    const { localStream, remoteStream, peer } = get()
    
    // Clean up streams
    localStream?.getTracks().forEach((track) => track.stop())
    remoteStream?.getTracks().forEach((track) => track.stop())
    
    // Destroy peer connection
    peer?.destroy()
    
    set(initialState)
  },
}))
