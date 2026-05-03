<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\ChatHistory;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ChatMatchingService
{
    protected string $waitingPoolKey = 'chat:waiting:';
    protected int $matchTimeout = 300; // 5 minutes

    public function addToWaitingPool(int $userId, string $type, array $interests = [], array $filters = []): void
    {
        $key = $this->waitingPoolKey . $type;
        $waitingUsers = Cache::get($key, []);

        $waitingUsers[$userId] = json_encode([
            'user_id' => $userId,
            'interests' => $interests,
            'filters' => $filters,
            'joined_at' => now()->timestamp,
        ]);

        Cache::put($key, $waitingUsers, $this->matchTimeout);

        Log::info('[ChatMatching] User added to waiting pool', [
            'user_id' => $userId,
            'type' => $type,
            'interests' => $interests,
            'pool_size' => count($waitingUsers),
        ]);
    }

    public function removeFromWaitingPool(int $userId, string $type = null): void
    {
        if ($type) {
            $key = $this->waitingPoolKey . $type;
            $waitingUsers = Cache::get($key, []);
            unset($waitingUsers[$userId]);
            Cache::put($key, $waitingUsers, $this->matchTimeout);

            Log::info('[ChatMatching] User removed from waiting pool', [
                'user_id' => $userId,
                'type' => $type,
                'pool_size' => count($waitingUsers),
            ]);
        } else {
            foreach (['text', 'video'] as $t) {
                $key = $this->waitingPoolKey . $t;
                $waitingUsers = Cache::get($key, []);
                if (isset($waitingUsers[$userId])) {
                    unset($waitingUsers[$userId]);
                    Cache::put($key, $waitingUsers, $this->matchTimeout);

                    Log::info('[ChatMatching] User removed from waiting pool', [
                        'user_id' => $userId,
                        'type' => $t,
                        'pool_size' => count($waitingUsers),
                    ]);
                }
            }
        }
    }

    public function findMatch(int $userId, string $type, array $interests = []): ?array
    {
        $key = $this->waitingPoolKey . $type;
        $waitingUsers = Cache::get($key, []);

        if (empty($waitingUsers)) {
            Log::info('[ChatMatching] No users in waiting pool', [
                'user_id' => $userId,
                'type' => $type,
            ]);
            return null;
        }

        $user = User::find($userId);
        $bestMatch = null;
        $bestScore = -1;

        Log::info('[ChatMatching] Searching for match', [
            'user_id' => $userId,
            'type' => $type,
            'interests' => $interests,
            'pool_size' => count($waitingUsers),
        ]);

        foreach ($waitingUsers as $waitingUserId => $data) {
            $waitingUserId = (int) $waitingUserId;

            if ($waitingUserId === $userId) {
                continue;
            }

            $waitingData = json_decode($data, true);

            // Skip if user is blocked
            $waitingUser = User::find($waitingUserId);
            if (!$waitingUser || $user->hasBlocked($waitingUser) || $waitingUser->hasBlocked($user)) {
                Log::debug('[ChatMatching] Skipping blocked user', [
                    'user_id' => $userId,
                    'blocked_user_id' => $waitingUserId,
                ]);
                continue;
            }

            // Calculate match score based on interests
            $score = $this->calculateMatchScore($interests, $waitingData['interests'] ?? []);

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestMatch = $waitingData;
            }
        }

        if ($bestMatch) {
            // Remove both users from waiting pool
            $this->removeFromWaitingPool($userId, $type);
            $this->removeFromWaitingPool($bestMatch['user_id'], $type);

            Log::info('[ChatMatching] Match found', [
                'user_id' => $userId,
                'matched_user_id' => $bestMatch['user_id'],
                'type' => $type,
                'score' => $bestScore,
            ]);

            return $bestMatch;
        }

        Log::info('[ChatMatching] No match found in pool', [
            'user_id' => $userId,
            'type' => $type,
            'pool_size' => count($waitingUsers),
        ]);

        return null;
    }

    protected function calculateMatchScore(array $interests1, array $interests2): int
    {
        if (empty($interests1) || empty($interests2)) {
            return 0;
        }

        $common = array_intersect(
            array_map('strtolower', $interests1),
            array_map('strtolower', $interests2)
        );

        return count($common) * 10;
    }

    public function createChat(int $userId1, int $userId2, string $type, array $interests = []): Chat
    {
        $chat = Chat::create([
            'type' => $type,
            'status' => 'active',
            'started_at' => now(),
            'interests' => $interests,
        ]);

        $chat->addParticipant(User::find($userId1), ['joined_at' => now()]);
        $chat->addParticipant(User::find($userId2), ['joined_at' => now()]);

        // Create system message
        \App\Models\Message::create([
            'chat_id' => $chat->id,
            'user_id' => null,
            'type' => 'system',
            'content' => 'Chat started. Be respectful and have fun!',
        ]);

        // Create chat histories
        ChatHistory::create([
            'user_id' => $userId1,
            'chat_id' => $chat->id,
            'other_user_id' => $userId2,
            'type' => $type,
            'started_at' => now(),
        ]);

        ChatHistory::create([
            'user_id' => $userId2,
            'chat_id' => $chat->id,
            'other_user_id' => $userId1,
            'type' => $type,
            'started_at' => now(),
        ]);

        Log::info('[ChatMatching] Chat created', [
            'chat_id' => $chat->id,
            'user_id_1' => $userId1,
            'user_id_2' => $userId2,
            'type' => $type,
        ]);

        return $chat;
    }

    public function getUserActiveChat(int $userId): ?Chat
    {
        return Chat::where('status', 'active')
            ->whereHas('participants', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->with('participants')
            ->first();
    }

    public function cleanupStaleWaitingUsers(): int
    {
        $removed = 0;
        $timeout = now()->subMinutes(5)->timestamp;

        foreach (['text', 'video'] as $type) {
            $key = $this->waitingPoolKey . $type;
            $waitingUsers = Cache::get($key, []);
            $newWaitingUsers = $waitingUsers;

            foreach ($waitingUsers as $userId => $data) {
                $waitingData = json_decode($data, true);
                if ($waitingData['joined_at'] < $timeout) {
                    unset($newWaitingUsers[$userId]);
                    $removed++;

                    Log::info('[ChatMatching] Cleaned up stale waiting user', [
                        'user_id' => $userId,
                        'type' => $type,
                        'joined_at' => $waitingData['joined_at'],
                    ]);
                }
            }

            if ($removed > 0) {
                Cache::put($key, $newWaitingUsers, $this->matchTimeout);
            }
        }

        if ($removed > 0) {
            Log::info('[ChatMatching] Stale user cleanup complete', [
                'removed_count' => $removed,
            ]);
        }

        return $removed;
    }

    public function getWaitingCount(string $type = null): int
    {
        if ($type) {
            return count(Cache::get($this->waitingPoolKey . $type, []));
        }

        return count(Cache::get($this->waitingPoolKey . 'text', [])) +
            count(Cache::get($this->waitingPoolKey . 'video', []));
    }
}
