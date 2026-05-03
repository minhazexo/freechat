import { useEffect, useState } from 'react'
import { MessageSquare, Video, UserPlus, Flag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/services/api'
import { ChatHistory } from '@/types'
import { toast } from 'sonner'
import { formatDate, formatDuration } from '@/lib/utils'
import { logError } from '@/lib/errorHandler'

export default function HistoryPage() {
  const [histories, setHistories] = useState<ChatHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'text' | 'video'>('all')

  const fetchHistory = async () => {
    try {
      const response = await api.get('/user/history', {
        params: { type: filter === 'all' ? undefined : filter },
      })
      setHistories(response.data.histories || [])
    } catch (error) {
      logError('FetchHistory', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [filter])

  const HistoryCard = ({ history }: { history: ChatHistory }) => (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={history.other_user?.avatar} />
          <AvatarFallback>
            {history.other_user?.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{history.other_user?.username || 'Unknown'}</p>
            <Badge variant="outline" className="text-xs">
              {history.type === 'video' ? (
                <Video className="h-3 w-3 mr-1" />
              ) : (
                <MessageSquare className="h-3 w-3 mr-1" />
              )}
              {history.type}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(history.started_at || '')}
            </span>
            <span>{formatDuration(history.duration_seconds)}</span>
            <span>{history.message_count} messages</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {history.was_friend_added && (
              <Badge variant="secondary" className="text-xs">
                <UserPlus className="h-3 w-3 mr-1" />
                Friend added
              </Badge>
            )}
            {history.was_reported && (
              <Badge variant="destructive" className="text-xs">
                <Flag className="h-3 w-3 mr-1" />
                Reported
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Chat History</h1>
        <p className="text-muted-foreground">
          View your past conversations
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <Card>
            <CardHeader>
              <CardTitle>Your Chats</CardTitle>
              <CardDescription>
                {filter === 'all' ? 'All your conversations' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} chats`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {histories.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No chat history</p>
                  <p className="text-sm text-muted-foreground">
                    Start chatting to see your history here
                  </p>
                  <Button className="mt-4" onClick={() => window.location.href = '/chat'}>
                    Start Chatting
                  </Button>
                </div>
              ) : (
                histories.map((history) => (
                  <HistoryCard key={history.id} history={history} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
