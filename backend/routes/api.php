<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\DonorController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\MedicalReportController;
use App\Http\Controllers\TestResultController;
use App\Http\Controllers\KidneyMatchController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\AnalyzeReportController;
use App\Http\Controllers\OcrStatusController;
use App\Http\Controllers\PublicDonorRegistrationController;
use App\Http\Controllers\PublicBloodBankController;
use App\Http\Controllers\PublicMatchingController;
use App\Http\Controllers\AdminMaintenanceController;
use App\Http\Controllers\SponsorController;
use App\Http\Controllers\ArticleController;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::put('me', [AuthController::class, 'update']);
        Route::post('me/photo', [AuthController::class, 'uploadPhoto']);
        Route::post('me/cover', [AuthController::class, 'uploadCover']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Public endpoints for OCR / AI services
Route::post('analyze-report', [AnalyzeReportController::class, 'analyze']);
Route::get('ocr-status', [OcrStatusController::class, 'status']);
// Public blood bank donors listing
Route::get('public/donors', [PublicBloodBankController::class, 'donors']);
// Public donor matching (scored)
Route::get('public/matching/donors', [PublicMatchingController::class, 'matchDonors']);
// Public sponsors listing
Route::get('public/sponsors', [SponsorController::class, 'active']);
// Public articles listing
Route::get('public/articles', [ArticleController::class, 'published']);
Route::get('public/articles/{slug}', [ArticleController::class, 'showBySlug']);

Route::middleware('auth:sanctum')->group(function () {
    // Donor registration (requires authentication)
    // Use string-based controller reference to avoid Intelephense undefined type warning
    Route::post('donors/register', 'App\\Http\\Controllers\\PublicDonorRegistrationController@store');
    Route::apiResource('donors', DonorController::class);
    Route::get('donor/me', [DonorController::class, 'me']);
    Route::apiResource('patients', PatientController::class);
    Route::get('patient/me', [PatientController::class, 'me']);
    Route::apiResource('medical-reports', MedicalReportController::class);
    Route::get('medical-reports/me', [MedicalReportController::class, 'me']);
    Route::post('medical-reports/me/upload', [MedicalReportController::class, 'uploadMe']);
    Route::get('medical-reports/me-donor', [MedicalReportController::class, 'meDonor']);
    Route::post('medical-reports/me-donor/upload', [MedicalReportController::class, 'uploadDonorMe']);
    Route::apiResource('test-results', TestResultController::class);
    Route::apiResource('kidney-matches', KidneyMatchController::class);
    Route::apiResource('activity-logs', ActivityLogController::class)->only(['index','show','store','destroy']);
    Route::get('contact/me', [ContactController::class, 'me']);
    Route::put('contact/me', [ContactController::class, 'updateMe']);
    // Sponsor management
    Route::apiResource('sponsors', SponsorController::class);
    // Article management
    Route::apiResource('articles', ArticleController::class);
    // Admin maintenance endpoints
    Route::post('admin/backfill-donor-type', [AdminMaintenanceController::class, 'backfill']);
    Route::get('admin/benchmarks/donor-queries', [AdminMaintenanceController::class, 'explain']);
});
