# Chitchat Clone - Laravel + React

A full-stack anonymous chat application built with Laravel 10 (PHP 8.2+) and React 19 + Vite + TypeScript. Features text and video chat, interest-based matching, friends system, AI moderation, and admin panel.

## Features

### Core Features
- **Anonymous & Registered Login** - Chat without account or register to save history
- **Text Chat** - Real-time messaging with typing indicators
- **Video Chat** - WebRTC-powered video calls with screen sharing
- **Interest-Based Matching** - Find people with similar interests
- **Friends System** - Add friends, send/accept requests
- **Chat History** - View past conversations (registered users)
- **AI Moderation** - Automatic content filtering
- **Reporting & Blocking** - Report inappropriate users, block unwanted contacts

### Admin Features
- **Dashboard** - Real-time statistics and metrics
- **User Management** - Ban/unban users, view user details
- **Report Management** - Review and resolve user reports
- **Moderation Logs** - Track all moderation actions

## Tech Stack

### Backend (Laravel)
- Laravel 10 with PHP 8.2+
- MySQL Database
- Redis for Cache/Sessions
- JWT Authentication (php-open-source-saver/jwt-auth)
- Laravel WebSockets for real-time events
- Pusher for broadcasting

### Frontend (React)
- React 19 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand for state management
- Simple-peer for WebRTC
- Laravel Echo for WebSocket client

### Infrastructure
- Local development with PHP built-in server
- Redis Cache for sessions and broadcasting
- MySQL Database

## Project Structure

```
chitchat-clone/
├── backend/              # Laravel application
│   ├── app/
│   │   ├── Console/      # Artisan commands
│   │   ├── Events/       # WebSocket events
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # API controllers
│   │   │   ├── Middleware/       # Custom middleware
│   │   │   ├── Resources/        # API resources
│   │   │   └── Requests/         # Form requests
│   │   ├── Models/       # Eloquent models
│   │   ├── Services/     # Business logic
│   │   └── Providers/    # Service providers
│   ├── config/           # Configuration files
│   ├── database/
│   │   ├── factories/    # Model factories
│   │   ├── migrations/   # Database migrations
│   │   └── seeders/      # Database seeders
│   ├── routes/
│   │   ├── api.php       # API routes
│   │   └── channels.php  # Broadcasting channels
│   └── public/           # Web root (frontend build goes here)
└── frontend/             # React application
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── stores/       # Zustand stores
    │   ├── hooks/        # Custom hooks
    │   ├── services/     # API services
    │   └── types/        # TypeScript types
    └── public/           # Static assets
```

## Installation

### Prerequisites
- PHP 8.2+ & Composer
- Node.js 20+ (for frontend development)
- MySQL 8.0+
- Redis 7.0+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install PHP dependencies:
```bash
composer install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Configure database in `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=chitchat
DB_USERNAME=root
DB_PASSWORD=your_password
```

5. Generate application key:
```bash
php artisan key:generate
```

6. Generate JWT secret:
```bash
php artisan jwt:secret
```

7. Run migrations:
```bash
php artisan migrate
```

8. Run seeders:
```bash
php artisan db:seed
```

9. Start the development server:
```bash
php artisan serve
```

10. Start WebSocket server (in another terminal):
```bash
php artisan websockets:serve
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Update API URL in `.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

5. Start development server:
```bash
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173 (or the port shown by `npm run dev`)
- API: http://localhost:8000/api
- WebSocket: ws://localhost:6001

## Default Credentials

### Admin User
- Email: admin@chitchat.com
- Password: admin123

### Test User
- Email: test@example.com
- Password: password

## Production Notes (Read This Before Deploying)

### 1) Do not ship secrets in the repo
- Never commit or share `backend/.env` or `frontend/.env`. Use `backend/.env.example` + `frontend/.env.example` (or the production templates) and generate secrets on the server.
- Production templates:
  - `backend/.env.production.example`
  - `frontend/.env.production.example`

### 2) Do not commit dependencies/build output
- Keep `backend/vendor`, `frontend/node_modules`, and `frontend/dist` out of version control.

### 3) Required production services
- MySQL (or compatible)
- Redis (cache/sessions/queue + broadcasting)
- A process manager for:
  - `php artisan queue:work`
  - `php artisan websockets:serve` (or Pusher Cloud)

Example Supervisor config: `deploy/supervisor.example.conf`

### 4) Recommended hardening checklist
- `APP_ENV=production`, `APP_DEBUG=false`
- HTTPS everywhere (`APP_URL`, `APP_FRONTEND_URL`, `PUSHER_SCHEME=https`)
- Run: `php artisan config:cache && php artisan route:cache && php artisan view:cache`
- Add backups + log rotation
- Add rate-limit monitoring and admin audit reviews

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/anonymous | Anonymous login |
| POST | /api/auth/register | Register new account |
| POST | /api/auth/login | Login with credentials |
| POST | /api/auth/logout | Logout current user |
| POST | /api/auth/refresh | Refresh JWT token |
| GET | /api/auth/verify | Verify token validity |
| GET | /api/auth/me | Get current user |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user/profile | Get user profile |
| PUT | /api/user/profile | Update profile |
| POST | /api/user/change-password | Change password |
| GET | /api/user/history | Get chat history |
| POST | /api/user/status | Update online status |

