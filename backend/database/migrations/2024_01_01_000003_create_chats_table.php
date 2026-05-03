<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['text', 'video'])->default('text');
            $table->enum('status', ['active', 'ended', 'waiting'])->default('waiting');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->foreignId('ended_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('end_reason')->nullable();
            $table->json('interests')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index('status');
            $table->index('type');
            $table->index('started_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
