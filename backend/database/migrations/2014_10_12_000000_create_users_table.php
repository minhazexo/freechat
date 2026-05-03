<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->string('email')->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('avatar')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->boolean('is_online')->default(false);
            $table->boolean('is_banned')->default(false);
            $table->text('ban_reason')->nullable();
            $table->timestamp('banned_until')->nullable();
            $table->timestamp('last_active_at')->nullable();
            $table->json('interests')->nullable();
            $table->json('preferences')->nullable();
            $table->integer('warning_count')->default(0);
            $table->json('metadata')->nullable();
            $table->rememberToken();
            $table->timestamps();
            
            $table->index('is_online');
            $table->index('is_banned');
            $table->index('last_active_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
