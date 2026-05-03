<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('chat_id')->constrained('chats')->onDelete('cascade');
            $table->foreignId('other_user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['text', 'video'])->default('text');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->default(0);
            $table->integer('message_count')->default(0);
            $table->boolean('was_friend_added')->default(false);
            $table->boolean('was_reported')->default(false);
            $table->tinyInteger('rating')->nullable();
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('chat_id');
            $table->index('other_user_id');
            $table->index('type');
            $table->index('started_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_histories');
    }
};
