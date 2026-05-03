import { useEffect, useState } from 'react'
import { Check, X, UserPlus, UserMinus, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/services/api'
import { Friend } from '@/types'
import { toast } from 'sonner'
import { logError } from '@/lib/errorHandler'

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends')
      setFriends(response.data.friends || [])
      setPendingRequests(response.data.pending_requests || [])
      setSentRequests(response.data.sent_requests || [])
    } catch (error) {
      logError('FetchFriends', error)
      toast.error('Failed to load friends')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [])

  const handleAcceptRequest = async (userId: number) => {
    try {
      await api.post('/friends/accept', { user_id: userId })
      toast.success('Friend request accepted')
      fetchFriends()
    } catch (error) {
      logError('AcceptRequest', error)
      toast.error('Failed to accept request')
    }
  }

  const handleRejectRequest = async (userId: number) => {
    try {
      await api.post('/friends/reject', { user_id: userId })
      toast.success('Friend request rejected')
      fetchFriends()
    } catch (error) {
      logError('RejectRequest', error)
      toast.error('Failed to reject request')
    }
  }

  const handleRemoveFriend = async (userId: number) => {
    try {
      await api.delete('/friends', { data: { user_id: userId } })
      toast.success('Friend removed')
      fetchFriends()
    } catch (error) {
      logError('RemoveFriend', error)
      toast.error('Failed to remove friend')
    }
  }

  const FriendCard = ({ friend, actions }: { friend: Friend; actions: React.ReactNode }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={friend.avatar} />
          <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{friend.username}</p>
          <div className="flex items-center gap-2">
            <Badge variant={friend.is_online ? 'default' : 'secondary'} className="text-xs">
              {friend.is_online ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions}
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
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Friends</h1>
        <p className="text-muted-foreground">
          Manage your friends and pending requests
        </p>
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="friends">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>Your Friends</CardTitle>
              <CardDescription>
                People you've connected with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No friends yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add friends during chats to see them here
                  </p>
                </div>
              ) : (
                friends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    actions={
                      <>
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFriend(friend.user_id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </>
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>
                People who want to be your friend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <FriendCard
                    key={request.id}
                    friend={request}
                    actions={
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAcceptRequest(request.user_id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(request.user_id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </>
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Requests</CardTitle>
              <CardDescription>
                Friend requests you've sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No sent requests</p>
                </div>
              ) : (
                sentRequests.map((request) => (
                  <FriendCard
                    key={request.id}
                    friend={request}
                    actions={
                      <Badge variant="secondary">Pending</Badge>
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
