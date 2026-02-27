<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('genericName')->nullable();
            $table->string('brand')->nullable();
            $table->string('category')->default('Analgesic');
            $table->decimal('price', 10, 2)->default(0);
            $table->integer('quantity')->default(0);
            $table->integer('minStock')->default(10);
            $table->date('expirationDate')->nullable();
            $table->unsignedBigInteger('supplierId')->nullable();
            $table->string('barcode')->nullable();
            $table->json('history')->nullable();
            $table->timestamps();

            $table->foreign('supplierId')->references('id')->on('suppliers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
