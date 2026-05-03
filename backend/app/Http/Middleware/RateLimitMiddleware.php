<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class RateLimitMiddleware
{
    public function handle(Request $request, Closure $next, string $type = 'default'): Response
    {
        $user = auth('api')->user();
        $key = $type . ':' . ($user ? $user->id : $request->ip());

        $maxAttempts = match ($type) {
            'chat' => config('app.chat_rate_limit_per_minute', 30),
            'auth' => 10,
            default => config('app.rate_limit_per_minute', 60),
        };

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            
            return response()->json([
                'message' => 'Too many requests. Please try again in ' . $seconds . ' seconds.',
                'retry_after' => $seconds,
            ], 429);
        }

        RateLimiter::hit($key, 60);

        return $next($request);
    }
}