### Friends Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/friends | List friends |
| POST | /api/friends/request | Send friend request |
| POST | /api/friends/accept | Accept request |
| POST | /api/friends/reject | Reject request |
| DELETE | /api/friends | Remove friend |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/chat/search | Search for match |
| POST | /api/chat/cancel | Cancel search |
| POST | /api/chat/message | Send message |
| POST | /api/chat/typing | Send typing indicator |
| POST | /api/chat/end | End chat |
| POST | /api/chat/skip | Skip to next |
| POST | /api/chat/add-friend | Add friend from chat |
| GET | /api/chat/messages/{id} | Get chat messages |
| GET | /api/chat/active | Get active chat |

### WebRTC Signaling Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/signaling/offer | Send WebRTC offer |
| POST | /api/signaling/answer | Send WebRTC answer |
| POST | /api/signaling/ice-candidate | Send ICE candidate |
| POST | /api/signaling/toggle-media | Toggle video/audio |
| POST | /api/signaling/screen-share | Toggle screen share |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Get dashboard stats |
| GET | /api/admin/users | List users |
| GET | /api/admin/users/{id} | Get user details |
| POST | /api/admin/users/{id}/ban | Ban user |
| POST | /api/admin/users/{id}/unban | Unban user |
| GET | /api/admin/reports | List reports |
| POST | /api/admin/reports/{id}/resolve | Resolve report |
| POST | /api/admin/reports/{id}/dismiss | Dismiss report |

## WebSocket Events

### Chat Events
- `chat:message` - New message received
- `chat:typing` - User typing indicator
- `chat:started` - Chat started
- `chat:ended` - Chat ended

### WebRTC Events
- `webrtc:offer` - WebRTC offer received
- `webrtc:answer` - WebRTC answer received
- `webrtc:ice-candidate` - ICE candidate received
- `webrtc:toggle-media` - Media toggle notification
- `webrtc:screen-share` - Screen share notification

## Environment Variables

### Backend (.env)

```env
APP_NAME=Chitchat
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=chitchat
DB_USERNAME=root
DB_PASSWORD=

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

PUSHER_APP_ID=chitchat-app
PUSHER_APP_KEY=chitchat-key
PUSHER_APP_SECRET=chitchat-secret
PUSHER_HOST=127.0.0.1
PUSHER_PORT=6001

JWT_SECRET=
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
VITE_PUSHER_APP_KEY=chitchat-key
VITE_PUSHER_HOST=localhost
VITE_PUSHER_PORT=6001
```

## Useful Commands

### Backend Commands

```bash
# Run migrations
php artisan migrate

# Run seeders
php artisan db:seed

# Create new migration
php artisan make:migration create_table_name

# Create new model
php artisan make:model ModelName

# Create new controller
php artisan make:controller Api/ControllerName

# Create new middleware
php artisan make:middleware MiddlewareName

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Start WebSocket server
php artisan websockets:serve

# Run queue worker
php artisan queue:work

# Run scheduler
php artisan schedule:work
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Deployment

### Shared Hosting (InfinityFree, etc.)

1. Upload backend files to `htdocs` or `public_html`
2. Set document root to `public` folder
3. Create MySQL database and update `.env`
4. Run migrations via SSH or PHP script
5. Build frontend and upload to `public` folder
6. Configure `.htaccess` for URL rewriting

### VPS/Dedicated Server (Traditional LEMP Stack)

1. Install PHP, MySQL, Redis, Nginx/Apache, and Node.js on your server
2. Clone repository and configure environment variables
3. Set up Nginx/Apache virtual host pointing to `backend/public`
4. Set up SSL certificates (Let's Encrypt)
5. Configure firewall rules
6. Run migrations and seeders
7. Build frontend and serve via Nginx or separate Node server

## Security Considerations

- Change default admin credentials
- Use strong JWT secret
- Enable HTTPS in production
- Configure CORS properly
- Set up rate limiting
- Regular security updates
- Monitor logs for suspicious activity

## Troubleshooting

### Common Issues

1. **WebSocket connection failed**
   - Check Pusher configuration
   - Verify WebSocket server is running
   - Check firewall settings

2. **Video chat not working**
   - Ensure HTTPS is enabled (required for camera access)
   - Check browser permissions
   - Verify STUN/TURN servers

3. **Database connection error**
   - Verify database credentials
   - Check MySQL service status
   - Ensure database exists

4. **CORS errors**
   - Update CORS configuration in Laravel
   - Verify frontend URL in allowed origins

## License

This project is open-source and available under the MIT License.

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Credits

Built with:
- [Laravel](https://laravel.com)
- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Simple-Peer](https://github.com/feross/simple-peer)
