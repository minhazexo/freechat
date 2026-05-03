<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements JWTSubject
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'password',
        'avatar',
        'gender',
        'agreed_to_terms',
        'is_anonymous',
        'is_online',
        'is_banned',
        'ban_reason',
        'banned_until',
        'last_active_at',
        'interests',
        'preferences',
        'warning_count',
        'metadata',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'gender' => 'string',
        'agreed_to_terms' => 'boolean',
        'is_anonymous' => 'boolean',
        'is_online' => 'boolean',
        'is_banned' => 'boolean',
        'banned_until' => 'datetime',
        'last_active_at' => 'datetime',
        'interests' => 'array',
        'preferences' => 'array',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($user) {
            if (empty($user->avatar)) {
                $user->avatar = config('app.anonymous_avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg') . '?seed=' . Str::random(10);
            }
        });
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'username' => $this->username,
            'is_anonymous' => $this->is_anonymous,
            'is_admin' => $this->isAdmin(),
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin' || ($this->metadata['role'] ?? '') === 'admin';
    }

    public function isBanned(): bool
    {
        if (!$this->is_banned) {
            return false;
        }
        
        if ($this->banned_until && $this->banned_until->isPast()) {
            $this->update(['is_banned' => false, 'ban_reason' => null, 'banned_until' => null]);
            return false;
        }
        
        return true;
    }

    public function friends()
    {
        return $this->belongsToMany(User::class, 'friends', 'user_id', 'friend_id')
            ->wherePivot('status', 'accepted')
            ->withPivot('created_at');
    }

    public function friendRequests()
    {
        return $this->belongsToMany(User::class, 'friends', 'friend_id', 'user_id')
            ->wherePivot('status', 'pending')
            ->withPivot('created_at');
    }

    public function pendingFriends()
    {
        return $this->belongsToMany(User::class, 'friends', 'user_id', 'friend_id')
            ->wherePivot('status', 'pending')
            ->withPivot('created_at');
    }

    public function blockedUsers()
    {
        return $this->belongsToMany(User::class, 'blocked_users', 'user_id', 'blocked_user_id')
            ->withPivot('reason', 'created_at');
    }

    public function chats()
    {
        return $this->belongsToMany(Chat::class, 'chat_participants')
            ->withPivot('joined_at', 'left_at');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function reportsMade()
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function reportsReceived()
    {
        return $this->hasMany(Report::class, 'reported_id');
    }

    public function moderationLogs()
    {
        return $this->hasMany(ModerationLog::class, 'moderator_id');
    }

    public function chatHistories()
    {
        return $this->hasMany(ChatHistory::class);
    }

    public function scopeOnline($query)
    {
        return $query->where('is_online', true)
            ->where('last_active_at', '>=', now()->subMinutes(5));
    }

    public function scopeAvailableForChat($query)
    {
        return $query->where('is_online', true)
            ->where('is_banned', false)
            ->whereDoesntHave('chats', function ($q) {
                $q->where('status', 'active');
            });
    }

    public function updateLastActive()
    {
        $this->update(['last_active_at' => now()]);
    }

    public function hasBlocked(User $user): bool
    {
        return $this->blockedUsers()->where('blocked_user_id', $user->id)->exists();
    }

    public function isFriendsWith(User $user): bool
    {
        return $this->friends()->where('friend_id', $user->id)->exists();
    }

    public function hasPendingFriendRequestFrom(User $user): bool
    {
        return $this->friendRequests()->where('user_id', $user->id)->exists();
    }

    public function hasSentFriendRequestTo(User $user): bool
    {
        return $this->pendingFriends()->where('friend_id', $user->id)->exists();
    }
}
