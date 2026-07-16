<?php
use App\Http\Controllers\StorageController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EsignController;
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

    // Documents
    Route::get('/documents',              [DocumentController::class, 'index']);
    Route::post('/documents',             [DocumentController::class, 'store']);
    Route::get('/documents/{id}',         [DocumentController::class, 'show']);
    Route::put('/documents/{id}',         [DocumentController::class, 'update']);
    Route::get('/documents/{id}/download',[DocumentController::class, 'download']);
    Route::delete('/documents/{id}',      [DocumentController::class, 'destroy']);

    // e-Sign
    Route::get('/esign',                  [EsignController::class, 'index']);
    Route::post('/esign/sign',            [EsignController::class, 'sign']);
    Route::get('/esign/{id}/download',    [EsignController::class, 'download']);
    Route::post('/esign/{id}/verify',     [EsignController::class, 'verify']);
});
