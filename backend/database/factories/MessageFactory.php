<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class MessageFactory extends Factory
{
    protected $model = \App\Models\Message::class;

    public function definition(): array
    {
        return [
            'type' => 'text',
            'content' => fake()->sentence(fake()->numberBetween(3, 20)),
            'is_edited' => false,
            'is_deleted' => false,
            'metadata' => [],
        ];
    }

    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'system',
            'content' => fake()->randomElement([
                'User joined the chat',
                'User left the chat',
                'Chat started',
                'Chat ended',
            ]),
            'user_id' => null,
        ]);
    }

    public function deleted(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_deleted' => true,
            'deleted_at' => now(),
            'content' => '[deleted]',
        ]);
    }
}
