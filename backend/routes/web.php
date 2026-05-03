<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('welcome');
});

// Catch-all route for SPA
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
