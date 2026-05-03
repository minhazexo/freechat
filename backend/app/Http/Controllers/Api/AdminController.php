<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Http\Resources\UserResource;
use App\Models\Chat;
use App\Models\ModerationLog;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('admin');
    }

    public function dashboard(): JsonResponse
    {
        $stats = [
            'users' => [
                'total' => User::count(),
                'online' => User::where('is_online', true)->count(),
                'anonymous' => User::where('is_anonymous', true)->count(),
                'registered' => User::where('is_anonymous', false)->count(),
                'banned' => User::where('is_banned', true)->count(),
                'new_today' => User::whereDate('created_at', today())->count(),
            ],
            'chats' => [
                'total' => Chat::count(),
                'active' => Chat::where('status', 'active')->count(),
                'text' => Chat::where('type', 'text')->count(),
                'video' => Chat::where('type', 'video')->count(),
                'today' => Chat::whereDate('created_at', today())->count(),
            ],
            'reports' => [
                'total' => Report::count(),
                'pending' => Report::where('status', 'pending')->count(),
                'resolved' => Report::where('status', 'resolved')->count(),
                'dismissed' => Report::where('status', 'dismissed')->count(),
            ],
            'moderation' => [
                'logs_today' => ModerationLog::whereDate('created_at', today())->count(),
                'total_logs' => ModerationLog::count(),
            ],
        ];

        return response()->json(['stats' => $stats]);
    }

    public function users(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|in:all,online,banned,anonymous',
            'sort_by' => 'nullable|in:created_at,last_active_at,username',
            'sort_order' => 'nullable|in:asc,desc',
            'limit' => 'sometimes|integer|min:1|max:100',
            'offset' => 'sometimes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = User::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->input('status') === 'online') {
            $query->where('is_online', true);
        } elseif ($request->input('status') === 'banned') {
            $query->where('is_banned', true);
        } elseif ($request->input('status') === 'anonymous') {
            $query->where('is_anonymous', true);
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $limit = $request->input('limit', 20);
        $offset = $request->input('offset', 0);

        $total = $query->count();
        $users = $query->skip($offset)->take($limit)->get();

        return response()->json([
            'users' => UserResource::collection($users),
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    public function getUser(int $id): JsonResponse
    {
        $user = User::with(['friends', 'blockedUsers', 'reportsMade', 'reportsReceived'])->find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    public function banUser(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
            'duration_minutes' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $duration = $request->input('duration_minutes');
        
        $user->update([
            'is_banned' => true,
            'ban_reason' => $request->input('reason'),
            'banned_until' => $duration ? now()->addMinutes($duration) : null,
        ]);

        // Log moderation action
        ModerationLog::log(
            auth('api')->id(),
            $user->id,
            'ban',
            $request->input('reason'),
            ['duration_minutes' => $duration],
        );

        return response()->json([
            'message' => 'User banned successfully',
            'user' => new UserResource($user),
        ]);
    }

    public function unbanUser(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->update([
            'is_banned' => false,
            'ban_reason' => null,
            'banned_until' => null,
        ]);

        // Log moderation action
        ModerationLog::log(
            auth('api')->id(),
            $user->id,
            'unban',
            $request->input('reason'),
        );

        return response()->json([
            'message' => 'User unbanned successfully',
            'user' => new UserResource($user),
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:all,pending,resolved,dismissed',
            'type' => 'nullable|in:spam,harassment,inappropriate,other',
            'limit' => 'sometimes|integer|min:1|max:100',
            'offset' => 'sometimes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = Report::with(['reporter', 'reported', 'chat']);

        $status = $request->input('status', 'all');
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        $query->orderBy('created_at', 'desc');

        $limit = $request->input('limit', 20);
        $offset = $request->input('offset', 0);

        $total = $query->count();
        $reports = $query->skip($offset)->take($limit)->get();

        return response()->json([
            'reports' => ReportResource::collection($reports),
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    public function getReport(int $id): JsonResponse
    {
        $report = Report::with(['reporter', 'reported', 'chat', 'resolver'])->find($id);

        if (!$report) {
            return response()->json(['message' => 'Report not found'], 404);
        }

        return response()->json([
            'report' => new ReportResource($report),
        ]);
    }

    public function resolveReport(Request $request, int $id): JsonResponse
    {
        $report = Report::find($id);

        if (!$report) {
            return response()->json(['message' => 'Report not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'resolution' => 'required|string|max:1000',
            'ban_user' => 'sometimes|boolean',
            'ban_duration_minutes' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $report->resolve(auth('api')->id(), $request->input('resolution'));

        // Optionally ban the reported user
        if ($request->input('ban_user', false)) {
            $reportedUser = $report->reported;
            $reportedUser->update([
                'is_banned' => true,
                'ban_reason' => 'Reported: ' . $report->reason,
                'banned_until' => $request->has('ban_duration_minutes') 
                    ? now()->addMinutes($request->input('ban_duration_minutes')) 
                    : null,
            ]);

            ModerationLog::log(
                auth('api')->id(),
                $reportedUser->id,
                'ban_from_report',
                'Banned from report resolution: ' . $report->reason,
                ['report_id' => $report->id],
            );
        }

        return response()->json([
            'message' => 'Report resolved successfully',
            'report' => new ReportResource($report->fresh()),
        ]);
    }

    public function dismissReport(Request $request, int $id): JsonResponse
    {
        $report = Report::find($id);

        if (!$report) {
            return response()->json(['message' => 'Report not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $report->dismiss(auth('api')->id(), $request->input('reason'));

        return response()->json([
            'message' => 'Report dismissed',
            'report' => new ReportResource($report->fresh()),
        ]);
    }

    public function moderationLogs(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'action' => 'nullable|string',
            'user_id' => 'nullable|integer|exists:users,id',
            'moderator_id' => 'nullable|integer|exists:users,id',
            'limit' => 'sometimes|integer|min:1|max:100',
            'offset' => 'sometimes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = ModerationLog::with(['moderator', 'user'])->orderBy('created_at', 'desc');

        if ($request->has('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->has('moderator_id')) {
            $query->where('moderator_id', $request->input('moderator_id'));
        }

        $limit = $request->input('limit', 20);
        $offset = $request->input('offset', 0);

        $total = $query->count();
        $logs = $query->skip($offset)->take($limit)->get();

        return response()->json([
            'logs' => $logs,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    public function deleteUser(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Prevent deleting admin users
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot delete admin users'], 403);
        }

        // Soft delete or hard delete based on preference
        // Here we do hard delete with cascading
        DB::transaction(function () use ($user) {
            $user->delete();
        });

        ModerationLog::log(
            auth('api')->id(),
            $id,
            'delete_user',
            $request->input('reason', 'User deleted by admin'),
        );

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function warnUser(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->increment('warning_count');

        ModerationLog::log(
            auth('api')->id(),
            $user->id,
            'warn',
            $request->input('reason'),
            ['warning_count' => $user->warning_count],
        );

        return response()->json([
            'message' => 'Warning issued',
            'warning_count' => $user->warning_count,
        ]);
    }
}
