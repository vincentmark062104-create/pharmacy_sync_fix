// Part 4: InventoryView, ForecastView, SuppliersView, ReportsView, UserManagementView, ActivityLogsView + ReactDOM

// ==========================================
// INVENTORY VIEW
// ==========================================
function InventoryView({ products }) {
    const getStatus = (qty, min) => {
        if (qty <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' };
        if (qty <= min) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' };
        return { label: 'Normal', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' };
    };
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-slate-800">Inventory Status</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Normal</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Low</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Out of Stock</span>
                </div>
            </div>
            <div className="flex-1 overflow-auto border rounded-lg">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-slate-50 sticky top-0 border-b">
                        <tr><th className="p-4 font-medium text-slate-600">Product</th><th className="p-4 font-medium text-slate-600">Current Stock</th><th className="p-4 font-medium text-slate-600">Min. Level</th><th className="p-4 font-medium text-slate-600">Expiry Date</th><th className="p-4 font-medium text-slate-600">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map(p => {
                            const status = getStatus(p.quantity, p.minStock);
                            return (
                                <tr key={p.id} className="hover:bg-slate-50 text-sm">
                                    <td className="p-4 font-medium text-slate-800">{p.name} <span className="text-xs font-normal text-slate-500 ml-2">({p.genericName})</span></td>
                                    <td className="p-4 font-bold">{p.quantity}</td>
                                    <td className="p-4 text-slate-500">{p.minStock}</td>
                                    <td className="p-4 text-slate-600">{p.expirationDate}</td>
                                    <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-max ${status.color}`}><div className={`w-2 h-2 rounded-full ${status.dot}`}></div>{status.label}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
// FORECAST VIEW
// ==========================================
function ForecastView({ products }) {
    const currentYear = new Date().getFullYear();
    const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
    const [period, setPeriod] = useState(3);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));

    const chartData = useMemo(() => {
        if (!selectedProduct || !selectedProduct.history) return [];
        const hist = Array.isArray(selectedProduct.history) ? selectedProduct.history : [];
        const yearDiff = selectedYear - currentYear;
        const yearData = hist.map(val => Math.max(0, Math.floor(val * (1 + yearDiff * 0.12))));
        const data = [];
        for (let i = 0; i < 12; i++) {
            let sma = null;
            if (i >= period) {
                let sum = 0; for (let j = 1; j <= period; j++) sum += yearData[i - j];
                sma = Math.round(sum / period);
            }
            data.push({ month: months[i], Actual: yearData[i] || 0, Forecast: sma });
        }
        let sumNext = 0;
        for (let j = 0; j < period; j++) sumNext += yearData[11 - j] || 0;
        data.push({ month: 'Next (Jan)', Actual: null, Forecast: Math.round(sumNext / period) });
        return data;
    }, [selectedProductId, period, selectedYear, selectedProduct]);

    const nextMonthPrediction = chartData.length > 0 ? chartData[chartData.length - 1].Forecast : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div><h3 className="text-xl font-bold text-slate-800">Demand Forecasting (SMA)</h3><p className="text-sm text-slate-500">Simple Moving Average based on historical monthly sales.</p></div>
                <div className="flex flex-wrap gap-3">
                    <select className="p-2 border rounded-lg focus:ring-emerald-500 outline-none bg-slate-50 text-sm" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="p-2 border rounded-lg focus:ring-emerald-500 outline-none bg-slate-50 text-sm" value={period} onChange={e => setPeriod(parseInt(e.target.value))}>
                        <option value={3}>3-Month Average</option><option value={6}>6-Month Average</option>
                    </select>
                    <select className="p-2 border rounded-lg focus:ring-emerald-500 outline-none bg-slate-50 font-medium text-sm" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                        {[currentYear - 2, currentYear - 1, currentYear].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex items-center justify-between shrink-0">
                    <div><p className="text-sm font-medium text-emerald-800 mb-1">Predicted Demand for Jan {selectedYear + 1}</p><p className="text-3xl font-bold text-emerald-600">{nextMonthPrediction} units</p></div>
                    <Icon name="TrendingUp" className="w-12 h-12 text-emerald-200" />
                </div>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '12px' }} />
                            <YAxis tickLine={false} axisLine={false} style={{ fontSize: '12px' }} />
                            <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <Legend iconType="circle" />
                            <Line type="monotone" dataKey="Actual" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="Forecast" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// SUPPLIERS VIEW
// ==========================================
function SuppliersView({ suppliers, setSuppliers, user, logActivity, db }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ name: '', contact: '', address: '', email: '' });

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { name: form.name, contact: form.contact, address: form.address, email: form.email, productsSupplied: 0 };
        const { data } = await db.from('suppliers').insert([payload]).select();
        if (data) setSuppliers(prev => [...prev, data[0]]);
        logActivity(user, 'Add Supplier', `Added supplier: ${form.name}`);
        setIsModalOpen(false); setForm({ name: '', contact: '', address: '', email: '' });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-slate-800">Supplier Directory</h3>
                <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"><Icon name="Plus" className="w-4 h-4" /> Add Supplier</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-y-auto pb-4">
                {suppliers.map(s => (
                    <div key={s.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-slate-50">
                        <h4 className="font-bold text-lg text-slate-800 mb-2">{s.name}</h4>
                        <div className="text-sm text-slate-600 space-y-2">
                            <p><span className="font-medium text-slate-700">Contact:</span> {s.contact}</p>
                            <p><span className="font-medium text-slate-700">Email:</span> {s.email}</p>
                            <p><span className="font-medium text-slate-700">Address:</span> {s.address}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t"><span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">{s.productsSupplied} Products Supplied</span></div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800">Add Supplier</h3><button onClick={() => setIsModalOpen(false)}><Icon name="XCircle" className="w-6 h-6 text-slate-400" /></button></div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div><label className="block text-sm mb-1">Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Contact No.</label><input required value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-sm mb-1">Address</label><input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded mt-2">Save Supplier</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// REPORTS VIEW
// ==========================================
function ReportsView({ products, sales, suppliers }) {
    const handleExport = (type) => {
        switch (type) {
            case 'inventory': exportToCSV(products.map(p => ({ ID: p.id, Name: p.name, Qty: p.quantity, Price: p.price, Expiry: p.expirationDate })), 'Inventory_Report'); break;
            case 'sales': exportToCSV(sales.map(s => ({ ID: s.id, Date: s.date, Total: s.total, Items: (s.items || []).length })), 'Sales_Report'); break;
            case 'expiry': exportToCSV(products.filter(p => new Date(p.expirationDate).getFullYear() <= 2026).map(p => ({ Name: p.name, Expiry: p.expirationDate, Qty: p.quantity })), 'Expiration_Report'); break;
            default: alert("Report downloaded successfully!");
        }
    };
    const reportsList = [
        { id: 'inventory', title: 'Full Inventory Report', desc: 'Complete list of products, stock levels, and pricing.', icon: 'ClipboardList' },
        { id: 'sales', title: 'Sales Transactions', desc: 'Historical data of all point-of-sale transactions.', icon: 'FileBarChart' },
        { id: 'expiry', title: 'Expiration Report', desc: 'List of medicines expiring within current year.', icon: 'AlertTriangle' },
        { id: 'forecast', title: 'Forecast Summary', desc: 'Generated SMA predictions for main products.', icon: 'TrendingUp' },
    ];
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Generate Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {reportsList.map(report => (
                    <div key={report.id} className="border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:border-emerald-300 transition-colors bg-slate-50">
                        <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 shrink-0"><Icon name={report.icon} className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{report.title}</h4>
                            <p className="text-sm text-slate-500 mb-4 mt-1">{report.desc}</p>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleExport(report.id)} className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700"><Icon name="Download" className="w-3 h-3" /> CSV</button>
                                <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs border border-slate-300 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-100"><Icon name="Printer" className="w-3 h-3" /> Print PDF</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==========================================
// USER MANAGEMENT VIEW
// ==========================================
function UserManagementView({ accounts, setAccounts, user, logActivity, db }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', role: 'Pharmacist' });

    const handleSave = async (e) => {
        e.preventDefault();
        if (accounts.some(a => a.username === form.username && (!editingAccount || a.id !== editingAccount.id))) {
            return alert('Username already exists!');
        }
        const payload = { username: form.username, password: form.password, role: form.role };
        if (editingAccount) {
            const { data } = await db.from('accounts').update(payload).eq('id', editingAccount.id).select();
            if (data) setAccounts(prev => prev.map(a => a.id === editingAccount.id ? data[0] : a));
            logActivity(user, 'Edit User', `Updated account for ${form.username}`);
        } else {
            const { data } = await db.from('accounts').insert([payload]).select();
            if (data) setAccounts(prev => [...prev, data[0]]);
            logActivity(user, 'Create User', `Created ${form.role} account for ${form.username}`);
        }
        closeModal();
    };

    const handleEdit = (acc) => { setEditingAccount(acc); setForm({ username: acc.username, password: acc.password, role: acc.role }); setIsModalOpen(true); };
    const handleDelete = async (id, username) => {
        if (username === user.username) return alert("You cannot delete your own account.");
        if (confirm(`Delete account for ${username}?`)) {
            await db.from('accounts').delete().eq('id', id);
            setAccounts(prev => prev.filter(a => a.id !== id));
            logActivity(user, 'Delete User', `Deleted account for ${username}`);
        }
    };
    const closeModal = () => { setIsModalOpen(false); setEditingAccount(null); setForm({ username: '', password: '', role: 'Pharmacist' }); setShowPassword(false); };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div><h3 className="text-xl font-bold text-slate-800">User Management</h3><p className="text-sm text-slate-500">Manage system credentials.</p></div>
                <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Icon name="ShieldCheck" className="w-4 h-4" /> Create Account</button>
            </div>
            <div className="flex-1 overflow-auto border rounded-lg">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-slate-50 sticky top-0 border-b"><tr><th className="p-4">Username</th><th className="p-4">Role</th><th className="p-4 text-center">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {accounts.map(acc => (
                            <tr key={acc.id} className="hover:bg-slate-50 text-sm">
                                <td className="p-4 font-medium text-slate-800">{acc.username} {acc.username === user.username && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-wider">You</span>}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${acc.role === 'Admin' ? 'bg-purple-100 text-purple-700' : acc.role === 'Pharmacist' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{acc.role}</span></td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button onClick={() => handleEdit(acc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Icon name="Edit" className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(acc.id, acc.username)} disabled={acc.username === user.username} className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"><Icon name="Trash2" className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800">{editingAccount ? 'Edit Account' : 'Create Account'}</h3><button onClick={closeModal}><Icon name="XCircle" className="w-6 h-6 text-slate-400" /></button></div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div><label className="block text-sm mb-1">Username</label><input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full p-2 border rounded" /></div>
                            <div>
                                <label className="block text-sm mb-1">Password</label>
                                <div className="relative">
                                    <input required type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full p-2 pr-10 border rounded" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"><Icon name={showPassword ? "EyeSlash" : "Eye"} className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <div><label className="block text-sm mb-1">Role</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full p-2 border rounded bg-white"><option>Pharmacist</option><option>Cashier</option><option>Admin</option></select></div>
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">{editingAccount ? 'Update User' : 'Save User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// ACTIVITY LOGS VIEW
// ==========================================
function ActivityLogsView({ logs }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col h-full">
            <div className="mb-6"><h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Icon name="History" className="w-5 h-5" /> Activity Logs</h3></div>
            <div className="flex-1 overflow-auto border rounded-lg bg-slate-50">
                <table className="w-full text-left border-collapse bg-white min-w-[600px]">
                    <thead className="bg-slate-100 sticky top-0 border-b"><tr><th className="p-4">Timestamp</th><th className="p-4">User</th><th className="p-4">Action</th><th className="p-4">Details</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-400">No activity recorded yet.</td></tr>}
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 text-sm">
                                <td className="p-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="p-4"><span className="font-semibold text-slate-800">{log.username}</span><span className="ml-2 text-[10px] text-slate-400 uppercase tracking-wider">({log.role})</span></td>
                                <td className="p-4"><span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold uppercase tracking-wider">{log.action}</span></td>
                                <td className="p-4 text-slate-600">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
// MOUNT REACT APP
// ==========================================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
