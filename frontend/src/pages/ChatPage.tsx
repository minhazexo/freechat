import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Send, SkipForward, UserPlus, PhoneOff, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'

const SEARCH_TIMEOUT_SECONDS = 60

export default function ChatPage() {
  const { user } = useAuth()
  const location = useLocation()
  const autoSearch = (location.state as { autoSearch?: boolean })?.autoSearch
  const {
    currentChat,
    messages,
    isSearching,
    otherUserTyping,
    searchChat,
    cancelSearch,
    sendMessage,
    handleTyping,
    endChat,
    skipChat,
    addFriend,
  } = useChat()

  const [messageInput, setMessageInput] = useState('')
  const [interests, setInterests] = useState('')
  const [searchSeconds, setSearchSeconds] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Countdown timer while searching
  useEffect(() => {
    if (isSearching) {
      setSearchSeconds(0)
      timerRef.current = setInterval(() => {
        setSearchSeconds(prev => {
          if (prev >= SEARCH_TIMEOUT_SECONDS) {
            if (timerRef.current) clearInterval(timerRef.current)
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setSearchSeconds(0)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isSearching])

  // Auto-start search when navigated from HomePage after anonymous login
  useEffect(() => {
    if (autoSearch && !currentChat && !isSearching) {
      const interestList = interests.split(',').map(i => i.trim()).filter(Boolean)
      searchChat('text', interestList)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSearch])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    const ok = await sendMessage(messageInput)
    if (ok) setMessageInput('')
  }

  const handleStartChat = () => {
    const interestList = interests.split(',').map(i => i.trim()).filter(Boolean)
    searchChat('text', interestList)
  }

  const handleAddFriend = () => {
    addFriend()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const remainingSeconds = Math.max(0, SEARCH_TIMEOUT_SECONDS - searchSeconds)
  const progressPercent = (searchSeconds / SEARCH_TIMEOUT_SECONDS) * 100

  if (isSearching) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="absolute -bottom-1 -right-1 bg-card border-2 border-primary rounded-full p-1">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Looking for a match...</h2>
            <p className="text-muted-foreground text-center mb-2">
              We're finding someone for you to chat with
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Time elapsed: {formatTime(searchSeconds)} • {remainingSeconds}s remaining
            </p>
            {/* Progress bar */}
            <div className="w-full max-w-xs bg-muted rounded-full h-2 mb-6">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
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
            <h2 className="text-xl font-semibold">Start Text Chat</h2>
            <p className="text-muted-foreground">
              Chat anonymously with people from around the world
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Interests (optional)</label>
              <Input
                placeholder="gaming, music, movies (comma separated)"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add interests to find people with similar hobbies
              </p>
            </div>
            <Button onClick={handleStartChat} className="w-full">
              Start Chatting
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Chat Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={currentChat.other_user?.avatar} />
              <AvatarFallback>
                {currentChat.other_user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{currentChat.other_user?.username || 'Unknown'}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {currentChat.other_user?.is_online ? 'Online' : 'Offline'}
                </Badge>
                {currentChat.interests && currentChat.interests.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {currentChat.interests.join(', ')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAddFriend}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
            <Button variant="outline" size="sm" onClick={skipChat}>
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
            <Button variant="destructive" size="sm" onClick={() => endChat()}>
              <PhoneOff className="h-4 w-4 mr-2" />
              End
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-6xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.user_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex items-start gap-2 max-w-[70%] ${
                  message.user_id === user?.id ? 'flex-row-reverse' : ''
                }`}
              >
                {message.user_id !== user?.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.avatar} />
                    <AvatarFallback>{message.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.type === 'system'
                      ? 'bg-muted text-muted-foreground text-center text-sm'
                      : message.user_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.type !== 'system' && message.user_id !== user?.id && (
                    <p className="text-xs font-medium mb-1">{message.username}</p>
                  )}
                  <p>{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {otherUserTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="max-w-6xl mx-auto flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value)
              handleTyping()
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!messageInput.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
