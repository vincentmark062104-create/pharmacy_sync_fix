<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Sale;
use App\Models\Log;
use Illuminate\Http\Request;

class ApiController extends Controller
{
    // ---- ACCOUNTS ----
    public function accountsIndex()
    {
        return response()->json(Account::orderBy('id')->get());
    }

    public function accountsStore(Request $request)
    {
        $account = Account::create($request->only(['username', 'password', 'role']));
        // Return password so the JS can authenticate
        $account->makeVisible('password');
        return response()->json($account, 201);
    }

    public function accountsUpdate(Request $request, $id)
    {
        $account = Account::findOrFail($id);
        $account->update($request->only(['username', 'password', 'role']));
        $account->makeVisible('password');
        return response()->json($account);
    }

    public function accountsDestroy($id)
    {
        Account::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ---- PRODUCTS ----
    public function productsIndex()
    {
        return response()->json(Product::orderBy('id')->get());
    }

    public function productsStore(Request $request)
    {
        $product = Product::create($request->all());
        return response()->json($product, 201);
    }

    public function productsUpdate(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $product->update($request->all());
        return response()->json($product);
    }

    public function productsDestroy($id)
    {
        Product::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ---- SUPPLIERS ----
    public function suppliersIndex()
    {
        return response()->json(Supplier::orderBy('id')->get());
    }

    public function suppliersStore(Request $request)
    {
        $supplier = Supplier::create($request->all());
        return response()->json($supplier, 201);
    }

    public function suppliersUpdate(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->update($request->all());
        return response()->json($supplier);
    }

    public function suppliersDestroy($id)
    {
        Supplier::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ---- SALES ----
    public function salesIndex()
    {
        return response()->json(Sale::orderBy('id', 'desc')->get());
    }

    public function salesStore(Request $request)
    {
        $sale = Sale::create($request->all());
        return response()->json($sale, 201);
    }

    public function salesUpdate(Request $request, $id)
    {
        $sale = Sale::findOrFail($id);
        $sale->update($request->all());
        return response()->json($sale);
    }

    // ---- LOGS ----
    public function logsIndex()
    {
        return response()->json(Log::orderBy('id', 'desc')->get());
    }

    public function logsStore(Request $request)
    {
        $log = Log::create($request->all());
        return response()->json($log, 201);
    }
}
