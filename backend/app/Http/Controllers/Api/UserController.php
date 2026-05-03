<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChatHistoryResource;
use App\Http\Resources\FriendResource;
use App\Http\Resources\UserResource;
use App\Models\BlockedUser;
use App\Models\ChatHistory;
use App\Models\Friend;
use App\Models\Report;
use App\Models\User;
use App\Services\ModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    protected ModerationService $moderationService;

    public function __construct(ModerationService $moderationService)
    {
        $this->moderationService = $moderationService;
    }

    public function profile(): JsonResponse
    {
        $user = auth('api')->user();
        return response()->json([
            'user' => new UserResource($user->load('friends', 'blockedUsers')),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'username' => 'sometimes|string|min:3|max:30|unique:users,username,' . $user->id . '|regex:/^[a-zA-Z0-9_]+$/',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'avatar' => 'sometimes|string|url|max:500',
            'interests' => 'sometimes|array',
            'interests.*' => 'string|max:50',
            'preferences' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check username for inappropriate content
        if ($request->has('username')) {
            $check = $this->moderationService->checkContent($request->username);
            if (!$check['isClean']) {
                return response()->json([
                    'message' => 'Inappropriate username detected',
                    'flagged' => $check['flagged'],
                ], 422);
            }
        }

        $updateData = $request->only(['username', 'email', 'avatar', 'interests', 'preferences']);
        $user->update($updateData);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,gif,webp|max:2048|dimensions:min_width=100,min_height=100,max_width=1000,max_height=1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('avatar');
        
        // Delete old avatar if exists and is not the default
        if ($user->avatar && !str_contains($user->avatar, 'dicebear.com')) {
            $oldPath = str_replace('/storage/', '', $user->avatar);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        // Generate unique filename
        $filename = sprintf(
            'avatars/%s_%s.%s',
            $user->id,
            Str::random(10),
            $file->getClientOriginalExtension()
        );

        // Store the file
        $path = $file->storeAs('public', $filename);
        
        // Update user avatar
        $user->update(['avatar' => "/storage/{$filename}"]);

        return response()->json([
            'message' => 'Avatar uploaded successfully',
            'avatar' => $user->fresh()->avatar,
        ]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        // Don't allow anonymous users to delete avatar (they'll lose their identity)
        if ($user->is_anonymous) {
            return response()->json(['message' => 'Anonymous users cannot delete avatar'], 422);
        }

        // Delete old avatar if exists and is not the default
        if ($user->avatar && !str_contains($user->avatar, 'dicebear.com')) {
            $oldPath = str_replace('/storage/', '', $user->avatar);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        // Set default avatar
        $user->update(['avatar' => config('app.anonymous_avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg') . '?seed=' . $user->username]);

        return response()->json([
            'message' => 'Avatar deleted successfully',
            'avatar' => $user->fresh()->avatar,
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    public function history(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|in:text,video,all',
            'limit' => 'sometimes|integer|min:1|max:100',
            'offset' => 'sometimes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = $request->input('type', 'all');
        $limit = $request->input('limit', 20);
        $offset = $request->input('offset', 0);

        $query = ChatHistory::where('user_id', $user->id)
            ->with('otherUser')
            ->orderBy('started_at', 'desc');

        if ($type !== 'all') {
            $query->where('type', $type);
        }

        $total = $query->count();
        $histories = $query->skip($offset)->take($limit)->get();

        return response()->json([
            'histories' => ChatHistoryResource::collection($histories),
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    public function friends(): JsonResponse
    {
        $user = auth('api')->user();
        
        $friends = Friend::where('user_id', $user->id)
            ->where('status', 'accepted')
            ->with('friend')
            ->get();
        
        $pendingRequests = Friend::where('friend_id', $user->id)
            ->where('status', 'pending')
            ->with('user')
            ->get();
        
        $sentRequests = Friend::where('user_id', $user->id)
            ->where('status', 'pending')
            ->with('friend')
            ->get();
        
        return response()->json([
            'friends' => FriendResource::collection($friends),
            'pending_requests' => FriendResource::collection($pendingRequests),
            'sent_requests' => FriendResource::collection($sentRequests),
        ]);
    }

    public function sendFriendRequest(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $friendId = $request->input('user_id');

        if ($friendId === $user->id) {
            return response()->json(['message' => 'Cannot add yourself as friend'], 422);
        }

        $friendUser = User::find($friendId);

        if ($user->isFriendsWith($friendUser)) {
            return response()->json(['message' => 'Already friends with this user'], 422);
        }

        if ($user->hasSentFriendRequestTo($friendUser)) {
            return response()->json(['message' => 'Friend request already sent'], 422);
        }

        if ($user->hasPendingFriendRequestFrom($friendUser)) {
            // Auto-accept if they already sent a request
            Friend::where('user_id', $friendId)
                ->where('friend_id', $user->id)
                ->where('status', 'pending')
                ->update(['status' => 'accepted']);
            
            return response()->json(['message' => 'Friend request accepted']);
        }

        Friend::create([
            'user_id' => $user->id,
            'friend_id' => $friendId,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Friend request sent']);
    }

    public function acceptFriendRequest(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $friendId = $request->input('user_id');

        $friendRequest = Friend::where('user_id', $friendId)
            ->where('friend_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$friendRequest) {
            return response()->json(['message' => 'No pending friend request found'], 404);
        }

        $friendRequest->update(['status' => 'accepted']);

        return response()->json(['message' => 'Friend request accepted']);
    }

    public function rejectFriendRequest(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $friendId = $request->input('user_id');

        $friendRequest = Friend::where('user_id', $friendId)
            ->where('friend_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$friendRequest) {
            return response()->json(['message' => 'No pending friend request found'], 404);
        }

        $friendRequest->update(['status' => 'rejected']);

        return response()->json(['message' => 'Friend request rejected']);
    }

    public function removeFriend(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $friendId = $request->input('user_id');

        Friend::between($user->id, $friendId)->delete();

        return response()->json(['message' => 'Friend removed']);
    }

    public function blockedUsers(): JsonResponse
    {
        $user = auth('api')->user();
        
        return response()->json([
            'blocked_users' => UserResource::collection($user->blockedUsers),
        ]);
    }

    public function blockUser(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $blockedUserId = $request->input('user_id');

        if ($blockedUserId === $user->id) {
            return response()->json(['message' => 'Cannot block yourself'], 422);
        }

        if ($user->hasBlocked(User::find($blockedUserId))) {
            return response()->json(['message' => 'User already blocked'], 422);
        }

        BlockedUser::create([
            'user_id' => $user->id,
            'blocked_user_id' => $blockedUserId,
            'reason' => $request->input('reason'),
        ]);

        // Remove from friends if they were friends
        Friend::between($user->id, $blockedUserId)->delete();

        return response()->json(['message' => 'User blocked']);
    }

    public function unblockUser(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $blockedUserId = $request->input('user_id');

        BlockedUser::where('user_id', $user->id)
            ->where('blocked_user_id', $blockedUserId)
            ->delete();

        return response()->json(['message' => 'User unblocked']);
    }

    public function reportUser(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'type' => 'required|in:spam,harassment,inappropriate,other',
            'reason' => 'required|string|max:500',
            'description' => 'nullable|string|max:2000',
            'chat_id' => 'nullable|integer|exists:chats,id',
            'evidence' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reportedId = $request->input('user_id');

        if ($reportedId === $user->id) {
            return response()->json(['message' => 'Cannot report yourself'], 422);
        }

        $report = Report::create([
            'reporter_id' => $user->id,
            'reported_id' => $reportedId,
            'chat_id' => $request->input('chat_id'),
            'type' => $request->input('type'),
            'reason' => $request->input('reason'),
            'description' => $request->input('description'),
            'evidence' => $request->input('evidence'),
            'status' => 'pending',
        ]);

        // Update chat history if applicable
        if ($request->has('chat_id')) {
            ChatHistory::where('user_id', $user->id)
                ->where('chat_id', $request->input('chat_id'))
                ->update(['was_reported' => true]);
        }

        return response()->json([
            'message' => 'Report submitted successfully',
            'report_id' => $report->id,
        ]);
    }

    public function updateStatus(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'is_online' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update([
            'is_online' => $request->input('is_online'),
            'last_active_at' => now(),
        ]);

        return response()->json([
            'message' => 'Status updated',
            'is_online' => $user->is_online,
        ]);
    }
}
