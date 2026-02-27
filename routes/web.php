<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ApiController;

// ---- PAGE ROUTE ----
Route::get('/', [PageController::class, 'index']);

// ---- API ROUTES (no token needed for MVP) ----
Route::prefix('api')->group(function () {

    // Accounts
    Route::get('/accounts',        [ApiController::class, 'accountsIndex']);
    Route::post('/accounts',       [ApiController::class, 'accountsStore']);
    Route::put('/accounts/{id}',   [ApiController::class, 'accountsUpdate']);
    Route::delete('/accounts/{id}',[ApiController::class, 'accountsDestroy']);

    // Products
    Route::get('/products',        [ApiController::class, 'productsIndex']);
    Route::post('/products',       [ApiController::class, 'productsStore']);
    Route::put('/products/{id}',   [ApiController::class, 'productsUpdate']);
    Route::delete('/products/{id}',[ApiController::class, 'productsDestroy']);

    // Suppliers
    Route::get('/suppliers',        [ApiController::class, 'suppliersIndex']);
    Route::post('/suppliers',       [ApiController::class, 'suppliersStore']);
    Route::put('/suppliers/{id}',   [ApiController::class, 'suppliersUpdate']);
    Route::delete('/suppliers/{id}',[ApiController::class, 'suppliersDestroy']);

    // Sales
    Route::get('/sales',           [ApiController::class, 'salesIndex']);
    Route::post('/sales',          [ApiController::class, 'salesStore']);
    Route::put('/sales/{id}',      [ApiController::class, 'salesUpdate']);

    // Logs
    Route::get('/logs',            [ApiController::class, 'logsIndex']);
    Route::post('/logs',           [ApiController::class, 'logsStore']);
});

