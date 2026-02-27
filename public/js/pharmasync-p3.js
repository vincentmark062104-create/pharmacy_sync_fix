// Part 3: POSView (Sales / Point of Sale)

function POSView({ products, setProducts, sales, setSales, addNotification, user, logActivity, cart, setCart, db }) {
    const [viewMode, setViewMode] = useState('sale');
    const [search, setSearch] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [cashTendered, setCashTendered] = useState('');
    const [receiptData, setReceiptData] = useState(null);
    const [returnSaleData, setReturnSaleData] = useState(null);
    const [returnQtys, setReturnQuantities] = useState({});
    const currentYear = new Date().getFullYear();
    const [historyYear, setHistoryYear] = useState(currentYear.toString());
    const [historyMonth, setHistoryMonth] = useState('All');
    const [showSummary, setShowSummary] = useState(false);
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const filteredHistory = useMemo(() => {
        return sales.filter(s => {
            const d = new Date(s.date);
            const matchesYear = d.getFullYear().toString() === historyYear;
            const matchesMonth = historyMonth === 'All' || d.getMonth().toString() === historyMonth;
            return matchesYear && matchesMonth;
        });
    }, [sales, historyYear, historyMonth]);

    const summaryData = useMemo(() => {
        let totalRevenue = 0; let totalItems = 0; let itemMap = {};
        filteredHistory.forEach(sale => {
            totalRevenue += Number(sale.total);
            (sale.items || []).forEach(item => {
                if (item.name === 'Monthly Aggregate Data') return;
                totalItems += item.qty;
                if (!itemMap[item.name]) itemMap[item.name] = { qty: 0, total: 0 };
                itemMap[item.name].qty += item.qty;
                itemMap[item.name].total += Number(item.total);
            });
        });
        return { totalRevenue, totalItems, items: Object.entries(itemMap).map(([name, val]) => ({ name, ...val })).sort((a, b) => b.qty - a.qty) };
    }, [filteredHistory]);

    const processScanOrSearch = (query) => {
        if (!query) return;
        const q = query.toLowerCase().trim();
        const prod = products.find(p => (p.barcode || '') === q || (p.name || '').toLowerCase().includes(q) || (p.genericName || '').toLowerCase().includes(q));
        if (prod) {
            if (prod.quantity <= 0) return alert("Product is out of stock!");
            addToCart(prod); setSearch('');
        } else alert("Product not found!");
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.cartQty >= product.quantity) { alert("Cannot exceed available stock"); return prev; }
                return prev.map(item => item.id === product.id ? { ...item, cartQty: item.cartQty + 1, total: (item.cartQty + 1) * item.price } : item);
            }
            return [...prev, { ...product, cartQty: 1, total: product.price }];
        });
    };

    const updateCartQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.cartQty + delta;
                if (newQty <= 0) return null;
                if (newQty > item.quantity) { alert("Cannot exceed available stock"); return item; }
                return { ...item, cartQty: newQty, total: newQty * item.price };
            }
            return item;
        }).filter(Boolean));
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
    const changeAmount = parseFloat(cashTendered) >= totalAmount ? parseFloat(cashTendered) - totalAmount : 0;

    const handleCheckout = async () => {
        if (cart.length === 0 || isNaN(parseFloat(cashTendered)) || parseFloat(cashTendered) < totalAmount) return;
        const saleRecord = {
            date: new Date().toISOString(),
            items: cart.map(c => ({ id: c.id, name: c.name, qty: c.cartQty, price: c.price, total: c.total })),
            total: totalAmount, cash: parseFloat(cashTendered), change: changeAmount, cashier: user.username
        };
        const { data: saleData } = await db.from('sales').insert([saleRecord]).select();
        if (saleData) setSales(prev => [saleData[0], ...prev]);
        const cartMap = cart.reduce((acc, item) => ({ ...acc, [item.id]: item.cartQty }), {});
        const updatedProducts = products.map(p => {
            if (cartMap[p.id]) {
                const newQty = p.quantity - cartMap[p.id];
                db.from('products').update({ quantity: newQty }).eq('id', p.id).then();
                return { ...p, quantity: newQty };
            }
            return p;
        });
        setProducts(updatedProducts);
        addNotification(`Sale completed: ₱${totalAmount.toFixed(2)}`);
        if (saleData) logActivity(user, 'Process Sale', `Transaction ID: ${saleData[0].id} for ₱${totalAmount.toFixed(2)}`);
        setReceiptData(saleData ? saleData[0] : { id: 'TEMP', ...saleRecord });
        setCart([]); setCashTendered('');
    };

    const openReturnModal = (sale) => {
        setReturnSaleData(sale);
        const initialQtys = {};
        (sale.items || []).forEach(item => { initialQtys[item.id || item.name] = 0; });
        setReturnQuantities(initialQtys);
    };

    const handleReturnQtyChange = (itemId, val, max) => {
        let num = parseInt(val);
        if (isNaN(num) || num < 0) num = 0;
        if (num > max) num = max;
        setReturnQuantities(prev => ({ ...prev, [itemId]: num }));
    };

    const processReturn = async () => {
        if (!returnSaleData) return;
        let totalRefund = 0;
        const updatedItems = (returnSaleData.items || []).map(item => {
            const itemId = item.id || item.name;
            const retQty = returnQtys[itemId] || 0;
            if (retQty > 0) {
                totalRefund += retQty * item.price;
                const prodToUpdate = products.find(p => p.id === item.id || p.name === item.name);
                if (prodToUpdate) {
                    const newQty = prodToUpdate.quantity + retQty;
                    db.from('products').update({ quantity: newQty }).eq('id', prodToUpdate.id).then();
                    setProducts(prev => prev.map(p => p.id === prodToUpdate.id ? { ...p, quantity: newQty } : p));
                }
            }
            return { ...item, qty: item.qty - retQty, total: (item.qty - retQty) * item.price };
        }).filter(item => item.qty > 0);

        const newSaleTotal = returnSaleData.total - totalRefund;
        await db.from('sales').update({ items: updatedItems, total: newSaleTotal }).eq('id', returnSaleData.id);
        setSales(prev => prev.map(s => s.id === returnSaleData.id ? { ...s, items: updatedItems, total: newSaleTotal } : s));
        logActivity(user, 'Process Return', `Trans #${returnSaleData.id}. Refund: ₱${totalRefund.toFixed(2)}`);
        addNotification(`Return processed. Refund: ₱${totalRefund.toFixed(2)}`);
        setReturnSaleData(null);
    };

    const handleCameraScan = (text) => { setIsScannerOpen(false); processScanOrSearch(text); };

    return (
        <div className="flex flex-col h-full gap-4 relative">
            <div className="flex gap-2 border-b border-cyan-200 pb-2 overflow-x-auto shrink-0">
                <button onClick={() => setViewMode('sale')} className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${viewMode === 'sale' ? 'bg-cyan-500 text-white' : 'bg-white text-slate-600 hover:bg-cyan-50'}`}>New Sale</button>
                <button onClick={() => setViewMode('history')} className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${viewMode === 'history' ? 'bg-cyan-500 text-white' : 'bg-white text-slate-600 hover:bg-cyan-50'}`}>Sales History</button>
            </div>

            {viewMode === 'sale' ? (
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full min-h-0 overflow-y-auto lg:overflow-hidden pb-4">
                    <div className="flex-1 bg-cyan-50 rounded-xl shadow-sm border border-cyan-200 p-4 sm:p-6 flex flex-col min-h-[400px] lg:min-h-0 lg:h-full overflow-hidden shrink-0 lg:shrink">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-700"><Icon name="ScanLine" className="w-5 h-5" /> Point of Sale</h3>
                        <form onSubmit={e => { e.preventDefault(); processScanOrSearch(search); }} className="flex flex-col sm:flex-row gap-2 mb-6 shrink-0">
                            <div className="flex flex-1 gap-2">
                                <button type="button" onClick={() => setIsScannerOpen(true)} className="bg-cyan-100 px-4 py-3 rounded-lg border border-cyan-200 hover:bg-cyan-200 transition-colors"><Icon name="QrCode" className="w-5 h-5 text-cyan-700" /></button>
                                <input type="text" autoFocus placeholder="Scan Barcode or Search by Name..." className="flex-1 p-3 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none bg-white w-full" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <button type="submit" className="bg-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-cyan-600 shrink-0">Search</button>
                        </form>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-2 pb-4 flex-1 content-start">
                            {products.filter(p => p.quantity > 0).map(p => (
                                <button type="button" key={p.id} onClick={() => addToCart(p)} className="text-left border border-slate-200 p-3 rounded-lg cursor-pointer hover:border-cyan-400 hover:shadow-md transition-all bg-white flex flex-col active:scale-95">
                                    <p className="font-semibold text-slate-800 text-sm line-clamp-1">{p.name}</p>
                                    <p className="text-xs text-slate-500 mb-2 line-clamp-1">{p.genericName}</p>
                                    <div className="flex justify-between items-center mt-auto w-full">
                                        <span className="font-bold text-cyan-600">₱{Number(p.price).toFixed(2)}</span>
                                        <span className="text-xs bg-cyan-50 px-2 py-1 rounded text-cyan-700">Qty: {p.quantity}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px] bg-white rounded-xl shadow-sm border border-cyan-200 flex flex-col min-h-[450px] lg:min-h-0 lg:h-full overflow-hidden shrink-0 mt-4 lg:mt-0">
                        <div className="p-4 bg-cyan-500 border-b shrink-0"><h3 className="font-bold text-white flex items-center gap-2"><Icon name="ShoppingCart" className="w-5 h-5" /> Current Order</h3></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px]">
                            {cart.length === 0 && <p className="text-center text-slate-400 mt-10">Cart is empty</p>}
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                    <div className="flex-1 pr-2">
                                        <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <button type="button" onClick={() => updateCartQty(item.id, -1)} className="px-2 py-0.5 bg-slate-200 rounded text-slate-700 hover:bg-slate-300">-</button>
                                            <span className="text-xs font-medium w-4 text-center">{item.cartQty}</span>
                                            <button type="button" onClick={() => updateCartQty(item.id, 1)} className="px-2 py-0.5 bg-slate-200 rounded text-slate-700 hover:bg-slate-300">+</button>
                                            <span className="text-xs text-slate-500 ml-2">@ ₱{item.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="font-bold text-sm">₱{item.total.toFixed(2)}</span>
                                        <button onClick={() => updateCartQty(item.id, -999)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Icon name="XCircle" className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-cyan-50 border-t space-y-4 shrink-0">
                            <div className="flex justify-between items-center text-lg font-bold text-slate-800">
                                <span>Total Due:</span><span className="text-cyan-600">₱{totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-cyan-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-600">Cash Tendered:</span>
                                    <div className="relative w-32">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₱</span>
                                        <input type="number" min={0} step="0.01" value={cashTendered} onChange={e => setCashTendered(e.target.value)} className="w-full pl-7 pr-3 py-1.5 border border-cyan-200 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 text-right font-medium" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-600">Change:</span>
                                    <span className={`text-lg font-bold ${changeAmount > 0 ? 'text-cyan-600' : 'text-slate-400'}`}>₱{changeAmount.toFixed(2)}</span>
                                </div>
                                {cart.length > 0 && parseFloat(cashTendered || 0) < totalAmount && (<p className="text-xs text-red-500 font-medium">Insufficient cash entered.</p>)}
                                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                                    <button type="button" onClick={() => setCashTendered(totalAmount.toFixed(2))} className="px-2 py-1 bg-cyan-50 rounded text-xs font-medium hover:bg-cyan-100 text-cyan-700">Exact</button>
                                    <button type="button" onClick={() => setCashTendered((100).toFixed(2))} className="px-2 py-1 bg-cyan-50 rounded text-xs font-medium hover:bg-cyan-100 text-cyan-700">₱100</button>
                                    <button type="button" onClick={() => setCashTendered((500).toFixed(2))} className="px-2 py-1 bg-cyan-50 rounded text-xs font-medium hover:bg-cyan-100 text-cyan-700">₱500</button>
                                    <button type="button" onClick={() => setCashTendered((1000).toFixed(2))} className="px-2 py-1 bg-cyan-50 rounded text-xs font-medium hover:bg-cyan-100 text-cyan-700">₱1000</button>
                                </div>
                            </div>
                            <button onClick={handleCheckout} disabled={cart.length === 0 || isNaN(parseFloat(cashTendered)) || parseFloat(cashTendered) < totalAmount} className="w-full bg-cyan-500 disabled:bg-slate-300 text-white py-3 rounded-lg font-bold text-lg hover:bg-cyan-600 transition-colors flex justify-center items-center gap-2">
                                <Icon name="Receipt" className="w-5 h-5" /> Process Payment
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full">
                    <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div><h3 className="text-lg font-bold text-slate-800">Sales History</h3><p className="text-sm text-slate-500">View and reprint past transactions.</p></div>
                        <div className="flex flex-wrap gap-2">
                            <select value={historyYear} onChange={e => setHistoryYear(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-emerald-500 outline-none text-sm bg-white">
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-emerald-500 outline-none text-sm bg-white">
                                <option value="All">All Months</option>
                                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <button onClick={() => setShowSummary(true)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium border border-emerald-200 text-sm">
                                <Icon name="FileBarChart" className="w-4 h-4" /> Summary Sales
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-slate-50 sticky top-0 border-b">
                                <tr>
                                    <th className="p-4 font-medium text-slate-600">ID</th>
                                    <th className="p-4 font-medium text-slate-600">Date & Time</th>
                                    <th className="p-4 font-medium text-slate-600">Cashier</th>
                                    <th className="p-4 font-medium text-slate-600">Items</th>
                                    <th className="p-4 font-medium text-slate-600">Total</th>
                                    <th className="p-4 font-medium text-slate-600 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.length === 0 && (<tr><td colSpan="6" className="p-8 text-center text-slate-400">No transactions found.</td></tr>)}
                                {filteredHistory.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-800">#{sale.id}</td>
                                        <td className="p-4 text-slate-600 text-sm">{new Date(sale.date).toLocaleString()}</td>
                                        <td className="p-4 text-slate-600 text-sm capitalize">{sale.cashier || 'System'}</td>
                                        <td className="p-4 text-slate-600 text-xs max-w-[200px] truncate">
                                            {(sale.items || []).map(i => `${i.name} (x${i.qty})`).join(', ')}
                                        </td>
                                        <td className="p-4 font-bold text-emerald-600">₱{Number(sale.total).toFixed(2)}</td>
                                        <td className="p-4 flex justify-center gap-2">
                                            <button onClick={() => setReceiptData(sale)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded flex items-center gap-1 font-medium border border-slate-200">
                                                <Icon name="Receipt" className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => openReturnModal(sale)}
                                                disabled={(sale.items || []).length === 0 || ((sale.items || []).length === 1 && sale.items[0].name === 'Monthly Aggregate Data')}
                                                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded flex items-center gap-1 font-medium border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                                <Icon name="CornerUpLeft" className="w-3 h-3" /> Return
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {returnSaleData && (
                <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icon name="CornerUpLeft" className="w-5 h-5 text-red-600" /> Return Items</h3>
                            <button onClick={() => setReturnSaleData(null)} className="text-slate-400 hover:text-slate-600"><Icon name="XCircle" className="w-6 h-6" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            <p className="text-sm text-slate-500 mb-4">Select the quantity to return for Transaction #{returnSaleData.id}.</p>
                            {(returnSaleData.items || []).map(item => {
                                const itemId = item.id || item.name;
                                return (
                                    <div key={itemId} className="flex justify-between items-center border-b border-slate-100 py-3">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm text-slate-800">{item.name}</p>
                                            <p className="text-xs text-slate-500">Purchased: {item.qty} @ ₱{Number(item.price).toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-slate-500">Return Qty:</label>
                                            <input type="number" min="0" max={item.qty} value={returnQtys[itemId] || 0}
                                                onChange={(e) => handleReturnQtyChange(itemId, e.target.value, item.qty)}
                                                className="w-16 p-1 border border-slate-300 rounded text-center text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex justify-between font-bold text-slate-800">
                                    <span>Total Refund:</span>
                                    <span className="text-red-600">₱{
                                        (returnSaleData.items || []).reduce((sum, item) => sum + ((returnQtys[item.id || item.name] || 0) * item.price), 0).toFixed(2)
                                    }</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex gap-3">
                            <button onClick={() => setReturnSaleData(null)} className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100">Cancel</button>
                            <button onClick={processReturn}
                                disabled={(returnSaleData.items || []).reduce((sum, item) => sum + (returnQtys[item.id || item.name] || 0), 0) === 0}
                                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 flex justify-center items-center gap-2">
                                Confirm Return
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isScannerOpen && <BarcodeScannerModal onClose={() => setIsScannerOpen(false)} onScan={handleCameraScan} />}

            {/* Receipt Modal */}
            {receiptData && (
                <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm print:bg-white print:p-0">
                    <div id="printable-receipt" className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col print:shadow-none print:w-full print:max-w-none">
                        <div className="bg-slate-100 p-4 border-b flex justify-between items-center print:hidden">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Icon name="Receipt" className="w-5 h-5" /> Transaction Receipt</h3>
                            <button onClick={() => setReceiptData(null)} className="text-slate-400 hover:text-slate-600"><Icon name="XCircle" className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 bg-white text-slate-800 text-sm font-mono flex-1 overflow-y-auto">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold uppercase tracking-widest mb-1">JEWEL'S PHARMACY</h2>
                                <p className="text-xs text-slate-500">Brgy 07, Dolores Eastern Samar</p>
                                <div className="mt-4 border-b border-dashed border-slate-300 pb-4"><p className="font-semibold mt-2">OFFICIAL RECEIPT</p></div>
                            </div>
                            <div className="space-y-1 mb-4 text-xs">
                                <div className="flex justify-between"><span>Trans ID:</span> <span>#{receiptData.id}</span></div>
                                <div className="flex justify-between"><span>Date:</span> <span>{new Date(receiptData.date).toLocaleDateString()}</span></div>
                                <div className="flex justify-between"><span>Time:</span> <span>{new Date(receiptData.date).toLocaleTimeString()}</span></div>
                                <div className="flex justify-between"><span>Cashier:</span> <span className="capitalize">{receiptData.cashier || 'System'}</span></div>
                            </div>
                            <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4">
                                <table className="w-full text-xs">
                                    <thead><tr className="text-left text-slate-500"><th className="pb-2 font-normal">Item</th><th className="pb-2 font-normal text-right">Qty</th><th className="pb-2 font-normal text-right">Amount</th></tr></thead>
                                    <tbody>
                                        {(receiptData.items || []).map((item, idx) => (
                                            <tr key={idx}><td className="py-1 pr-2">{item.name}</td><td className="py-1 text-right">{item.qty}</td><td className="py-1 text-right">₱{Number(item.total).toFixed(2)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between font-bold text-sm"><span>Total Due:</span><span>₱{Number(receiptData.total).toFixed(2)}</span></div>
                                <div className="flex justify-between text-slate-600 pt-2 border-t border-dashed border-slate-300 mt-2"><span>Cash Tendered:</span><span>₱{Number(receiptData.cash || receiptData.total).toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold"><span>Change:</span><span>₱{Number(receiptData.change || 0).toFixed(2)}</span></div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex gap-3 print:hidden shrink-0">
                            <button onClick={() => setReceiptData(null)} className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium">Close</button>
                            <button onClick={() => window.print()} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium flex justify-center items-center gap-2"><Icon name="Printer" className="w-4 h-4" /> Print</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Modal */}
            {showSummary && (
                <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm print:bg-white print:p-0">
                    <div id="printable-summary" className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col print:shadow-none print:w-full print:max-w-none max-h-[90vh]">
                        <div className="bg-slate-100 p-4 border-b flex justify-between items-center print:hidden">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Icon name="FileBarChart" className="w-5 h-5" /> Sales Summary</h3>
                            <button onClick={() => setShowSummary(false)} className="text-slate-400"><Icon name="XCircle" className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 bg-white text-slate-800 text-sm flex-1 overflow-y-auto">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold uppercase tracking-widest mb-1">JEWEL'S PHARMACY</h2>
                                <p className="text-sm font-semibold mt-2">SALES SUMMARY REPORT</p>
                                <p className="text-xs text-slate-500 mt-1">Period: {historyMonth === 'All' ? `All Months of ${historyYear}` : `${months[parseInt(historyMonth)]} ${historyYear}`}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center">
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                                    <p className="text-2xl font-bold text-emerald-800">₱{summaryData.totalRevenue.toFixed(2)}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Medicines Sold</p>
                                    <p className="text-2xl font-bold text-blue-800">{summaryData.totalItems}</p>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-4">
                                <table className="w-full text-xs text-left">
                                    <thead className="border-b border-slate-200"><tr><th className="pb-2 font-medium">Product Name</th><th className="pb-2 font-medium text-right">Qty Sold</th><th className="pb-2 font-medium text-right">Total Sales</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {summaryData.items.map((item, idx) => (
                                            <tr key={idx}><td className="py-2 pr-2 font-medium">{item.name}</td><td className="py-2 text-right">{item.qty}</td><td className="py-2 text-right font-medium text-emerald-600">₱{item.total.toFixed(2)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex gap-3 print:hidden shrink-0">
                            <button onClick={() => setShowSummary(false)} className="flex-1 py-2 rounded-lg border border-slate-300">Close</button>
                            <button onClick={() => window.print()} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white flex justify-center items-center gap-2"><Icon name="Printer" className="w-4 h-4" /> Print</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
