// Part 1: Core utilities, App component, Chatbot, Modals, Login
const { useState, useMemo, useEffect, useRef } = React;
const { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip: RechartsTooltip, Legend, ResponsiveContainer } = window.Recharts;

// ==========================================
// ICON HELPER
// ==========================================
const IconMap = {
    LayoutDashboard: 'ph-squares-four', Package: 'ph-package', ShoppingCart: 'ph-shopping-cart',
    ClipboardList: 'ph-clipboard-text', TrendingUp: 'ph-trend-up', Users: 'ph-users',
    FileBarChart: 'ph-chart-bar', LogOut: 'ph-sign-out', Plus: 'ph-plus', Search: 'ph-magnifying-glass',
    Edit: 'ph-pencil-simple', Trash2: 'ph-trash', Printer: 'ph-printer', Download: 'ph-download-simple',
    AlertTriangle: 'ph-warning', ScanLine: 'ph-barcode', Activity: 'ph-activity', CheckCircle: 'ph-check-circle',
    XCircle: 'ph-x-circle', MessageSquare: 'ph-chat-circle-text', X: 'ph-x', Send: 'ph-paper-plane-right',
    Bot: 'ph-robot', QrCode: 'ph-qr-code', Camera: 'ph-camera', Upload: 'ph-upload-simple',
    UserCog: 'ph-user-gear', History: 'ph-clock-counter-clockwise', ShieldCheck: 'ph-shield-check',
    Receipt: 'ph-receipt', Eye: 'ph-eye', EyeSlash: 'ph-eye-slash',
    List: 'ph-list', CaretLeft: 'ph-caret-left', CaretRight: 'ph-caret-right',
    CornerUpLeft: 'ph-arrow-u-up-left'
};

const Icon = ({ name, className }) => {
    let sizeClass = '';
    if (className?.includes('w-3')) sizeClass = 'text-sm';
    else if (className?.includes('w-4')) sizeClass = 'text-base';
    else if (className?.includes('w-5')) sizeClass = 'text-xl';
    else if (className?.includes('w-6')) sizeClass = 'text-2xl';
    else if (className?.includes('w-8')) sizeClass = 'text-3xl';
    else if (className?.includes('w-10')) sizeClass = 'text-4xl';
    else if (className?.includes('w-12')) sizeClass = 'text-5xl';
    return <i className={`ph ${IconMap[name]} ${sizeClass} ${className} flex items-center justify-center`}></i>;
};

const mockHistory = (base) => Array.from({ length: 12 }, () => Math.floor(base + (Math.random() * base * 0.4 - base * 0.2)));
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const exportToCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(val => {
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${val}"`;
    }).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

// ==========================================
// GEMINI API FALLBACK SYSTEM
// ==========================================
const apiKey = "AIzaSyCryPBsvNj5TdlVnlUI7m8aM2t3vHIHW9E".trim();

