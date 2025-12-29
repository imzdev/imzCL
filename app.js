const PRODUCTOS_MAESTROS = [
    { id: 'hombre', titulo: 'Honey Hombre', stockInicial: 27, precio: 10000 },
    { id: 'mujer', titulo: 'Honey Mujer', stockInicial: 19, precio: 10000 }
];

let movimientos = JSON.parse(localStorage.getItem('honey_inventory_v12'));

if (!movimientos) {
    movimientos = [
        { timestamp: 1710000000001, prodId: 'hombre', tipo: 'v', cantidad: 3, fecha: new Date().toISOString(), anulado: false },
        { timestamp: 1710000000002, prodId: 'mujer', tipo: 'v', cantidad: 1, fecha: new Date().toISOString(), anulado: false }
    ];
    localStorage.setItem('honey_inventory_v12', JSON.stringify(movimientos));
}

function calcularEstado() {
    return PRODUCTOS_MAESTROS.map(p => {
        const v = movimientos.filter(m => m.prodId === p.id && m.tipo === 'v' && !m.anulado).reduce((acc, m) => acc + m.cantidad, 0);
        const c = movimientos.filter(m => m.prodId === p.id && m.tipo === 'c' && !m.anulado).reduce((acc, m) => acc + m.cantidad, 0);
        return { ...p, vendidos: v, stockActual: p.stockInicial + c - v };
    });
}

function render() {
    const estado = calcularEstado();
    const total = estado.reduce((acc, p) => acc + (p.vendidos * p.precio), 0);
    document.getElementById('total-money').innerText = `$${total.toLocaleString('es-CL')}`;

    // VISTA CLIENTE CON "VENDIDOS"
    document.getElementById('client-grid').innerHTML = estado.map(p => `
        <div class="card">
            <h2 style="color: var(--p-gold); margin-bottom:15px;">${p.titulo}</h2>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="color:var(--text-dim); font-size:0.8rem; text-transform:uppercase;">Existencias</span>
                <strong style="font-size:1.8rem;">${p.stockActual}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; opacity:0.7;">
                <span style="color:var(--text-dim); font-size:0.8rem; text-transform:uppercase;">Vendidos</span>
                <strong style="font-size:1.2rem; color:var(--p-amber);">${p.vendidos}</strong>
            </div>
        </div>
    `).join('');

    // VISTA ADMIN
    document.getElementById('admin-grid').innerHTML = estado.map(p => `
        <div class="card" style="padding:20px;">
            <h3 style="margin-bottom:15px; font-size:1rem;">${p.titulo}</h3>
            <input type="number" id="in-${p.id}" placeholder="0" inputmode="numeric">
            <div style="display:flex; gap:10px;">
                <button class="btn-act btn-amber" onclick="registrar('${p.id}', 'c')">STOCK</button>
                <button class="btn-act btn-gold" onclick="registrar('${p.id}', 'v')">VENTA</button>
            </div>
        </div>
    `).join('');

    // HISTORIAL
    document.getElementById('historial-list').innerHTML = movimientos.slice().reverse().map(m => `
        <div class="hist-item" style="${m.anulado ? 'opacity:0.2; text-decoration:line-through' : ''}">
            <div>
                <b style="color:var(--p-gold)">${m.tipo === 'v' ? 'VENTA' : 'CARGA'}</b> - ${m.prodId}<br>
                <small style="color:var(--text-dim)">${new Date(m.fecha).toLocaleTimeString()}</small>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <strong>${m.cantidad} un.</strong>
                ${!m.anulado ? `<button onclick="anular(${m.timestamp})" style="background:none; border:none; color:var(--p-amber); cursor:pointer; text-decoration:underline; font-size:0.7rem;">ANULAR</button>` : ''}
            </div>
        </div>
    `).join('');

    localStorage.setItem('honey_inventory_v12', JSON.stringify(movimientos));
}

window.registrar = (id, tipo) => {
    const input = document.getElementById(`in-${id}`);
    const n = parseInt(input.value);
    if(!n || n <= 0) return;
    movimientos.push({ timestamp: Date.now(), prodId: id, tipo: tipo, cantidad: n, fecha: new Date().toISOString(), anulado: false });
    input.value = '';
    render();
};

window.anular = (ts) => {
    const m = movimientos.find(x => x.timestamp === ts);
    if(m) { m.anulado = true; render(); }
};

window.toggleView = (id) => {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

window.checkLogin = () => {
    if(document.getElementById('pass').value === '1710') toggleView('view-admin');
};

document.addEventListener('DOMContentLoaded', () => {
    // Parallax
    const bg = document.getElementById('interactive-bg');
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.clientX) / 60;
        const y = (window.innerHeight / 2 - e.clientY) / 60;
        bg.style.transform = `translate(${x}px, ${y}px)`;
    });
    // Abejas
    const layer = document.getElementById('bee-layer');
    for(let i=0; i<12; i++) {
        let b = document.createElement('div');
        b.className = 'bee-particle';
        b.style.left = Math.random() * 100 + 'vw';
        b.style.top = Math.random() * 100 + 'vh';
        b.style.animationDuration = (Math.random() * 6 + 4) + 's';
        layer.appendChild(b);
    }
    render();
});