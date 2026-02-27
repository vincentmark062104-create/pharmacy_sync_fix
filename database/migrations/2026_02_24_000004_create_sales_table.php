<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('date');
            $table->json('items')->nullable();
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('cash', 12, 2)->nullable();
            $table->decimal('change', 12, 2)->nullable();
            $table->string('cashier')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
