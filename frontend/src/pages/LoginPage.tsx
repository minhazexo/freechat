import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, MessageCircle, Sparkles, Zap, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { logError } from '@/lib/errorHandler'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, anonymousLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [interests, setInterests] = useState('')

  // Anonymous login state
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.info('[LoginPage] submit', { identifier: loginData.email })
      await login(loginData.email, loginData.password)
      toast.success('Welcome back!')
      navigate('/chat')
    } catch (error) {
      logError('Login', error)
      // Show server message if available
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.response?.data?.errors?.email?.[0] ||
        'Login failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnonymousLogin = async () => {
    if (!gender) {
      toast.error('Please select your gender')
      return
    }
    if (!agreedToTerms) {
      toast.error('You must agree to the Terms of Service')
      return
    }

    setIsLoading(true)

    try {
      const interestList = interests.split(',').map(i => i.trim()).filter(Boolean)
      await anonymousLogin(interestList, gender, agreedToTerms)
      toast.success('Welcome, guest!')
      navigate('/chat')
    } catch (error) {
      logError('AnonymousLogin', error)
      toast.error('Failed to start chat')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInterestClick = (interest: string) => {
    setInterests(prev => prev ? `${prev}, ${interest}` : interest)
  }

  const popularInterests = ['gaming', 'music', 'movies', 'tech', 'sports', 'art', 'travel', 'food']

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden theme-transition">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
      
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl orb-1" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl orb-2" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl orb-3" />
        <div className="absolute bottom-1/3 right-1/3 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl orb-1" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="w-full max-w-md relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* Logo with Animation */}
        <div className="flex justify-center mb-10 animate-fade-in-up">
          <Link to="/" className="group flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-xl rounded-2xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative bg-gradient-to-br from-primary via-primary to-purple-600 p-4 rounded-2xl shadow-2xl hover-lift">
                <MessageCircle className="h-10 w-10 text-primary-foreground animate-float" />
              </div>
            </div>
            <div className="text-left">
              <span className="text-4xl font-bold gradient-text-animate">
                Chitchat
              </span>
              <p className="text-xs text-muted-foreground font-medium">Connect • Chat • Discover</p>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="animate-fade-in-up stagger-1">
          <Tabs 
            defaultValue="login" 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 p-1 h-14 bg-muted/50 backdrop-blur-sm rounded-xl">
              <TabsTrigger 
                value="login" 
                className="h-10 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:animate-scale"
              >
                <Zap className="h-4 w-4 mr-2" />
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="anonymous" 
                className="h-10 rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:animate-scale"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Quick Chat
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-6 animate-fade-in-up">
              <Card className="card-animate card-shine border-0 shadow-2xl bg-background/80 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center pb-4 pt-8">
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                  <CardDescription className="text-base">Sign in to continue your conversations</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-5 pt-2">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-semibold ml-1">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="h-12 bg-muted/50 border-muted focus:border-primary focus:ring-2 focus:ring-primary/20 input-animate"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-semibold ml-1">Password</Label>
                      <div className="relative group">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="h-12 bg-muted/50 border-muted pr-12 focus:border-primary focus:ring-2 focus:ring-primary/20 input-animate"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300 hover-scale p-1"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-5 pb-8 pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold btn-animate hover-glow shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Authenticating...
                        </span>
                      ) : (
                        <>
                          Sign In
                          <Zap className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-primary font-bold hover:underline hover-scale inline-block">
                        Create one
                      </Link>
                    </p>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* Anonymous Tab */}
            <TabsContent value="anonymous" className="mt-6 animate-fade-in-up">
              <Card className="card-animate card-shine border-0 shadow-2xl bg-background/80 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center pb-4 pt-8">
                  <CardTitle className="text-2xl font-bold">Quick Chat</CardTitle>
                  <CardDescription className="text-base">
                    Chat instantly, no account needed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-2">
                  {/* Gender Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold ml-1">I am a</Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all duration-300 ${
                          gender === 'male'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Male</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all duration-300 ${
                          gender === 'female'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <Users className="h-5 w-5" />
                        <span className="font-medium">Female</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="interests" className="text-sm font-semibold ml-1">
                      Your Interests
                    </Label>
                    <Input
                      id="interests"
                      placeholder="gaming, music, movies..."
                      className="h-12 bg-muted/50 border-muted focus:border-primary focus:ring-2 focus:ring-primary/20 input-animate"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground ml-1">
                      Helps us find people like you!
                    </p>
                  </div>
                  
                  {/* Interest Tags */}
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground ml-1">Popular tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {popularInterests.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestClick(interest)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover-scale border border-transparent hover:border-primary/20"
                        >
                          + {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="agreedToTerms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-muted bg-muted/50 text-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Label htmlFor="agreedToTerms" className="text-sm text-muted-foreground cursor-pointer">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-5 pb-8 pt-4">
                  <Button 
                    onClick={handleAnonymousLogin} 
                    className="w-full h-12 text-base font-semibold btn-animate hover-glow shadow-lg hover:shadow-xl" 
                    variant="secondary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </span>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Start Chatting
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Want to save your chats?{' '}
                    <Link to="/register" className="text-primary font-bold hover:underline hover-scale inline-block">
                      Register
                    </Link>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-10 animate-fade-in-up stagger-2">
          By continuing, you agree to our{' '}
          <Link to="#" className="underline hover:text-foreground">Terms</Link>
          {' '}and{' '}
          <Link to="#" className="underline hover:text-foreground">Privacy</Link>
        </p>
      </div>
    </div>
  )
}
