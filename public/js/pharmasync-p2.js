// Part 2: DashboardView, WidgetCard, ProductsView

// ==========================================
// DASHBOARD VIEW
// ==========================================
function DashboardView({ products, sales, notifications }) {
    const [detailModal, setDetailModal] = useState(null);

    const today = new Date().toISOString().split('T')[0];
    const todaySalesList = sales.filter(s => s.date && s.date.startsWith(today));
    const todaySales = todaySalesList.reduce((sum, s) => sum + Number(s.total), 0);
    const lowStockList = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock);
    const outOfStockList = products.filter(p => p.quantity === 0);
    const currentYear = new Date().getFullYear();

    const salesData = months.map((m, i) => {
        const monthSales = sales
            .filter(s => { const d = new Date(s.date); return d.getMonth() === i && d.getFullYear() === currentYear; })
            .reduce((sum, s) => sum + Number(s.total), 0);
        return { name: m, sales: monthSales };
    });

    const renderDetailModal = () => {
        if (!detailModal) return null;
        let title = ''; let data = []; let columns = [];
        if (detailModal === 'today-sales') {
            title = "Today's Sales Transactions"; data = todaySalesList;
            columns = [
                { header: 'Trans. ID', render: (row) => row.id },
                { header: 'Time', render: (row) => new Date(row.date).toLocaleTimeString() },
                { header: 'Total', render: (row) => `₱${Number(row.total).toFixed(2)}` },
            ];
        } else if (detailModal === 'total-products') {
            title = "All Products"; data = products;
            columns = [
                { header: 'Name', render: (row) => row.name },
                { header: 'Stock', render: (row) => <span className={row.quantity === 0 ? 'text-red-500 font-bold' : row.quantity <= row.minStock ? 'text-amber-500 font-bold' : 'text-emerald-600 font-bold'}>{row.quantity}</span> },
                { header: 'Price', render: (row) => `₱${Number(row.price).toFixed(2)}` },
            ];
        } else if (detailModal === 'low-stock') {
            title = "Low Stock Alerts"; data = lowStockList;
            columns = [
                { header: 'Name', render: (row) => row.name },
                { header: 'Stock', render: (row) => <span className="text-amber-500 font-bold">{row.quantity}</span> },
                { header: 'Min', render: (row) => row.minStock },
            ];
        } else if (detailModal === 'out-of-stock') {
            title = "Out of Stock Products"; data = outOfStockList;
            columns = [
                { header: 'Name', render: (row) => row.name },
                { header: 'Category', render: (row) => row.category },
                { header: 'Price', render: (row) => `₱${Number(row.price).toFixed(2)}` },
            ];
        }
        const isTodaySales = detailModal === 'today-sales';
        const isTotalProducts = detailModal === 'total-products';
        const isLowStock = detailModal === 'low-stock';
        const isOutOfStock = detailModal === 'out-of-stock';
        const headerBg = isTodaySales ? 'bg-blue-600' : isTotalProducts ? 'bg-emerald-600' : isLowStock ? 'bg-amber-500' : isOutOfStock ? 'bg-red-600' : 'bg-slate-50';
        const headerText = (isTodaySales || isTotalProducts || isLowStock || isOutOfStock) ? 'text-white' : 'text-slate-800';
        const headerBtn = isTodaySales ? 'text-blue-200 hover:text-white' : isTotalProducts ? 'text-emerald-200 hover:text-white' : isLowStock ? 'text-amber-100 hover:text-white' : isOutOfStock ? 'text-red-200 hover:text-white' : 'text-slate-400 hover:text-slate-600';
        const theadBg = isTodaySales ? 'bg-blue-50' : isTotalProducts ? 'bg-emerald-50' : isLowStock ? 'bg-amber-50' : isOutOfStock ? 'bg-red-50' : 'bg-slate-50';
        const theadText = isTodaySales ? 'text-blue-700' : isTotalProducts ? 'text-emerald-700' : isLowStock ? 'text-amber-700' : isOutOfStock ? 'text-red-700' : 'text-slate-600';
        const rowHover = isTodaySales ? 'hover:bg-blue-50' : isTotalProducts ? 'hover:bg-emerald-50' : isLowStock ? 'hover:bg-amber-50' : isOutOfStock ? 'hover:bg-red-50' : 'hover:bg-slate-50';
        return (
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
                    <div className={`p-4 border-b flex justify-between items-center ${headerBg}`}>
                        <h3 className={`font-bold text-lg ${headerText}`}>{title}</h3>
                        <button onClick={() => setDetailModal(null)} className={headerBtn}><Icon name="XCircle" className="w-6 h-6" /></button>
                    </div>
                    <div className="p-0 flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className={`sticky top-0 border-b z-10 ${theadBg}`}>
                                <tr>{columns.map((col, idx) => <th key={idx} className={`p-3 font-medium whitespace-nowrap ${theadText}`}>{col.header}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.length === 0 ? (<tr><td colSpan={columns.length} className="p-6 text-center text-slate-400">No records found.</td></tr>) : (
                                    data.map((row, idx) => (<tr key={idx} className={rowHover}>{columns.map((col, colIdx) => <td key={colIdx} className="p-3 text-slate-700">{col.render(row)}</td>)}</tr>))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <WidgetCard title="Today's Sales" value={`₱${todaySales.toFixed(2)}`} icon="ShoppingCart" color="bg-blue-500" fullBlue={true} onClick={() => setDetailModal('today-sales')} />
                <WidgetCard title="Total Products" value={products.length} icon="Package" color="bg-emerald-500" fullGreen={true} onClick={() => setDetailModal('total-products')} />
                <WidgetCard title="Low Stock" value={lowStockList.length} icon="AlertTriangle" color="bg-amber-500" fullAmber={true} onClick={() => setDetailModal('low-stock')} />
                <WidgetCard title="Out of Stock" value={outOfStockList.length} icon="XCircle" color="bg-red-500" fullRed={true} onClick={() => setDetailModal('out-of-stock')} />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Sales Overview (This Year)</h3>
                    <div className="h-64 sm:h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData} margin={{ left: -20, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v}`} style={{ fontSize: '12px' }} />
                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="rounded-xl shadow-sm border border-violet-200 h-48 overflow-hidden flex flex-col">
                        <div className="bg-violet-600 px-5 py-3 shrink-0">
                            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 bg-violet-50 p-4">
                            {notifications.length === 0 && <p className="text-violet-400 text-sm">No recent activity.</p>}
                            {notifications.map((n, idx) => (
                                <div key={`${n.id}-${idx}`} className="text-sm border-l-2 border-violet-500 pl-3 py-1">
                                    <p className="text-slate-700">{n.msg}</p>
                                    <span className="text-xs text-violet-400">{n.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {renderDetailModal()}
        </div>
    );
}

function WidgetCard({ title, value, icon, color, onClick, fullBlue, fullGreen, fullAmber, fullRed }) {
    const [clicked, setClicked] = useState(false);
    const ringColor = color.includes('blue') ? 'ring-blue-400' : color.includes('emerald') ? 'ring-emerald-400' : color.includes('amber') ? 'ring-amber-400' : 'ring-red-400';

    const handleClick = () => {
        setClicked(true);
        setTimeout(() => setClicked(false), 350);
        if (onClick) onClick();
    };

    if (fullRed) {
        return (
            <div onClick={handleClick}
                className={`bg-red-600 p-4 sm:p-6 rounded-xl shadow-sm border border-red-500 flex items-center gap-4 cursor-pointer
                    hover:shadow-lg hover:bg-red-700 transition-all duration-150 select-none
                    ${clicked ? 'scale-95 ring-4 ring-offset-2 ring-red-400 shadow-lg' : 'scale-100'}`}>
                <div className={`bg-red-500 p-3 sm:p-4 rounded-lg text-white shadow-md transition-transform duration-150 ${clicked ? 'scale-110' : ''}`}>
                    <Icon name={icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-red-100">{title}</p>
                    <p className={`text-xl sm:text-2xl font-bold text-white transition-all duration-150 ${clicked ? 'scale-110 origin-left' : ''}`}>{value}</p>
                </div>
            </div>
        );
    }

    if (fullAmber) {
        return (
            <div onClick={handleClick}
                className={`bg-amber-500 p-4 sm:p-6 rounded-xl shadow-sm border border-amber-400 flex items-center gap-4 cursor-pointer
                    hover:shadow-lg hover:bg-amber-600 transition-all duration-150 select-none
                    ${clicked ? 'scale-95 ring-4 ring-offset-2 ring-amber-300 shadow-lg' : 'scale-100'}`}>
                <div className={`bg-amber-400 p-3 sm:p-4 rounded-lg text-white shadow-md transition-transform duration-150 ${clicked ? 'scale-110' : ''}`}>
                    <Icon name={icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-amber-100">{title}</p>
                    <p className={`text-xl sm:text-2xl font-bold text-white transition-all duration-150 ${clicked ? 'scale-110 origin-left' : ''}`}>{value}</p>
                </div>
            </div>
        );
    }

    if (fullGreen) {
        return (
            <div onClick={handleClick}
                className={`bg-emerald-600 p-4 sm:p-6 rounded-xl shadow-sm border border-emerald-500 flex items-center gap-4 cursor-pointer
                    hover:shadow-lg hover:bg-emerald-700 transition-all duration-150 select-none
                    ${clicked ? 'scale-95 ring-4 ring-offset-2 ring-emerald-400 shadow-lg' : 'scale-100'}`}>
                <div className={`bg-emerald-500 p-3 sm:p-4 rounded-lg text-white shadow-md transition-transform duration-150 ${clicked ? 'scale-110' : ''}`}>
                    <Icon name={icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-emerald-100">{title}</p>
                    <p className={`text-xl sm:text-2xl font-bold text-white transition-all duration-150 ${clicked ? 'scale-110 origin-left' : ''}`}>{value}</p>
                </div>
            </div>
        );
    }

    if (fullBlue) {
        return (
            <div onClick={handleClick}
                className={`bg-blue-600 p-4 sm:p-6 rounded-xl shadow-sm border border-blue-500 flex items-center gap-4 cursor-pointer
                    hover:shadow-lg hover:bg-blue-700 transition-all duration-150 select-none
                    ${clicked ? `scale-95 ring-4 ring-offset-2 ring-blue-400 shadow-lg` : 'scale-100'}`}>
                <div className={`bg-blue-500 p-3 sm:p-4 rounded-lg text-white shadow-md transition-transform duration-150 ${clicked ? 'scale-110' : ''}`}>
                    <Icon name={icon} className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-blue-100">{title}</p>
                    <p className={`text-xl sm:text-2xl font-bold text-white transition-all duration-150 ${clicked ? 'scale-110 origin-left' : ''}`}>{value}</p>
                </div>
            </div>
        );
    }

    return (
        <div onClick={handleClick}
            className={`bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer
                hover:shadow-lg hover:border-slate-200 transition-all duration-150 select-none
                ${clicked ? `scale-95 ring-4 ring-offset-2 ${ringColor} shadow-lg` : 'scale-100'}`}>
            <div className={`${color} p-3 sm:p-4 rounded-lg text-white shadow-md transition-transform duration-150 ${clicked ? 'scale-110' : ''}`}>
                <Icon name={icon} className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">{title}</p>
                <p className={`text-xl sm:text-2xl font-bold text-slate-800 transition-all duration-150 ${clicked ? 'scale-110 origin-left' : ''}`}>{value}</p>
            </div>
        </div>
    );
}

// ==========================================
// PRODUCTS VIEW
// ==========================================
function ProductsView({ products, setProducts, suppliers, user, logActivity, addNotification, db }) {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIScannerOpen, setIsAIScannerOpen] = useState(false);
    const [editingProd, setEditingProd] = useState(null);
    const initialForm = { name: '', genericName: '', brand: '', dosage: '', category: 'Analgesic', price: '', quantity: '', minStock: '', expirationDate: '', supplierId: '', barcode: '' };
    const [form, setForm] = useState(initialForm);

    const filtered = products.filter(p =>
        (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.genericName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode || '').includes(search)
    );

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = {
            name: form.name, genericName: form.genericName, brand: form.brand, dosage: form.dosage, category: form.category,
            price: parseFloat(form.price), quantity: parseInt(form.quantity), minStock: parseInt(form.minStock),
            expirationDate: form.expirationDate, supplierId: parseInt(form.supplierId) || null, barcode: form.barcode,
            history: editingProd ? editingProd.history : mockHistory(100)
        };
        if (editingProd) {
            const { data } = await db.from('products').update(payload).eq('id', editingProd.id).select();
            if (data) setProducts(prev => prev.map(p => p.id === editingProd.id ? data[0] : p));
            logActivity(user, 'Edit Product', `Updated product: ${payload.name}`);
            if (addNotification) addNotification(`✏️ Product updated: ${payload.name}`, 'info');
        } else {
            const { data } = await db.from('products').insert([payload]).select();
            if (data) setProducts(prev => [...prev, data[0]]);
            logActivity(user, 'Add Product', `Added new product: ${payload.name}`);
            if (addNotification) addNotification(`✅ Product added: ${payload.name}`, 'success');
        }
        closeModal();
    };

    const handleEdit = (p) => { setEditingProd(p); setForm({ ...p, supplierId: p.supplierId || '', dosage: p.dosage || '' }); setIsModalOpen(true); };
    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            const prodToDelete = products.find(p => p.id === id);
            await db.from('products').delete().eq('id', id);
            setProducts(prev => prev.filter(p => p.id !== id));
            if (prodToDelete) {
                logActivity(user, 'Delete Product', `Deleted product: ${prodToDelete.name}`);
                if (addNotification) addNotification(`🗑️ Product deleted: ${prodToDelete.name}`, 'error');
            }
        }
    };

    const handleAIScanSuccess = (extractedData) => {
        setIsAIScannerOpen(false);
        setForm({ ...initialForm, name: extractedData.name || '', genericName: extractedData.genericName || '', brand: extractedData.brand || '', dosage: extractedData.dosage || '', category: extractedData.category || 'Analgesic', expirationDate: extractedData.expirationDate || '', barcode: extractedData.barcode || '' });
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingProd(null); setForm(initialForm); };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
                <div className="relative w-full sm:w-72">
                    <Icon name="Search" className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Search products or barcode..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsAIScannerOpen(true)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-2 rounded-lg flex items-center gap-2 font-medium border border-emerald-200"><Icon name="Camera" className="w-4 h-4" /> AI Label Scan</button>
                    <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium">
                        <Icon name="Plus" className="w-4 h-4" /> Add Product
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto border rounded-lg">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50 sticky top-0 border-b z-10">
                        <tr>
                            <th className="p-3 font-medium text-slate-600">Barcode</th>
                            <th className="p-3 font-medium text-slate-600">Name</th>
                            <th className="p-3 font-medium text-slate-600">Category</th>
                            <th className="p-3 font-medium text-slate-600">Price</th>
                            <th className="p-3 font-medium text-slate-600">Qty</th>
                            <th className="p-3 font-medium text-slate-600">Expiry</th>
                            <th className="p-3 font-medium text-slate-600 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors text-sm">
                                <td className="p-3 text-slate-500">{p.barcode}</td>
                                <td className="p-3"><p className="font-semibold text-slate-800">{p.name}</p><p className="text-xs text-slate-500">{p.genericName} • {p.brand}</p></td>
                                <td className="p-3 text-slate-600">{p.category}</td>
                                <td className="p-3 text-slate-800 font-medium">₱{Number(p.price).toFixed(2)}</td>
                                <td className="p-3 text-slate-600">{p.quantity}</td>
                                <td className="p-3 text-slate-600">{p.expirationDate}</td>
                                <td className="p-3 flex justify-center gap-2">
                                    <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Icon name="Edit" className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Icon name="Trash2" className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isAIScannerOpen && <AILabelScannerModal onClose={() => setIsAIScannerOpen(false)} onScan={handleAIScanSuccess} />}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-slate-800">{editingProd ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><Icon name="XCircle" className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm mb-1">Product Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Generic Name</label><input required value={form.genericName} onChange={e => setForm({ ...form, genericName: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Brand</label><input required value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Dosage <span className="text-slate-400 text-xs font-normal">(e.g. 500mg, 10ml)</span></label><input value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} className="w-full p-2 border rounded" placeholder="e.g. 500mg" /></div>
                            <div>
                                <label className="block text-sm mb-1">Category</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full p-2 border rounded bg-white">
                                    <option>Analgesic</option><option>Antibiotic</option><option>Antihistamine</option>
                                    <option>Antihypertensive</option><option>Antidiabetic</option><option>Vitamins</option>
                                </select>
                            </div>
                            <div><label className="block text-sm mb-1">Price (₱)</label><input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Quantity</label><input required type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Min. Stock Level</label><input required type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Expiration Date</label><input required type="date" value={form.expirationDate} onChange={e => setForm({ ...form, expirationDate: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Barcode</label><input required value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div>
                                <label className="block text-sm mb-1">Supplier</label>
                                <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} className="w-full p-2 border rounded bg-white">
                                    <option value="">-- Select Supplier --</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="sm:col-span-2 flex justify-end gap-3 mt-2 pt-4 border-t">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
