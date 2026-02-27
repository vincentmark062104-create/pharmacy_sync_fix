<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = ['date', 'items', 'total', 'cash', 'change', 'cashier'];

    protected $casts = [
        'items' => 'array',
        'total' => 'float',
        'cash' => 'float',
        'change' => 'float',
    ];
}
