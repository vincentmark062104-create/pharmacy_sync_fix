// ==========================================
// LARAVEL API SHIM (replaces Supabase)
// Provides the same .from().select().insert().update().delete() interface
// so the React app code does NOT need to change.
// ==========================================
(function () {
    const CSRF = document.querySelector('meta[name="csrf-token"]')?.content || '';

    async function laravelFetch(method, table, id, body) {
        const url = id != null ? `/api/${table}/${id}` : `/api/${table}`;
        const opts = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': CSRF,
                'Accept': 'application/json'
            }
        };
        if (body) opts.body = JSON.stringify(body);
        try {
            const res = await fetch(url, opts);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return { data: null, error: err.message || `HTTP ${res.status}` };
            }
            const data = await res.json();
            return { data, error: null };
        } catch (e) {
            return { data: null, error: e.message };
        }
    }

    class QBuilder {
        constructor(table) {
            this._table = table;
            this._op = 'select';
            this._body = null;
            this._id = null;
        }

        select() {
            this._op = 'select';
            const self = this;
            return {
                order: () => self,
                then: (res, rej) => self._run().then(res, rej),
                catch: (rej) => self._run().catch(rej)
            };
        }

        insert(rows) {
            this._op = 'insert';
            this._body = Array.isArray(rows) ? rows[0] : rows;
            const self = this;
            return {
                select: () => self,
                then: (res, rej) => self._run().then(res, rej),
                catch: (rej) => self._run().catch(rej)
            };
        }

        update(body) {
            this._op = 'update';
            this._body = body;
            const self = this;
            return {
                eq: (col, val) => {
                    if (col === 'id') self._id = val;
                    return {
                        select: () => self,
                        then: (res, rej) => self._run().then(res, rej),
                        catch: (rej) => self._run().catch(rej)
                    };
                }
            };
        }

        delete() {
            this._op = 'delete';
            const self = this;
            return {
                eq: (col, val) => {
                    if (col === 'id') self._id = val;
                    return {
                        then: (res, rej) => self._run().then(res, rej),
                        catch: (rej) => self._run().catch(rej)
                    };
                }
            };
        }

        async _run() {
            if (this._op === 'select') {
                const r = await laravelFetch('GET', this._table);
                if (r.error) return { data: null, error: r.error };
                return { data: Array.isArray(r.data) ? r.data : [], error: null };
            }
            if (this._op === 'insert') {
                const r = await laravelFetch('POST', this._table, null, this._body);
                if (r.error) return { data: null, error: r.error };
                return { data: [r.data], error: null };
            }
            if (this._op === 'update') {
                const r = await laravelFetch('PUT', this._table, this._id, this._body);
                if (r.error) return { data: null, error: r.error };
                return { data: [r.data], error: null };
            }
            if (this._op === 'delete') {
                await laravelFetch('DELETE', this._table, this._id);
                return { data: null, error: null };
            }
        }

        // Make the builder itself awaitable for fire-and-forget patterns like:
        // supabase.from('products').update({qty}).eq('id', id).then()
        then(res, rej) { return this._run().then(res, rej); }
    }

    window.db = { from: (table) => new QBuilder(table) };
})();
