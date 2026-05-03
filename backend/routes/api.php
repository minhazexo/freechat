<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\SignalingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test if WebSocket server is running
Route::get('/ws-test', function () {
    return response()->json(['status' => 'ok', 'time' => now()]);
});

// Test broadcasting auth directly
Route::post('/ws-auth-test', function (\Illuminate\Http\Request $request) {
    return response()->json([
        'channel_name' => $request->input('channel_name'),
        'socket_id' => $request->input('socket_id'),
    ]);
});

// Broadcasting auth - uses Laravel's built-in Pusher auth signature generation
Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
    \Illuminate\Support\Facades\Log::info('Broadcasting auth request', [
        'channel_name' => $request->input('channel_name'),
        'socket_id' => $request->input('socket_id'),
    ]);
    
    auth()->shouldUse('api');
    return Broadcast::auth($request);
})->middleware(['auth:api']);

// Public routes
Route::post('/auth/anonymous', [AuthController::class, 'anonymousLogin']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware(['auth:api', 'banned'])->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::get('/auth/verify', [AuthController::class, 'verify']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // User
    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/user/avatar', [UserController::class, 'uploadAvatar']);
    Route::delete('/user/avatar', [UserController::class, 'deleteAvatar']);
    Route::post('/user/change-password', [UserController::class, 'changePassword']);
    Route::get('/user/history', [UserController::class, 'history']);
    Route::post('/user/status', [UserController::class, 'updateStatus']);

    // Friends
    Route::get('/friends', [UserController::class, 'friends']);
    Route::post('/friends/request', [UserController::class, 'sendFriendRequest']);
    Route::post('/friends/accept', [UserController::class, 'acceptFriendRequest']);
    Route::post('/friends/reject', [UserController::class, 'rejectFriendRequest']);
    Route::delete('/friends', [UserController::class, 'removeFriend']);

    // Blocked Users
    Route::get('/blocked', [UserController::class, 'blockedUsers']);
    Route::post('/block', [UserController::class, 'blockUser']);
    Route::post('/unblock', [UserController::class, 'unblockUser']);

    // Reports
    Route::post('/report', [UserController::class, 'reportUser']);

    // Chat
    Route::post('/chat/search', [ChatController::class, 'search']);
    Route::post('/chat/cancel', [ChatController::class, 'cancelSearch']);
    Route::post('/chat/message', [ChatController::class, 'sendMessage']);
    Route::post('/chat/typing', [ChatController::class, 'typing']);
    Route::post('/chat/end', [ChatController::class, 'endChat']);
    Route::post('/chat/skip', [ChatController::class, 'skip']);
    Route::post('/chat/add-friend', [ChatController::class, 'addFriend']);
    Route::get('/chat/messages/{chatId}', [ChatController::class, 'getMessages']);
    Route::get('/chat/active', [ChatController::class, 'getActiveChat']);

    // WebRTC Signaling
    Route::post('/signaling/offer', [SignalingController::class, 'offer']);
    Route::post('/signaling/answer', [SignalingController::class, 'answer']);
    Route::post('/signaling/ice-candidate', [SignalingController::class, 'iceCandidate']);
    Route::post('/signaling/toggle-media', [SignalingController::class, 'toggleMedia']);
    Route::post('/signaling/screen-share', [SignalingController::class, 'screenShare']);
});

// Admin routes
Route::middleware(['auth:api', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    // Users
    Route::get('/users', [AdminController::class, 'users']);
    Route::get('/users/{id}', [AdminController::class, 'getUser']);
    Route::post('/users/{id}/ban', [AdminController::class, 'banUser']);
    Route::post('/users/{id}/unban', [AdminController::class, 'unbanUser']);
    Route::post('/users/{id}/warn', [AdminController::class, 'warnUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

    // Reports
    Route::get('/reports', [AdminController::class, 'reports']);
    Route::get('/reports/{id}', [AdminController::class, 'getReport']);
    Route::post('/reports/{id}/resolve', [AdminController::class, 'resolveReport']);
    Route::post('/reports/{id}/dismiss', [AdminController::class, 'dismissReport']);

    // Moderation Logs
    Route::get('/moderation-logs', [AdminController::class, 'moderationLogs']);
});
