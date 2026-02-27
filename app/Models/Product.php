<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name', 'genericName', 'brand', 'dosage', 'category', 'price',
        'quantity', 'minStock', 'expirationDate', 'supplierId', 'barcode', 'history'
    ];

    protected $casts = [
        'history' => 'array',
        'price' => 'float',
        'quantity' => 'integer',
        'minStock' => 'integer',
        'supplierId' => 'integer',
    ];
}
