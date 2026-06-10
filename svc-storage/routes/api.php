<?php
use App\Http\Controllers\StorageController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    // File storage (existing)
    Route::get('/storage',               [StorageController::class, 'index']);
    Route::post('/storage/upload',       [StorageController::class, 'upload']);
    Route::get('/storage/{id}/download', [StorageController::class, 'download']);
    Route::delete('/storage/{id}',       [StorageController::class, 'destroy']);

    // Assets
    Route::get('/assets',         [AssetController::class, 'index']);
    Route::post('/assets',        [AssetController::class, 'store']);
    Route::get('/assets/{id}',    [AssetController::class, 'show']);
    Route::put('/assets/{id}',    [AssetController::class, 'update']);
    Route::delete('/assets/{id}', [AssetController::class, 'destroy']);

    // Attendance
    Route::get('/attendance/today',          [AttendanceController::class, 'today']);
    Route::post('/attendance/clock-in',      [AttendanceController::class, 'clockIn']);
    Route::post('/attendance/clock-out',     [AttendanceController::class, 'clockOut']);
    Route::get('/attendance/history',        [AttendanceController::class, 'history']);
    Route::get('/attendance/report',         [AttendanceController::class, 'report']);
    Route::get('/attendance/download/{id}',  [AttendanceController::class, 'downloadFile']);

    // Documents
    Route::get('/documents',              [DocumentController::class, 'index']);
    Route::post('/documents',             [DocumentController::class, 'store']);
    Route::get('/documents/{id}',         [DocumentController::class, 'show']);
    Route::put('/documents/{id}',         [DocumentController::class, 'update']);
    Route::get('/documents/{id}/download',[DocumentController::class, 'download']);
    Route::delete('/documents/{id}',      [DocumentController::class, 'destroy']);
});
