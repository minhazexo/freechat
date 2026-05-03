<?php

namespace App\Http\Controllers\Api;

use App\Events\ChatEnded;
use App\Events\ChatMessageSent;
use App\Events\ChatStarted;
use App\Events\ChatTyping;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChatResource;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\ChatHistory;
use App\Models\Message;
use App\Models\User;
use App\Services\ChatMatchingService;
use App\Services\ModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    protected ChatMatchingService $matchingService;
    protected ModerationService $moderationService;

    public function __construct(ChatMatchingService $matchingService, ModerationService $moderationService)
    {
        $this->matchingService = $matchingService;
        $this->moderationService = $moderationService;
    }

    public function search(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        if ($user->isBanned()) {
            return response()->json(['message' => 'Account banned'], 403);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:text,video',
            'interests' => 'nullable|array',
            'interests.*' => 'string|max:50',
            'filters' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = $request->input('type', 'text');
        $interests = $request->input('interests', []);
        $filters = $request->input('filters', []);

        // Check if user is already in a chat
        $existingChat = $this->matchingService->getUserActiveChat($user->id);
        if ($existingChat) {
            return response()->json([
                'message' => 'Already in a chat',
                'chat' => new ChatResource($existingChat),
            ]);
        }

        // Add user to waiting pool
        $this->matchingService->addToWaitingPool($user->id, $type, $interests, $filters);

        // Try to find a match
        $match = $this->matchingService->findMatch($user->id, $type, $interests);

        if ($match) {
            $chat = $this->matchingService->createChat($user->id, $match['user_id'], $type, $interests);
            $chat->load('participants');

            // Notify the other user that chat has started (current user gets response directly)
            $otherUserId = $match['user_id'];
            broadcast(new ChatStarted($chat, $otherUserId));

            return response()->json([
                'message' => 'Match found',
                'chat' => new ChatResource($chat),
                'matched' => true,
            ]);
        }

        return response()->json([
            'message' => 'Searching for match',
            'searching' => true,
        ]);
    }

    public function cancelSearch(): JsonResponse
    {
        $user = auth('api')->user();

        $this->matchingService->removeFromWaitingPool($user->id);

        return response()->json(['message' => 'Search cancelled']);
    }

    public function sendMessage(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
            'content' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $chat = Chat::find($request->input('chat_id'));

        if (!$chat->isActive()) {
            return response()->json(['message' => 'Chat is not active'], 403);
        }

        if (!$chat->participants->contains($user->id)) {
            return response()->json(['message' => 'Not a participant in this chat'], 403);
        }

        $content = $request->input('content');

        // Check content moderation
        $check = $this->moderationService->checkContent($content);
        if (!$check['isClean']) {
            // Add warning to user
            $user->increment('warning_count');

            // Auto-ban if too many warnings
            if ($user->warning_count >= config('moderation.max_warnings', 3)) {
                $user->update([
                    'is_banned' => true,
                    'ban_reason' => 'Multiple content violations',
                    'banned_until' => now()->addMinutes(config('moderation.auto_ban_duration', 1440)),
                ]);

                return response()->json([
                    'message' => 'Account banned due to multiple violations',
                    'flagged' => $check['flagged'],
                ], 403);
            }

            return response()->json([
                'message' => 'Message contains inappropriate content',
                'flagged' => $check['flagged'],
                'warning_count' => $user->warning_count,
            ], 422);
        }

        $message = Message::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'type' => 'text',
            'content' => $content,
        ]);

        // Broadcast message
        broadcast(new ChatMessageSent($message))->toOthers();

        // Update chat history message count
        ChatHistory::where('chat_id', $chat->id)->increment('message_count');

        return response()->json([
            'message' => new MessageResource($message),
        ]);
    }

    public function typing(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
            'is_typing' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $chat = Chat::find($request->input('chat_id'));

        if (!$chat->isActive()) {
            return response()->json(['message' => 'Chat is not active'], 403);
        }

        if (!$chat->participants->contains($user->id)) {
            return response()->json(['message' => 'Not a participant in this chat'], 403);
        }

        // Broadcast typing event
        broadcast(new ChatTyping($chat->id, $user->id, $request->input('is_typing')))->toOthers();

        return response()->json(['success' => true]);
    }

    public function endChat(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
            'reason' => 'nullable|string|in:user_left,skipped,disconnected',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $chat = Chat::find($request->input('chat_id'));

        if (!$chat->isActive()) {
            return response()->json(['message' => 'Chat is already ended'], 403);
        }

        if (!$chat->participants->contains($user->id)) {
            return response()->json(['message' => 'Not a participant in this chat'], 403);
        }

        $reason = $request->input('reason', 'user_left');

        $otherParticipant = $chat->getOtherParticipant($user);

        $chat->end($reason, $user->id);

        // Broadcast chat ended to the other participant
        if ($otherParticipant) {
            broadcast(new ChatEnded($chat, $otherParticipant->id, $reason))->toOthers();
        }

        // Update chat histories
        ChatHistory::where('chat_id', $chat->id)->update([
            'ended_at' => now(),
            'duration_seconds' => $chat->started_at ? $chat->started_at->diffInSeconds(now()) : 0,
        ]);

        return response()->json(['message' => 'Chat ended']);
    }

    public function skip(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $chat = Chat::find($request->input('chat_id'));

        if ($chat->isActive()) {
            $chat->end('skipped', $user->id);

            ChatHistory::where('chat_id', $chat->id)->update([
                'ended_at' => now(),
                'duration_seconds' => $chat->started_at ? $chat->started_at->diffInSeconds(now()) : 0,
            ]);
        }

        // Start new search using the same chat type/interests.
        // `search()` requires `type`, so we must provide it here.
        $request->merge([
            'type' => $chat->type ?? 'text',
            'interests' => is_array($chat->interests) ? $chat->interests : [],
        ]);

        return $this->search($request);
    }

    public function addFriend(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $chat = Chat::find($request->input('chat_id'));
        $otherUser = $chat->getOtherParticipant($user);

        if (!$otherUser) {
            return response()->json(['message' => 'Other user not found'], 404);
        }

        if ($user->isFriendsWith($otherUser)) {
            return response()->json(['message' => 'Already friends'], 422);
        }

        // Create friend request
        \App\Models\Friend::create([
            'user_id' => $user->id,
            'friend_id' => $otherUser->id,
            'status' => 'pending',
        ]);

        // Update chat history
        ChatHistory::where('chat_id', $chat->id)
            ->where('user_id', $user->id)
            ->update(['was_friend_added' => true]);

        return response()->json(['message' => 'Friend request sent']);
    }

    public function getMessages(Request $request, int $chatId): JsonResponse
    {
        $user = auth('api')->user();

        $chat = Chat::find($chatId);

        if (!$chat) {
            return response()->json(['message' => 'Chat not found'], 404);
        }

        if (!$chat->participants->contains($user->id)) {
            return response()->json(['message' => 'Not a participant in this chat'], 403);
        }

        $validator = Validator::make($request->all(), [
            'limit' => 'sometimes|integer|min:1|max:100',
            'before_id' => 'sometimes|integer|exists:messages,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $limit = $request->input('limit', 50);

        $query = $chat->messages()->notDeleted()->orderBy('created_at', 'desc');

        if ($request->has('before_id')) {
            $beforeMessage = Message::find($request->input('before_id'));
            if ($beforeMessage) {
                $query->where('created_at', '<', $beforeMessage->created_at);
            }
        }

        $messages = $query->take($limit)->get()->reverse()->values();

        return response()->json([
            'messages' => MessageResource::collection($messages),
        ]);
    }

    public function getActiveChat(): JsonResponse
    {
        $user = auth('api')->user();

        $activeChat = $this->matchingService->getUserActiveChat($user->id);

        if (!$activeChat) {
            return response()->json(['chat' => null]);
        }

        return response()->json([
            'chat' => new ChatResource($activeChat),
        ]);
    }
}
