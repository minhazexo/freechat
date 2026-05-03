<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ChatFactory extends Factory
{
    protected $model = \App\Models\Chat::class;

    public function definition(): array
    {
        return [
            'type' => fake()->randomElement(['text', 'video']),
            'status' => 'ended',
            'started_at' => fake()->dateTimeBetween('-1 month', '-1 day'),
            'ended_at' => fake()->dateTimeBetween('-1 day', 'now'),
            'end_reason' => fake()->randomElement(['user_left', 'skipped', 'disconnected', null]),
            'interests' => fake()->randomElements(['gaming', 'music', 'movies'], fake()->numberBetween(0, 2)),
            'metadata' => [],
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'started_at' => now(),
            'ended_at' => null,
            'end_reason' => null,
        ]);
    }

    public function text(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'text',
        ]);
    }

    public function video(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'video',
        ]);
    }
}
