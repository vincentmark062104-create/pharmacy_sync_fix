<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Sale;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Default Accounts ---
        Account::insert([
            ['username' => 'admin',   'password' => 'admin123',  'role' => 'Admin',       'created_at' => now(), 'updated_at' => now()],
            ['username' => 'pharma',  'password' => 'password',  'role' => 'Pharmacist',  'created_at' => now(), 'updated_at' => now()],
            ['username' => 'cashier', 'password' => 'password',  'role' => 'Cashier',     'created_at' => now(), 'updated_at' => now()],
        ]);

        // --- Default Suppliers ---
        $sup1 = Supplier::create(['name' => 'PharmaCorp Inc.',  'contact' => '123-456-7890', 'address' => '123 Health Blvd', 'email' => 'sales@pharmacorp.com',   'productsSupplied' => 12]);
        $sup2 = Supplier::create(['name' => 'MediSupply Co.',   'contact' => '098-765-4321', 'address' => '456 Wellness Ave', 'email' => 'contact@medisupply.com', 'productsSupplied' => 8]);

        $mockHistory = fn($base) => array_map(fn() => random_int((int)($base * 0.8), (int)($base * 1.2)), range(1, 12));

        // --- Default Products ---
        Product::insert([
            ['name' => 'Biogesic',    'genericName' => 'Paracetamol',  'brand' => 'Unilab', 'category' => 'Analgesic',         'price' => 5.00,  'quantity' => 500, 'minStock' => 100, 'expirationDate' => '2027-05-12', 'supplierId' => $sup1->id, 'barcode' => '100001', 'history' => json_encode($mockHistory(800)), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Amoxil',      'genericName' => 'Amoxicillin',  'brand' => 'GSK',    'category' => 'Antibiotic',         'price' => 15.50, 'quantity' => 45,  'minStock' => 50,  'expirationDate' => '2026-08-20', 'supplierId' => $sup2->id, 'barcode' => '100002', 'history' => json_encode($mockHistory(200)), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Virlix',      'genericName' => 'Cetirizine',   'brand' => 'GSK',    'category' => 'Antihistamine',      'price' => 22.00, 'quantity' => 15,  'minStock' => 30,  'expirationDate' => '2026-01-15', 'supplierId' => $sup2->id, 'barcode' => '100003', 'history' => json_encode($mockHistory(150)), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Lifezar',     'genericName' => 'Losartan',     'brand' => 'Unilab', 'category' => 'Antihypertensive',  'price' => 18.00, 'quantity' => 300, 'minStock' => 100, 'expirationDate' => '2028-11-01', 'supplierId' => $sup1->id, 'barcode' => '100004', 'history' => json_encode($mockHistory(400)), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Glucophage',  'genericName' => 'Metformin',    'brand' => 'Merck',  'category' => 'Antidiabetic',       'price' => 12.00, 'quantity' => 0,   'minStock' => 50,  'expirationDate' => '2026-12-10', 'supplierId' => $sup1->id, 'barcode' => '100005', 'history' => json_encode($mockHistory(300)), 'created_at' => now(), 'updated_at' => now()],
        ]);

        // --- Sample historical sales (one per month this year) ---
        $year = date('Y');
        for ($i = 0; $i < 12; $i++) {
            Sale::create([
                'date'    => date("$year-m-15\T00:00:00.000\Z", mktime(0, 0, 0, $i + 1, 15, (int)$year)),
                'items'   => [['name' => 'Monthly Aggregate Data', 'qty' => 1, 'price' => 0, 'total' => 0]],
                'total'   => random_int(1500, 4000),
                'cash'    => null,
                'change'  => null,
                'cashier' => 'system',
            ]);
        }
    }
}
