<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login',    [AuthController::class, 'login']);

    Route::middleware('jwt.auth')->group(function () {
        Route::get('/auth/me',       [AuthController::class, 'me']);
        Route::post('/auth/logout',  [AuthController::class, 'logout']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);

        Route::post('/auth/telegram', function (Request $request) {
            $request->validate(['telegram_chat_id' => 'required|string|max:50']);
            auth()->user()->update(['telegram_chat_id' => $request->telegram_chat_id]);
            return response()->json(['message' => 'Telegram chat ID updated']);
        });

        Route::apiResource('users', UserController::class);
        Route::post('/users/{id}/roles',    [UserController::class, 'assignRole']);

        Route::post('/users/{id}/telegram', function (Request $request, string $id) {
            $request->validate(['telegram_chat_id' => 'required|string|max:50']);
            $roles = (array) auth()->payload()->get('roles');
            abort_if(!in_array('kepala_balai', $roles), 403, 'Forbidden');
            User::findOrFail($id)->update(['telegram_chat_id' => $request->telegram_chat_id]);
            return response()->json(['message' => 'Telegram chat ID updated']);
        });

        Route::prefix('admin')->group(function () {

            Route::get('/users/stats',          [AdminUserController::class, 'stats']);
            Route::get('/users',                [AdminUserController::class, 'index']);
            Route::post('/users',               [AdminUserController::class, 'store']);
            Route::get('/users/{id}',           [AdminUserController::class, 'show']);
            Route::patch('/users/{id}',         [AdminUserController::class, 'update']);
            Route::patch('/users/{id}/role',    [AdminUserController::class, 'updateRole']);
            Route::patch('/users/{id}/status',  [AdminUserController::class, 'updateStatus']);
            Route::delete('/users/{id}',        [AdminUserController::class, 'destroy']);

        });
    });

    Route::middleware('internal')->prefix('internal')->group(function () {
        Route::get('/users-by-role/{role}', function (string $role) {
            $users = \Illuminate\Support\Facades\DB::table('users')
                ->join('model_has_roles', \Illuminate\Support\Facades\DB::raw('users.id::text'), '=', \Illuminate\Support\Facades\DB::raw('model_has_roles.model_id::text'))
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('roles.name', $role)
                ->where('users.is_active', true)
                ->whereNull('users.deleted_at')
                ->select('users.id', 'users.full_name', 'users.email', 'users.telegram_chat_id')
                ->get();
            return response()->json(['data' => $users]);
        });

        Route::get('/stats', function () {
            $total  = \App\Models\User::count();
            $active = \App\Models\User::where('is_active', true)->count();
            return response()->json(['data' => [
                'total_users'  => $total,
                'active_users' => $active,
            ]]);
        });

        Route::get('/users/{id}', function (string $id) {
            $user = User::findOrFail($id);
            return response()->json(['data' => [
                'id'               => $user->id,
                'full_name'        => $user->full_name,
                'email'            => $user->email,
                'telegram_chat_id' => $user->telegram_chat_id,
                'division'         => $user->division,
                'is_active'        => $user->is_active,
                'roles'            => $user->getRoleNames(),
            ]]);
        });

        Route::post('/users/batch', function (Request $request) {
            $request->validate(['ids' => 'required|array', 'ids.*' => 'uuid']);
            $users = User::whereIn('id', $request->ids)
                ->get(['id', 'full_name', 'email', 'telegram_chat_id', 'division', 'is_active']);
            return response()->json(['data' => $users]);
        });

        Route::middleware('jwt.auth')->get('/auth/validate', function () {
            return response()->json(['data' => [
                'user_id'   => auth()->id(),
                'roles'     => auth()->payload()->get('roles'),
                'email'     => auth()->payload()->get('email'),
                'full_name' => auth()->payload()->get('full_name'),
            ]]);
        });
    });
});