const callGeminiAPI = async (payloadTemplate) => {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError = null;
    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadTemplate)
            });
            const data = await res.json();
            if (res.ok) { console.log(`Connected to: ${model}`); return data; }
            lastError = data.error?.message || `HTTP ${res.status}`;
            console.warn(`Model ${model} failed: ${lastError}`);
        } catch (err) {
            lastError = err.message;
        }
    }
    throw new Error(`AI Models failed. Last error: ${lastError}`);
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
    const [loadingDB, setLoadingDB] = useState(true);
    const [dbError, setDbError] = useState(false);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [sales, setSales] = useState([]);
    const [cart, setCart] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [profilePic, setProfilePic] = useState(null);
    const profileInputRef = useRef(null);

    useEffect(() => {
        async function initDB() {
            try {
                const accRes = await db.from('accounts').select('*').order('id', { ascending: true });
                if (accRes.error) { setDbError(true); setLoadingDB(false); return; }
                if (!accRes.data || accRes.data.length === 0) {
                    const { data: newAdmin, error: insertErr } = await db.from('accounts').insert([
                        { username: 'admin', password: 'admin123', role: 'Admin' }
                    ]).select();
                    if (insertErr) { setDbError(true); setLoadingDB(false); return; }
                    setAccounts(newAdmin);
                } else {
                    setAccounts(accRes.data);
                }
                const prodRes = await db.from('products').select('*').order('id', { ascending: true });
                if (prodRes.data) setProducts(prodRes.data);
                const salesRes = await db.from('sales').select('*').order('id', { ascending: false });
                if (salesRes.data) setSales(salesRes.data);
                const supRes = await db.from('suppliers').select('*').order('id', { ascending: true });
                if (supRes.data) setSuppliers(supRes.data);
                const logRes = await db.from('logs').select('*').order('id', { ascending: false });
                if (logRes.data) setLogs(logRes.data);
            } catch (e) {
                console.error("Database connection error:", e);
                setDbError(true);
            } finally {
                setLoadingDB(false);
            }
        }
        initDB();
    }, []);

    if (loadingDB) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-900 text-white font-sans">
                <Icon name="Activity" className="w-12 h-12 text-emerald-400 animate-pulse mb-4" />
                <h2 className="text-xl font-bold tracking-widest">Connecting to Database...</h2>
            </div>
        );
    }

    if (dbError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-emerald-900 p-4 font-sans">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center">
                    <Icon name="AlertTriangle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Database Setup Required</h2>
                    <p className="text-slate-600 mb-4">Could not connect to the database. Please check your MySQL connection and run <code className="bg-slate-100 px-2 py-1 rounded">php artisan migrate --seed</code></p>
                </div>
            </div>
        );
    }

    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    const addToast = (msg, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => removeToast(id), 4500);
    };

    const addNotification = (msg, type = 'success') => {
        setNotifications(prev => [{ id: Date.now() + Math.random(), msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
        addToast(msg, type);
    };

    const logActivity = async (currentUser, action, details) => {
        const newLog = { timestamp: new Date().toISOString(), username: currentUser.username, role: currentUser.role, action, details };
        const { data } = await db.from('logs').insert([newLog]).select();
        if (data) setLogs(prev => [data[0], ...prev]);
    };

    if (!user) {
        return <LoginView accounts={accounts} onLogin={(u) => {
            setUser(u);
            addNotification(`Logged in as ${u.role}`);
            logActivity(u, 'Login', 'User authenticated successfully');
            // Load saved profile pic for this user
            const saved = localStorage.getItem(`profilePic_${u.username}`);
            if (saved) setProfilePic(saved);
            else setProfilePic(null);
        }} />;
    }

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            setProfilePic(dataUrl);
            localStorage.setItem(`profilePic_${user.username}`, dataUrl);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleProfilePicDelete = (e) => {
        e.stopPropagation();
        setProfilePic(null);
        localStorage.removeItem(`profilePic_${user.username}`);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView products={products} sales={sales} notifications={notifications} />;
            case 'products': return <ProductsView products={products} setProducts={setProducts} suppliers={suppliers} user={user} logActivity={logActivity} addNotification={addNotification} db={db} />;
            case 'pos': return <POSView products={products} setProducts={setProducts} sales={sales} setSales={setSales} addNotification={addNotification} user={user} logActivity={logActivity} cart={cart} setCart={setCart} db={db} />;
            case 'inventory': return <InventoryView products={products} />;
            case 'forecast': return <ForecastView products={products} />;
            case 'suppliers': return <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} user={user} logActivity={logActivity} db={db} />;
            case 'reports': return <ReportsView products={products} sales={sales} suppliers={suppliers} />;
            case 'user-management': return <UserManagementView accounts={accounts} setAccounts={setAccounts} user={user} logActivity={logActivity} db={db} />;
            case 'activity-logs': return <ActivityLogsView logs={logs} />;
            default: return <DashboardView products={products} sales={sales} notifications={notifications} />;
        }
    };

    const navItems = [
        { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard', roles: ['Admin', 'Pharmacist', 'Cashier'] },
        { id: 'pos', icon: 'ShoppingCart', label: 'Sales (POS)', roles: ['Admin', 'Cashier'] },
        { id: 'products', icon: 'Package', label: 'Products', roles: ['Admin', 'Pharmacist'] },
        { id: 'inventory', icon: 'ClipboardList', label: 'Inventory', roles: ['Admin', 'Pharmacist'] },
        { id: 'forecast', icon: 'TrendingUp', label: 'Forecasting (SMA)', roles: ['Admin', 'Pharmacist'] },
        { id: 'suppliers', icon: 'Users', label: 'Suppliers', roles: ['Admin'] },
        { id: 'user-management', icon: 'UserCog', label: 'User Management', roles: ['Admin'] },
        { id: 'activity-logs', icon: 'History', label: 'Activity Logs', roles: ['Admin'] },
        { id: 'reports', icon: 'FileBarChart', label: 'Reports', roles: ['Admin'] },
    ];

    return (
        <div className="flex h-screen bg-slate-200 font-sans text-slate-800 relative overflow-hidden">
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}
            <aside className={`fixed inset-y-0 left-0 bg-gray-900 text-white flex flex-col shadow-xl z-40 transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'}`}>
                <div className={`p-4 flex items-center ${isDesktopCollapsed ? 'justify-center' : 'gap-3'} border-b border-gray-700 h-16 shrink-0`}>
                    <button onClick={() => { if (window.innerWidth >= 768) setIsDesktopCollapsed(!isDesktopCollapsed); else setIsMobileMenuOpen(false); }}
                        className="text-gray-400 hover:text-white transition-colors shrink-0 focus:outline-none" title="Toggle Sidebar">
                        <Icon name="List" className="w-8 h-8" />
                    </button>
                    {!isDesktopCollapsed && <h1 className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden">Jewel's Pharmacy</h1>}
                </div>
                <div className={`px-4 py-3 border-b border-gray-700 bg-black/30 flex ${isDesktopCollapsed ? 'justify-center' : 'flex-row items-center gap-3'} shrink-0`}>
                    {/* Hidden file input */}
                    <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                    {/* Circular avatar */}
                    <div
                        onClick={() => !profilePic && profileInputRef.current && profileInputRef.current.click()}
                        title={profilePic ? 'Profile picture' : 'Click to upload profile picture'}
                        className={`relative rounded-full overflow-hidden border-2 border-gray-500 cursor-pointer group shrink-0 ${isDesktopCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}
                    >
                        {profilePic ? (
                            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className={`w-full h-full bg-gray-700 flex items-center justify-center font-bold text-white ${isDesktopCollapsed ? 'text-sm' : 'text-xl'}`}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {/* Camera overlay — only when NO picture */}
                        {!profilePic && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Icon name="Camera" className="text-white w-4 h-4" />
                            </div>
                        )}
                        {/* Delete button — only when picture exists */}
                        {profilePic && (
                            <button
                                onClick={handleProfilePicDelete}
                                title="Remove profile picture"
                                className="absolute top-0 right-0 w-4 h-4 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                <Icon name="X" className="text-white w-3 h-3" />
                            </button>
                        )}
                    </div>
                    {/* User info - beside avatar in expanded mode */}
                    {!isDesktopCollapsed && (
                        <div className="flex flex-col min-w-0">
                            <p className="text-xs text-gray-400">Welcome,</p>
                            <p className="font-semibold text-sm truncate">{user.username}</p>
                            <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded-full inline-block w-max uppercase tracking-wider mt-0.5">{user.role}</span>
                        </div>
                    )}
                </div>
                <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
                    <ul className="space-y-1 px-2">
                        {navItems.filter(item => item.roles.includes(user.role)).map(item => (
                            <li key={item.id}>
                                <button title={isDesktopCollapsed ? item.label : undefined}
                                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                    className={`w-full flex items-center ${isDesktopCollapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-gray-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/60'}`}>
                                    <Icon name={item.icon} className="w-5 h-5 shrink-0" />
                                    {!isDesktopCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-3 border-t border-gray-700 shrink-0">
                    <button title={isDesktopCollapsed ? "Logout" : undefined}
                        onClick={() => { logActivity(user, 'Logout', 'User logged out'); setUser(null); }}
                        className={`w-full flex items-center ${isDesktopCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 text-gray-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors`}>
                        <Icon name="LogOut" className="w-5 h-5 shrink-0" />
                        {!isDesktopCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <main className="flex-1 overflow-y-auto flex flex-col h-screen relative bg-slate-200 min-w-0">
                <header className="bg-white p-4 shadow-sm flex justify-between items-center border-b shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button className="md:hidden p-1 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
                            <Icon name="List" className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 capitalize truncate">
                            {navItems.find(i => i.id === activeTab)?.label}
                        </h2>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>
                <div className="p-4 sm:p-6 flex-1 max-w-full">
                    {renderContent()}
                </div>
            </main>
            <Chatbot />
        </div>
    );
}

// ==========================================
// AI CHATBOT
// ==========================================
function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hi! I am the PharmaSync AI Assistant. How can I help you navigate the system today?' }
    ]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim()) return;
        const newMessages = [...messages, { role: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        try {
            const payload = {
                contents: newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
                systemInstruction: { parts: [{ text: "You are an AI assistant for PharmaSync, a Pharmacy Sales and Inventory System." }] }
            };
            const data = await callGeminiAPI(payload);
            const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";
            setMessages(prev => [...prev, { role: 'model', text: botReply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: error.message }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 print:hidden">
            {isOpen ? (
                <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden border border-slate-200 h-[500px]">
                    <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2"><Icon name="Bot" className="w-5 h-5" /><h3 className="font-bold">AI Assistant</h3></div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-emerald-700 p-1 rounded transition-colors"><Icon name="X" className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-slate-400 text-sm shadow-sm flex items-center gap-1">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500" />
                        <button type="submit" disabled={isLoading || !input.trim()} className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:bg-slate-300"><Icon name="Send" className="w-5 h-5" /></button>
                    </form>
                </div>
            ) : (
                <button onClick={() => setIsOpen(true)} className="bg-emerald-600 text-white p-4 rounded-full shadow-xl hover:bg-emerald-700 hover:scale-105 transition-all"><Icon name="MessageSquare" className="w-6 h-6" /></button>
            )}
        </div>
    );
}

// ==========================================
// BARCODE SCANNER MODAL
// ==========================================
function BarcodeScannerModal({ onClose, onScan }) {
    const onScanRef = useRef(onScan);
    useEffect(() => { onScanRef.current = onScan; }, [onScan]);
    useEffect(() => {
        let scanner;
        const init = () => {
            if (window.Html5QrcodeScanner && !scanner) {
                scanner = new window.Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
                scanner.render((text) => { scanner.clear(); onScanRef.current(text); }, () => { });
            }
        };
        if (window.Html5QrcodeScanner) init();
        return () => { if (scanner) scanner.clear().catch(e => console.error(e)); };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icon name="QrCode" className="w-5 h-5 text-emerald-600" /> Scan Product Barcode</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><Icon name="XCircle" className="w-6 h-6" /></button>
                </div>
                <div className="p-4">
                    <div id="reader" className="w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 min-h-[300px]"></div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// AI LABEL SCANNER MODAL
// ==========================================
function AILabelScannerModal({ onClose, onScan }) {
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        setIsLoading(true);
        try {
            const base64Data = await fileToBase64(file);
            const payload = {
                contents: [{
                    parts: [
                        { text: "You are a pharmacy assistant AI. Extract product details from this medicine label. Format the expiration date as YYYY-MM-DD (assume the last day of the month if day is missing). For barcode, use the prominent alphanumeric code. Infer the medical category. Extract the dosage strength (e.g. 500mg, 10mg/5ml). Return ONLY a valid raw JSON object (no markdown formatting, no backticks) with keys: name, genericName, brand, category, dosage, expirationDate, barcode." },
                        { inlineData: { mimeType: file.type, data: base64Data } }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" }, genericName: { type: "STRING" }, brand: { type: "STRING" },
                            dosage: { type: "STRING" }, category: { type: "STRING" }, expirationDate: { type: "STRING" }, barcode: { type: "STRING" }
                        }
                    }
                }
            };
            const data = await callGeminiAPI(payload);
            let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonText) {
                jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
                const extracted = JSON.parse(jsonText);
                onScan(extracted);
            } else {
                alert("Could not extract data from the image.");
                setPreview(null);
            }
        } catch (error) {
            alert(`AI Scan Failed: ${error.message}`);
            setPreview(null);
        } finally {
            setIsLoading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icon name="Camera" className="w-5 h-5 text-emerald-600" /> AI Label Scanner</h3>
                    <button onClick={onClose} disabled={isLoading} className="text-slate-400 hover:text-slate-600 transition-colors"><Icon name="XCircle" className="w-6 h-6" /></button>
                </div>
                <div className="p-6 flex flex-col items-center">
                    {preview ? (
                        <div className="w-full relative rounded-lg overflow-hidden border border-slate-200 mb-4 bg-black flex items-center justify-center min-h-[250px] max-h-[300px]">
                            <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                            {isLoading && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <p className="font-medium text-center px-4">AI Analyzing Label...<br /><span className="text-xs font-normal opacity-80">(This may take a few seconds)</span></p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <label className="w-full h-64 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100 transition-colors mb-4">
                            <Icon name="Upload" className="w-10 h-10 text-emerald-500 mb-3" />
                            <span className="text-emerald-800 font-medium">Click to Take Picture or Upload</span>
                            <span className="text-emerald-600 text-sm mt-1">Image will be analyzed by AI</span>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// LOGIN VIEW
// ==========================================
function LoginView({ onLogin, accounts }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('Admin');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        const account = accounts.find(a => a.username === username && a.password === password && a.role === role);
        if (account) onLogin(account);
        else setError('Invalid username, password, or role.');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-emerald-900 bg-opacity-95 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-emerald-100 p-3 rounded-full mb-4"><Icon name="Activity" className="w-10 h-10 text-emerald-600" /></div>
                    <h1 className="text-2xl font-bold text-slate-900 text-center">Welcome to Jewel's Pharmacy</h1>

                </div>
                {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm text-center">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Username" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none" tabIndex="-1">
                                <Icon name={showPassword ? "EyeSlash" : "Eye"} className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Role</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Admin', 'Pharmacist', 'Cashier'].map(r => (
                                <button key={r} type="button" onClick={() => setRole(r)}
                                    className={`py-2.5 rounded-lg font-semibold text-sm border-2 transition-all ${role === r ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">Log In</button>
                </form>
            </div>
        </div>
    );
}

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '340px', width: '90vw' }}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onClose }) {
    const [visible, setVisible] = React.useState(false);
    React.useEffect(() => {
        const s = setTimeout(() => setVisible(true), 20);
        const h = setTimeout(() => setVisible(false), 3800);
        return () => { clearTimeout(s); clearTimeout(h); };
    }, []);
    const configs = {
        success: { bg: 'bg-emerald-600', border: 'border-emerald-500', icon: 'CheckCircle' },
        error: { bg: 'bg-red-600', border: 'border-red-500', icon: 'XCircle' },
        warning: { bg: 'bg-amber-500', border: 'border-amber-400', icon: 'AlertTriangle' },
        info: { bg: 'bg-blue-600', border: 'border-blue-500', icon: 'Info' },
    };
    const cfg = configs[toast.type] || configs.success;
    return (
        <div
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border text-white ${cfg.bg} ${cfg.border} transition-all duration-300`}
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(110%)' }}
        >
            <Icon name={cfg.icon} className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1 leading-snug">{toast.msg}</p>
            <button onClick={onClose} className="text-white/70 hover:text-white shrink-0 ml-1">
                <Icon name="X" className="w-4 h-4" />
            </button>
        </div>
    );
}
