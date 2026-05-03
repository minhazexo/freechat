<?php

namespace Database\Seeders;

use App\Models\Chat;
use App\Models\ChatHistory;
use App\Models\Friend;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('is_banned', false)->get();
        
        if ($users->count() < 2) {
            $this->command->warn('Not enough users to create chats');
            return;
        }

        // Create some friendships
        for ($i = 0; $i < 10; $i++) {
            $user1 = $users->random();
            $user2 = $users->where('id', '!=', $user1->id)->random();
            
            if (!$user1->isFriendsWith($user2) && !$user1->hasPendingFriendRequestFrom($user2)) {
                Friend::create([
                    'user_id' => $user1->id,
                    'friend_id' => $user2->id,
                    'status' => fake()->randomElement(['pending', 'accepted']),
                ]);
            }
        }

        // Create ended chats with messages
        for ($i = 0; $i < 15; $i++) {
            $user1 = $users->random();
            $user2 = $users->where('id', '!=', $user1->id)->random();
            
            $chat = Chat::factory()->create();
            $chat->addParticipant($user1);
            $chat->addParticipant($user2);
            
            // Create messages
            $messageCount = fake()->numberBetween(5, 30);
            for ($j = 0; $j < $messageCount; $j++) {
                Message::factory()->create([
                    'chat_id' => $chat->id,
                    'user_id' => fake()->randomElement([$user1->id, $user2->id]),
                    'created_at' => fake()->dateTimeBetween($chat->started_at, $chat->ended_at),
                ]);
            }
            
            // Create chat history for both users
            ChatHistory::create([
                'user_id' => $user1->id,
                'chat_id' => $chat->id,
                'other_user_id' => $user2->id,
                'type' => $chat->type,
                'started_at' => $chat->started_at,
                'ended_at' => $chat->ended_at,
                'duration_seconds' => $chat->started_at && $chat->ended_at 
                    ? $chat->started_at->diffInSeconds($chat->ended_at) 
                    : 0,
                'message_count' => $messageCount,
                'was_friend_added' => $user1->isFriendsWith($user2),
                'was_reported' => false,
            ]);
            
            ChatHistory::create([
                'user_id' => $user2->id,
                'chat_id' => $chat->id,
                'other_user_id' => $user1->id,
                'type' => $chat->type,
                'started_at' => $chat->started_at,
                'ended_at' => $chat->ended_at,
                'duration_seconds' => $chat->started_at && $chat->ended_at 
                    ? $chat->started_at->diffInSeconds($chat->ended_at) 
                    : 0,
                'message_count' => $messageCount,
                'was_friend_added' => $user2->isFriendsWith($user1),
                'was_reported' => false,
            ]);
        }

        $this->command->info('Chats and messages seeded successfully!');
    }
}
