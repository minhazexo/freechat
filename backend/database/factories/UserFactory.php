<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = \App\Models\User::class;

    public function definition(): array
    {
        return [
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=' . Str::random(10),
            'is_anonymous' => false,
            'is_online' => false,
            'is_banned' => false,
            'interests' => fake()->randomElements(['gaming', 'music', 'movies', 'sports', 'tech', 'art'], fake()->numberBetween(1, 3)),
            'preferences' => [
                'notifications' => true,
                'sound_enabled' => true,
                'video_enabled' => true,
            ],
            'warning_count' => 0,
            'metadata' => [],
        ];
    }

    public function anonymous(): static
    {
        return $this->state(fn (array $attributes) => [
            'username' => 'Guest' . fake()->unique()->numberBetween(10000, 99999),
            'email' => null,
            'password' => null,
            'is_anonymous' => true,
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'username' => 'admin',
            'email' => 'admin@chitchat.com',
            'metadata' => ['role' => 'admin'],
        ]);
    }

    public function banned(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_banned' => true,
            'ban_reason' => 'Violation of terms of service',
            'banned_until' => now()->addDays(7),
        ]);
    }

    public function online(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_online' => true,
            'last_active_at' => now(),
        ]);
    }
}
