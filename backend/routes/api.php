<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Auth routes for SPA
Route::post('/auth/login/student', [AuthController::class, 'loginStudent']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

// Public/basic endpoints for initial scaffolding
Route::get('/courses', [CourseController::class, 'index']);
Route::post('/courses', [CourseController::class, 'store']);
Route::get('/courses/{course}', [CourseController::class, 'show']);

Route::get('/evaluations', [EvaluationController::class, 'index']);
Route::post('/evaluations', [EvaluationController::class, 'store']);
Route::get('/evaluations/{evaluation}', [EvaluationController::class, 'show']);

Route::post('/feedbacks', [FeedbackController::class, 'store']);

// Department management
Route::get('/departments', [DepartmentController::class, 'index']);
Route::get('/departments/{department}', [DepartmentController::class, 'show']);
Route::post('/departments', [DepartmentController::class, 'store']);
Route::put('/departments/{department}', [DepartmentController::class, 'update']);
Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);
Route::post('/departments/{department}/assign-admin', [DepartmentController::class, 'assignAdmin']);

// Department admins management
Route::get('/department-admins', [DepartmentController::class, 'listAdmins']);
Route::put('/department-admins/{user}', [DepartmentController::class, 'updateAdmin']);
Route::delete('/department-admins/{user}', [DepartmentController::class, 'deleteAdmin']);
