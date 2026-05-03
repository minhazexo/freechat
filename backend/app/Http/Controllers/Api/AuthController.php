<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\ModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    protected ModerationService $moderationService;

    public function __construct(ModerationService $moderationService)
    {
        $this->moderationService = $moderationService;
    }

    public function anonymousLogin(Request $request): JsonResponse
    {
        if (!config('app.enable_anonymous_login', true)) {
            return response()->json(['message' => 'Anonymous login is disabled'], 403);
        }

        $validator = Validator::make($request->all(), [
            'gender' => 'required|in:male,female',
            'agreed_to_terms' => 'required|accepted',
            'interests' => 'nullable|array',
            'interests.*' => 'string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $interests = $request->input('interests', []);

        foreach ($interests as $interest) {
            $check = $this->moderationService->checkContent($interest);
            if (!$check['isClean']) {
                return response()->json([
                    'message' => 'Inappropriate interest detected',
                    'flagged' => $check['flagged'],
                ], 422);
            }
        }

        $prefix = config('app.anonymous_user_prefix', 'Guest');
        $username = $prefix . rand(10000, 99999);

        while (User::where('username', $username)->exists()) {
            $username = $prefix . rand(10000, 99999);
        }

        $user = User::create([
            'username' => $username,
            'gender' => $request->gender,
            'agreed_to_terms' => true,
            'is_anonymous' => true,
            'is_online' => true,
            'last_active_at' => now(),
            'interests' => $interests,
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . Str::random(10),
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'user' => new UserResource($user),
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        if (!config('app.enable_registration', true)) {
            return response()->json(['message' => 'Registration is disabled'], 403);
        }

        $validator = Validator::make($request->all(), [
            'username' => 'required|string|min:3|max:30|unique:users|regex:/^[a-zA-Z0-9_]+$/',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'gender' => 'required|in:male,female',
            'agreed_to_terms' => 'required|accepted',
            'interests' => 'nullable|array',
            'interests.*' => 'string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check username for inappropriate content
        $check = $this->moderationService->checkContent($request->username);
        if (!$check['isClean']) {
            return response()->json([
                'message' => 'Inappropriate username detected',
                'flagged' => $check['flagged'],
            ], 422);
        }

        $interests = $request->input('interests', []);

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'gender' => $request->gender,
            'agreed_to_terms' => true,
            'is_anonymous' => false,
            'is_online' => true,
            'last_active_at' => now(),
            'interests' => $interests,
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . $request->username,
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'user' => new UserResource($user),
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ], 200);
    }

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required_without:username|string',
            'username' => 'required_without:email|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $credentials = $request->only(['email', 'password']);

        if ($request->has('username') && !$request->has('email')) {
            $user = User::where('username', $request->username)->first();
            if ($user) {
                $credentials = ['email' => $user->email, 'password' => $request->password];
            }
        }

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = auth('api')->user();

        if ($user->isBanned()) {
            return response()->json([
                'message' => 'Account banned',
                'reason' => $user->ban_reason,
                'banned_until' => $user->banned_until,
            ], 403);
        }

        $user->update([
            'is_online' => true,
            'last_active_at' => now(),
        ]);

        return response()->json([
            'user' => new UserResource($user),
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ]);
    }

    public function logout(): JsonResponse
    {
        $user = auth('api')->user();

        if ($user) {
            $user->update([
                'is_online' => false,
                'last_active_at' => now(),
            ]);
        }

        auth('api')->logout();

        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = auth('api')->refresh();
            $user = auth('api')->user();

            return response()->json([
                'user' => new UserResource($user),
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Token refresh failed'], 401);
        }
    }

    public function verify(): JsonResponse
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['message' => 'Token invalid or expired'], 401);
        }

        if ($user->isBanned()) {
            return response()->json([
                'message' => 'Account banned',
                'reason' => $user->ban_reason,
                'banned_until' => $user->banned_until,
            ], 403);
        }

        $user->update(['last_active_at' => now()]);

        return response()->json([
            'user' => new UserResource($user),
            'valid' => true,
        ]);
    }

    public function me(): JsonResponse
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }
}