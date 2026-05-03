<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'status',
        'started_at',
        'ended_at',
        'ended_by',
        'end_reason',
        'interests',
        'metadata',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'interests' => 'array',
        'metadata' => 'array',
    ];

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_participants')
            ->withPivot(['joined_at', 'left_at', 'is_video_enabled', 'is_audio_enabled'])
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeEnded($query)
    {
        return $query->where('status', 'ended');
    }

    public function scopeText($query)
    {
        return $query->where('type', 'text');
    }

    public function scopeVideo($query)
    {
        return $query->where('type', 'video');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function end(string $reason = null, int $endedBy = null): void
    {
        $this->update([
            'status' => 'ended',
            'ended_at' => now(),
            'end_reason' => $reason,
            'ended_by' => $endedBy,
        ]);
    }

    public function getOtherParticipant(User $user): ?User
    {
        return $this->participants->first(fn ($p) => $p->id !== $user->id);
    }

    public function addParticipant(User $user, array $pivotData = []): void
    {
        $this->participants()->attach($user->id, array_merge([
            'joined_at' => now(),
        ], $pivotData));
    }

    public function removeParticipant(User $user): void
    {
        $this->participants()->updateExistingPivot($user->id, [
            'left_at' => now(),
        ]);
    }
}
