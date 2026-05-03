<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_id',
        'reported_id',
        'chat_id',
        'type',
        'reason',
        'description',
        'evidence',
        'status',
        'resolved_by',
        'resolved_at',
        'resolution',
        'metadata',
    ];

    protected $casts = [
        'evidence' => 'array',
        'resolved_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reported(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_id');
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    public function scopeDismissed($query)
    {
        return $query->where('status', 'dismissed');
    }

    public function resolve(int $resolverId, string $resolution): void
    {
        $this->update([
            'status' => 'resolved',
            'resolved_by' => $resolverId,
            'resolved_at' => now(),
            'resolution' => $resolution,
        ]);
    }

    public function dismiss(int $resolverId, string $reason = null): void
    {
        $this->update([
            'status' => 'dismissed',
            'resolved_by' => $resolverId,
            'resolved_at' => now(),
            'resolution' => $reason,
        ]);
    }
}
