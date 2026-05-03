<?php

namespace App\Http\Controllers\Api;

use App\Events\WebRTCAnswer;
use App\Events\WebRTCIceCandidate;
use App\Events\WebRTCOffer;
use App\Events\WebRTCScreenShare;
use App\Events\WebRTCToggleMedia;
use App\Http\Controllers\Controller;
use App\Models\Chat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SignalingController extends Controller
{
    public function offer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
            'sdp' => 'required|string',
            'type' => 'required|in:offer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();
        $chat = Chat::find($request->input('chat_id'));

        if (!$chat->isActive()) {
            return response()->json(['message' => 'Chat is not active'], 403);
        }

        if (!$chat->participants->contains($user->id)) {
            return response()->json(['message' => 'Not a participant in this chat'], 403);
        }

        $otherUser = $chat->getOtherParticipant($user);

        if (!$otherUser) {
            return response()->json(['message' => 'Other user not found'], 404);
        }

        broadcast(new WebRTCOffer(
            $chat->id,
            $user->id,
            $otherUser->id,
            $request->input('sdp'),
            $request->input('type')
        ))->toOthers();

        return response()->json(['success' => true]);
    }

    public function answer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
            'sdp' => 'required|string',
            'type' => 'required|in:answer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();
        $chat = Chat::find($request->input('chat_id'));

        if (!$chat->isActive()) {
            return response()->json(['message' => 'Chat is not active'], 403);
        }

        if (!$chat->participants->contains($user->id)) {
            return response()->json(['message' => 'Not a participant in this chat'], 403);
        }

        $otherUser = $chat->getOtherParticipant($user);

        if (!$otherUser) {
            return response()->json(['message' => 'Other user not found'], 404);
        }

        broadcast(new WebRTCAnswer(
            $chat->id,
            $user->id,
            $otherUser->id,
            $request->input('sdp'),
            $request->input('type')
        ))->toOthers();

        return response()->json(['success' => true]);
    }

    public function iceCandidate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
            'candidate' => 'required|string',
            'sdp_mid' => 'nullable|string',
            'sdp_m_line_index' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();
        $chat = Chat::find($request->input('chat_id'));

        if (!$chat->isActive()) {
            return response()->json(['message' => 'Chat is not active'], 403);
        }

        if (!$chat->participants->contains($user->id)) {
            return response()->json(['message' => 'Not a participant in this chat'], 403);
        }

        $otherUser = $chat->getOtherParticipant($user);

        if (!$otherUser) {
            return response()->json(['message' => 'Other user not found'], 404);
        }

        broadcast(new WebRTCIceCandidate(
            $chat->id,
            $user->id,
            $otherUser->id,
            $request->input('candidate'),
            $request->input('sdp_mid'),
            $request->input('sdp_m_line_index')
        ))->toOthers();

        return response()->json(['success' => true]);
    }

    public function toggleMedia(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
            'media_type' => 'required|in:video,audio',
            'enabled' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();
        $chat = Chat::find($request->input('chat_id'));

        if (!$chat->isActive()) {
            return response()->json(['message' => 'Chat is not active'], 403);
        }

        if (!$chat->participants->contains($user->id)) {
            return response()->json(['message' => 'Not a participant in this chat'], 403);
        }

        // Update participant pivot
        if ($request->input('media_type') === 'video') {
            $chat->participants()->updateExistingPivot($user->id, ['is_video_enabled' => $request->input('enabled')]);
        } else {
            $chat->participants()->updateExistingPivot($user->id, ['is_audio_enabled' => $request->input('enabled')]);
        }

        $otherUser = $chat->getOtherParticipant($user);

        if ($otherUser) {
            broadcast(new WebRTCToggleMedia(
                $chat->id,
                $user->id,
                $otherUser->id,
                $request->input('media_type'),
                $request->input('enabled')
            ))->toOthers();
        }

        return response()->json(['success' => true]);
    }

    public function screenShare(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required|integer|exists:chats,id',
            'active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth('api')->user();
        $chat = Chat::find($request->input('chat_id'));

        if (!$chat->isActive()) {
            return response()->json(['message' => 'Chat is not active'], 403);
        }

        if (!$chat->participants->contains($user->id)) {
            return response()->json(['message' => 'Not a participant in this chat'], 403);
        }

        $otherUser = $chat->getOtherParticipant($user);

        if (!$otherUser) {
            return response()->json(['message' => 'Other user not found'], 404);
        }

        broadcast(new WebRTCScreenShare(
            $chat->id,
            $user->id,
            $otherUser->id,
            $request->input('active')
        ))->toOthers();

        return response()->json(['success' => true]);
    }
}
