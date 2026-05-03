<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModerationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'moderator_id',
        'user_id',
        'action',
        'reason',
        'details',
        'ip_address',
        'metadata',
    ];

    protected $casts = [
        'details' => 'array',
        'metadata' => 'array',
    ];

    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByModerator($query, int $moderatorId)
    {
        return $query->where('moderator_id', $moderatorId);
    }

    public static function log(int $moderatorId, int $userId, string $action, string $reason = null, array $details = [], string $ipAddress = null): self
    {
        return self::create([
            'moderator_id' => $moderatorId,
            'user_id' => $userId,
            'action' => $action,
            'reason' => $reason,
            'details' => $details,
            'ip_address' => $ipAddress ?? request()->ip(),
        ]);
    }
}
