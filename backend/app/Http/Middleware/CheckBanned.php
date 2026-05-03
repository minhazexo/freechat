<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBanned
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth('api')->user();

        if ($user && $user->isBanned()) {
            return response()->json([
                'message' => 'Account banned',
                'reason' => $user->ban_reason,
                'banned_until' => $user->banned_until,
            ], 403);
        }

        return $next($request);
    }
}
