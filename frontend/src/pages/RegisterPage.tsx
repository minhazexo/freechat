import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, MessageCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

type Gender = 'male' | 'female'

interface BeforeStartData {
  gender: Gender | null
  agreedToTerms: boolean
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, anonymousLogin } = useAuth()
  const [step, setStep] = useState<'intro' | 'register'>('intro')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [introData, setIntroData] = useState<BeforeStartData>({
    gender: null,
    agreedToTerms: false,
  })

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    interests: '',
  })

  const handleQuickStart = async () => {
    if (!introData.gender) {
      toast.error('Please select your gender')
      return
    }
    if (!introData.agreedToTerms) {
      toast.error('You must agree to the Terms of Service')
      return
    }

    setIsLoading(true)
    try {
      const interestList = formData.interests
        .split(',')
        .map(i => i.trim())
        .filter(Boolean)

      await anonymousLogin(interestList, introData.gender, introData.agreedToTerms)
      toast.success('Welcome! Let\'s chat!')
      navigate('/chat')
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to start quick chat')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!introData.gender) {
      toast.error('Please select your gender')
      return
    }
    if (!introData.agreedToTerms) {
      toast.error('You must agree to the Terms of Service')
      return
    }

    if (formData.password !== formData.passwordConfirmation) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const interestList = formData.interests
        .split(',')
        .map(i => i.trim())
        .filter(Boolean)

      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.passwordConfirmation,
        interestList,
        introData.gender,
        introData.agreedToTerms
      )

      toast.success('Account created successfully!')
      navigate('/chat')
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors).flat() as (string | string[])[]
        const flatMessages = messages.flat()
        flatMessages.forEach((msg) => toast.error(String(msg)))
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to create account')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <MessageCircle className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold">QuickChat</span>
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Before you start...</CardTitle>
              <CardDescription>
                Select your gender so we can match you with the right people.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Gender Selection */}
              <div className="space-y-2">
                <Label className="text-base font-medium">I am:</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIntroData({ ...introData, gender: 'male' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      introData.gender === 'male'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <User className="h-8 w-8" />
                    <span className="font-medium">Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntroData({ ...introData, gender: 'female' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      introData.gender === 'female'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <User className="h-8 w-8" />
                    <span className="font-medium">Female</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  You cannot change your gender after you register.
                </p>
              </div>

              {/* Terms Agreement */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={introData.agreedToTerms}
                    onChange={(e) => setIntroData({ ...introData, agreedToTerms: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    I'm at least 18 years old and have read and agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              {/* Interests for Quick Mode */}
              <div className="space-y-2">
                <Label htmlFor="interests">Interests (optional)</Label>
                <Input
                  id="interests"
                  placeholder="gaming, music, movies (comma separated)"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                onClick={handleQuickStart}
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? 'Starting...' : 'I AGREE, LET\'S GO!'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Login
                </Link>
              </p>
              <Button
                variant="outline"
                onClick={() => setStep('register')}
                className="w-full"
                disabled={isLoading}
              >
                Create Account (Save Chats & Friends)
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <MessageCircle className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold">QuickChat</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Sign up to save your chats and make friends</CardDescription>
          </CardHeader>

          <form onSubmit={handleRegisterSubmit}>
            <CardContent className="space-y-4">
              {/* Gender Selection */}
              <div className="space-y-2">
                <Label className="text-base font-medium">I am:</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIntroData({ ...introData, gender: 'male' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      introData.gender === 'male'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntroData({ ...introData, gender: 'female' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      introData.gender === 'female'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Female</span>
                  </button>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="passwordConfirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={formData.passwordConfirmation}
                    onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={introData.agreedToTerms}
                    onChange={(e) => setIntroData({ ...introData, agreedToTerms: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    required
                  />
                  <span className="text-sm text-muted-foreground">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </label>
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <Label htmlFor="interests">Interests (optional)</Label>
                <Input
                  id="interests"
                  placeholder="gaming, music, movies (comma separated)"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
              <Button type="button" variant="link" onClick={() => setStep('intro')}>
                Back to Quick Start
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
