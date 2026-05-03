import { useEffect, useRef, useState } from 'react'
import { SkipForward, UserPlus, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useChat } from '@/hooks/useChat'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useAuth } from '@/hooks/useAuth'

export default function VideoChatPage() {
  const { user } = useAuth()
  const {
    currentChat,
    isSearching,
    searchChat,
    cancelSearch,
    endChat,
    skipChat,
    addFriend,
  } = useChat()

  const {
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
  } = useWebRTC(currentChat?.id || null)

  const [interests, setInterests] = useState('')
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const hasStartedCallRef = useRef(false)

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Start call when chat is established
  // Determine initiator by user ID: lower ID becomes the initiator (sends offer)
  useEffect(() => {
    if (currentChat && !localStream && !hasStartedCallRef.current) {
      hasStartedCallRef.current = true
      const otherUserId = currentChat.other_user?.id
      const isInitiator = otherUserId !== undefined && user?.id !== undefined
        ? user.id < otherUserId
        : true
      console.log('[VideoChat] Starting call as', isInitiator ? 'initiator' : 'responder',
        '(my ID:', user?.id, ', other ID:', otherUserId, ')')
      startCall(isInitiator)
    }
  }, [currentChat, localStream, startCall, user?.id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hasStartedCallRef.current = false
      endCall()
    }
  }, [endCall])

  const handleStartChat = () => {
    const interestList = interests.split(',').map(i => i.trim()).filter(Boolean)
    searchChat('video', interestList)
  }

  const handleEndChat = () => {
    hasStartedCallRef.current = false
    endCall()
    endChat()
  }

  const handleSkipChat = () => {
    hasStartedCallRef.current = false
    endCall()
    skipChat()
  }

  if (isSearching) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Looking for a match...</h2>
            <p className="text-muted-foreground text-center mb-6">
              We're finding someone for you to video chat with
            </p>
            <Button variant="outline" onClick={cancelSearch}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentChat) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <h2 className="text-xl font-semibold">Start Video Chat</h2>
            <p className="text-muted-foreground">
              Video chat anonymously with people from around the world
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Interests (optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="gaming, music, movies (comma separated)"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add interests to find people with similar hobbies
              </p>
            </div>
            <Button onClick={handleStartChat} className="w-full">
              Start Video Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 bg-black p-4">
        <div className="relative h-full max-w-6xl mx-auto">
          {/* Remote Video (Main) */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Waiting for other user...</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* User Info Overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-black/50 text-white">
              {currentChat.other_user?.username || 'Unknown'}
            </Badge>
            {currentChat.interests && currentChat.interests.length > 0 && (
              <Badge variant="outline" className="bg-black/50 text-white border-white/50">
                {currentChat.interests.join(', ')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t bg-card p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-4">
          <Button
            variant={isAudioEnabled ? 'outline' : 'destructive'}
            size="icon"
            onClick={toggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isVideoEnabled ? 'outline' : 'destructive'}
            size="icon"
            onClick={toggleVideo}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isScreenSharing ? 'default' : 'outline'}
            size="icon"
            onClick={toggleScreenShare}
          >
            <Monitor className="h-5 w-5" />
          </Button>

          <Button variant="outline" onClick={() => addFriend()}>
            <UserPlus className="h-5 w-5 mr-2" />
            Add Friend
          </Button>

          <Button variant="outline" onClick={handleSkipChat}>
            <SkipForward className="h-5 w-5 mr-2" />
            Skip
          </Button>

          <Button variant="destructive" onClick={handleEndChat}>
            <PhoneOff className="h-5 w-5 mr-2" />
            End
          </Button>
        </div>
      </div>
    </div>
  )
}
