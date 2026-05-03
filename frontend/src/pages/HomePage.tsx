import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Video, User, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'

const POPULAR_TAGS = ['gaming', 'music', 'movies', 'tech', 'sports', 'art', 'travel', 'food']

export default function HomePage() {
  const { isAuthenticated, anonymousLogin } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const [quickChatData, setQuickChatData] = useState({
    gender: '' as 'male' | 'female' | '',
    interests: '',
    agreedToTerms: false,
  })

  const handleQuickChat = async () => {
    if (!quickChatData.gender) {
      toast.error('Please select your gender')
      return
    }
    if (!quickChatData.agreedToTerms) {
      toast.error('You must agree to the Terms of Service')
      return
    }

    setIsLoading(true)
    try {
      const interests = quickChatData.interests
        .split(',')
        .map(i => i.trim())
        .filter(Boolean)

      await anonymousLogin(interests, quickChatData.gender, quickChatData.agreedToTerms)
      toast.success('Starting chat search...')
      navigate('/chat', { state: { autoSearch: true } })
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to start chat')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = (tag: string) => {
    const current = quickChatData.interests.split(',').map(i => i.trim()).filter(Boolean)
    if (!current.includes(tag)) {
      setQuickChatData({
        ...quickChatData,
        interests: [...current, tag].join(', ')
      })
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden theme-transition">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
      
      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl orb-1" 
        />
        <div 
          className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-pink-500/15 to-orange-500/15 rounded-full blur-3xl orb-2" 
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b bg-background/60 backdrop-blur-xl navbar-blur sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative bg-gradient-to-br from-primary to-purple-600 p-2.5 rounded-xl shadow-lg hover-lift">
                  <MessageCircle className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <span className="text-xl font-bold">Chitchat</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#connect" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Connect</a>
              <a href="#chat" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Chat</a>
              <a href="#discover" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Discover</a>
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/chat')}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <ThemeToggle />
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Chat Section */}
      <section id="connect" className="relative py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                <span>Quick Chat</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Chat instantly.<br />
                <span className="text-muted-foreground">No account needed.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Connect with random people from around the world. Chat anonymously, make new friends, 
                or find your perfect match. Your interests help us find people like you!
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>AI Moderation</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  <span>10K+ Online</span>
                </div>
              </div>
            </div>

            {/* Right - Quick Chat Card */}
            <div id="chat" className="max-w-md mx-auto lg:mr-0">
              <Card className="shadow-2xl border-0 bg-background/80 backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    Quick Chat
                  </CardTitle>
                  <CardDescription>Chat instantly, no account needed</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Gender Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">I am:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setQuickChatData({ ...quickChatData, gender: 'male' })}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          quickChatData.gender === 'male'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Male</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickChatData({ ...quickChatData, gender: 'female' })}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          quickChatData.gender === 'female'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Female</span>
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      You cannot change your gender after you register.
                    </p>
                  </div>

                  {/* Interests */}
                  <div className="space-y-3">
                    <Label htmlFor="interests" className="text-base font-medium">Your Interests</Label>
                    <Input
                      id="interests"
                      placeholder="gaming, music, movies..."
                      value={quickChatData.interests}
                      onChange={(e) => setQuickChatData({ ...quickChatData, interests: e.target.value })}
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">Helps us find people like you!</p>

                    {/* Popular Tags */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Popular tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quickChatData.agreedToTerms}
                        onChange={(e) => setQuickChatData({ ...quickChatData, agreedToTerms: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-muted-foreground">
                        I'm at least 18 years old and agree to the{' '}
                        <a href="/terms" className="text-primary hover:underline">Terms</a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                      </span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-2">
                    <Button 
                      onClick={handleQuickChat}
                      disabled={isLoading}
                      size="lg"
                      className="w-full text-lg"
                    >
                      {isLoading ? (
                        'Connecting...'
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
                          Start Chatting
                        </>
                      )}
                    </Button>
                    
                    {!isAuthenticated && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                      </div>
                    )}
                    
                    {!isAuthenticated && (
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/register')}
                        size="lg"
                        className="w-full text-lg"
                      >
                        Want to save your chats? Register
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="discover" className="py-24 relative z-10 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Why Choose Chitchat?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We provide a safe and fun platform for meeting new people from all over the world.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-xl bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-7 w-7 text-blue-500" />
                </div>
                <CardTitle>Text Chat</CardTitle>
                <CardDescription>Chat anonymously with people from around the world.</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-0 shadow-xl bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Video className="h-7 w-7 text-purple-500" />
                </div>
                <CardTitle>Video Chat</CardTitle>
                <CardDescription>Face-to-face conversations with strangers.</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-0 shadow-xl bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-green-500" />
                </div>
                <CardTitle>Safe & Secure</CardTitle>
                <CardDescription>AI-powered moderation to keep conversations clean.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 relative z-10 bg-background/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-gradient-to-br from-primary to-purple-600 p-2 rounded-lg">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">Chitchat</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Chitchat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
