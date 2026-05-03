<?php

use App\Models\Chat;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Private user channel - for WebRTC signaling and chat started events
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Presence chat channel - used by ChatMessageSent, ChatTyping, ChatEnded events
// Laravel strips the 'presence-' prefix before matching, so 'chat.{chatId}'
// handles authorization for 'presence-chat.{chatId}' subscriptions
Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    $chat = Chat::find($chatId);

    if (!$chat) {
        return false;
    }

    if (!$chat->participants->contains($user->id)) {
        return false;
    }

    // Presence channels MUST return user data array (not boolean)
    return [
        'id' => $user->id,
        'username' => $user->username,
        'avatar' => $user->avatar,
    ];
});

Broadcast::channel('admin', function ($user) {
    return $user->isAdmin();
});
