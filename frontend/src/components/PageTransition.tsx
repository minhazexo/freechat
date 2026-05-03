import { useLocation } from 'react-router-dom'
import { useEffect, useState, ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('enter')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exit')
      const timeout = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('enter')
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [location, displayLocation])

  return (
    <div
      className={`
        ${transitionStage === 'enter' ? 'animate-fade-in-up' : 'animate-fade-in-down'}
        w-full
      `}
      key={displayLocation.pathname}
    >
      {children}
    </div>
  )
}

export function AnimatedCard({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <div
      className="card-animate card-shine"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export function AnimatedButton({ 
  children, 
  onClick,
  variant = 'default',
  className = '',
  ...props 
}: { 
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  className?: string
  [key: string]: any
}) {
  const baseClasses = 'btn-animate relative overflow-hidden transition-all duration-300'
  
  return (
    <button 
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  )
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }
  
  return (
    <div className="relative">
      <div className={`${sizes[size]} border-2 border-muted border-t-primary rounded-full animate-spin`} />
      <div 
        className={`absolute inset-0 ${sizes[size]} border-2 border-transparent border-t-primary/30 rounded-full animate-spin`} 
        style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} 
      />
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`shimmer rounded-lg ${className}`} />
  )
}

export function PulseDot({ color = 'primary' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 bg-${color}-500`} />
    </span>
  )
}