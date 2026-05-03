<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::factory()->create([
            'username' => 'admin',
            'email' => 'admin@chitchat.com',
            'password' => Hash::make('admin123'),
            'metadata' => ['role' => 'admin'],
        ]);

        // Create test user
        User::factory()->create([
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
        ]);

        // Create regular users
        User::factory()->count(20)->create();

        // Create anonymous users
        User::factory()->count(10)->anonymous()->create();

        // Create some banned users
        User::factory()->count(3)->banned()->create();

        $this->command->info('Users seeded successfully!');
        $this->command->info('Admin: admin@chitchat.com / admin123');
        $this->command->info('Test: test@example.com / password');
    }
}
