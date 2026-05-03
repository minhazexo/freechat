<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reporter' => $this->reporter ? [
                'id' => $this->reporter->id,
                'username' => $this->reporter->username,
            ] : null,
            'reported' => $this->reported ? [
                'id' => $this->reported->id,
                'username' => $this->reported->username,
            ] : null,
            'chat_id' => $this->chat_id,
            'type' => $this->type,
            'reason' => $this->reason,
            'description' => $this->description,
            'evidence' => $this->evidence,
            'status' => $this->status,
            'resolver' => $this->resolver ? [
                'id' => $this->resolver->id,
                'username' => $this->resolver->username,
            ] : null,
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'resolution' => $this->resolution,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
