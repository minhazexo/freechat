<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'user_id',
        'type',
        'content',
        'is_edited',
        'edited_at',
        'is_deleted',
        'deleted_at',
        'metadata',
    ];

    protected $casts = [
        'is_edited' => 'boolean',
        'is_deleted' => 'boolean',
        'edited_at' => 'datetime',
        'deleted_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', false);
    }

    public function scopeText($query)
    {
        return $query->where('type', 'text');
    }

    public function scopeSystem($query)
    {
        return $query->where('type', 'system');
    }

    public function edit(string $content): void
    {
        $this->update([
            'content' => $content,
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }

    public function deleteMessage(): void
    {
        $this->update([
            'is_deleted' => true,
            'deleted_at' => now(),
            'content' => '[deleted]',
        ]);
    }

    public function getDisplayContent(): string
    {
        if ($this->is_deleted) {
            return '[deleted]';
        }
        return $this->content;
    }
}
