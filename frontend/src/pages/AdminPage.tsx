import { useEffect, useState } from 'react'
import { Users, MessageSquare, Flag, Shield, Ban, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/services/api'
import { DashboardStats, User, Report } from '@/types'
import { toast } from 'sonner'
import { logError } from '@/lib/errorHandler'

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [banReason, setBanReason] = useState('')
  const [reportResolution, setReportResolution] = useState('')

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      setStats(response.data.stats)
    } catch (error) {
      logError('FetchDashboard', error)
      toast.error('Failed to load dashboard')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data.users || [])
    } catch (error) {
      logError('FetchUsers', error)
      toast.error('Failed to load users')
    }
  }

  const fetchReports = async () => {
    try {
      const response = await api.get('/admin/reports')
      setReports(response.data.reports || [])
    } catch (error) {
      logError('FetchReports', error)
      toast.error('Failed to load reports')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchDashboard(), fetchUsers(), fetchReports()])
      setIsLoading(false)
    }
    loadData()
  }, [])

const handleBanUser = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/ban`, { reason: banReason })
      toast.success('User banned successfully')
      setBanReason('')
      fetchUsers()
      fetchDashboard()
    } catch (error) {
      logError('BanUser', error)
      toast.error('Failed to ban user')
    }
  }

  const handleUnbanUser = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/unban`)
      toast.success('User unbanned successfully')
      fetchUsers()
      fetchDashboard()
    } catch (error) {
      logError('UnbanUser', error)
      toast.error('Failed to unban user')
    }
  }

  const handleResolveReport = async (reportId: number) => {
    try {
      await api.post(`/admin/reports/${reportId}/resolve`, {
        resolution: reportResolution,
      })
      toast.success('Report resolved')
      setReportResolution('')
      fetchReports()
      fetchDashboard()
    } catch (error) {
      logError('ResolveReport', error)
      toast.error('Failed to resolve report')
    }
  }

  const handleDismissReport = async (reportId: number) => {
    try {
      await api.post(`/admin/reports/${reportId}/dismiss`)
      toast.success('Report dismissed')
      fetchReports()
      fetchDashboard()
    } catch (error) {
      logError('DismissReport', error)
      toast.error('Failed to dismiss report')
    }
  } 

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage users, reports, and platform settings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.users.online || 0} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.chats.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.chats.today || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reports.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.reports.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.banned || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.users.new_today || 0} new today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage platform users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.username}</p>
                          {user.is_banned && (
                            <Badge variant="destructive">Banned</Badge>
                          )}
                          {user.is_admin && (
                            <Badge variant="default">Admin</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email || 'Anonymous'} • {user.is_online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.is_banned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(user.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Unban
                        </Button>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleBanUser(user.id)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ban User</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to ban {user.username}?
                              </DialogDescription>
                            </DialogHeader>
                            <Textarea
                              placeholder="Reason for ban..."
                              value={banReason}
                              onChange={(e) => setBanReason(e.target.value)}
                            />
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setBanReason('')}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleBanUser(user.id)}
                                disabled={!banReason}
                              >
                                Ban User
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Manage user reports and take action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Report #{report.id}</p>
                        <Badge variant={report.status === 'pending' ? 'secondary' : 'default'}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reporter: {report.reporter?.username} • Reported: {report.reported?.username}
                      </p>
                      <p className="text-sm mt-2">{report.reason}</p>
                      {report.description && (
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      )}
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="default" size="sm">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Resolve Report</DialogTitle>
                              <DialogDescription>
                                Enter your resolution for this report
                              </DialogDescription>
                            </DialogHeader>
                            <Textarea
                              placeholder="Resolution..."
                              value={reportResolution}
                              onChange={(e) => setReportResolution(e.target.value)}
                            />
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setReportResolution('')}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleResolveReport(report.id)}
                                disabled={!reportResolution}
                              >
                                Resolve
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDismissReport(report.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No pending reports</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
