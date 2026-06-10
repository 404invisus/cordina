<?php
use App\Http\Controllers\StorageController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    Route::get('/storage',               [StorageController::class, 'index']);
    Route::post('/storage/upload',       [StorageController::class, 'upload']);
    Route::get('/storage/{id}/download', [StorageController::class, 'download']);
    Route::delete('/storage/{id}',       [StorageController::class, 'destroy']);
});
