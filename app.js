// --- 1. CONFIGURACIÓN DE "BASE DE DATOS" ---
const DB_KEY = 'honey_inventory_final_v1';

// Datos iniciales exactos según tu requerimiento físico
const DEFAULT_DATA = {
    productos: [
        { id: 'hombre', titulo: 'Honey Hombre', stockActual: 27, precio: 10000 },
        { id: 'mujer', titulo: 'Honey Mujer', stockActual: 19, precio: 10000 }
    ],
    movimientos: [
        { timestamp: 1710000000001, prodId: 'hombre', tipo: 'v', cantidad: 3, fecha: new Date().toISOString(), anulado: false },
        { timestamp: 1710000000002, prodId: 'mujer', tipo: 'v', cantidad: 1, fecha: new Date().toISOString(), anulado: false }
    ]
};

// Cargar desde localStorage o usar los datos por defecto si está vacío
let db = JSON.parse(localStorage.getItem(DB_KEY)) || DEFAULT_DATA;

// --- 2. MOTOR DE PERSISTENCIA ---
// Esta función guarda los cambios y refresca la pantalla
function actualizarTodo() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    render();
}

// --- 3. LÓGICA DEL CRUD (REGISTRAR Y ANULAR) ---
window.registrar = (id, tipo) => {
    const input = document.getElementById(`in-${id}`);
    const cantidad = parseInt(input.value);
    
    if (!cantidad || cantidad <= 0) return;

    const producto = db.productos.find(p => p.id === id);
    if (!producto) return;

    // Validación de stock para ventas
    if (tipo === 'v' && producto.stockActual < cantidad) {
        alert(`Stock insuficiente. Solo quedan ${producto.stockActual} unidades.`);
        return;
    }

    // Modificar stock físico en el maestro de productos
    if (tipo === 'v') producto.stockActual -= cantidad;
    if (tipo === 'c') producto.stockActual += cantidad;

    // Guardar en el historial
    db.movimientos.push({
        timestamp: Date.now(),
        prodId: id,
        tipo: tipo,
        cantidad: cantidad,
        fecha: new Date().toISOString(),
        anulado: false
    });

    input.value = '';
    actualizarTodo();
};

window.anular = (ts) => {
    const m = db.movimientos.find(x => x.timestamp === ts);
    if (!m || m.anulado) return;

    const producto = db.productos.find(p => p.id === m.prodId);
    
    // Revertir el stock físico al anular
    if (m.tipo === 'v') producto.stockActual += m.cantidad;
    if (m.tipo === 'c') producto.stockActual -= m.cantidad;

    m.anulado = true;
    actualizarTodo();
};

// --- 4. RENDERIZADO DE LA INTERFAZ ---
function render() {
    // CALCULAR TOTAL DE DINERO (Ventas no anuladas)
    const totalDinero = db.movimientos
        .filter(m => m.tipo === 'v' && !m.anulado)
        .reduce((acc, m) => {
            const p = db.productos.find(prod => prod.id === m.prodId);
            return acc + (m.cantidad * (p ? p.precio : 0));
        }, 0);

    const totalDoc = document.getElementById('total-money');
    if(totalDoc) totalDoc.innerText = `$${totalDinero.toLocaleString('es-CL')}`;

    // RENDER VISTA CLIENTE
    document.getElementById('client-grid').innerHTML = db.productos.map(p => {
        const vendidos = db.movimientos
            .filter(m => m.prodId === p.id && m.tipo === 'v' && !m.anulado)
            .reduce((acc, m) => acc + m.cantidad, 0);

        return `
        <div class="card">
            <h2 style="color: var(--p-gold); margin-bottom:15px;">${p.titulo}</h2>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <span style="color:var(--text-dim); font-size:0.8rem; text-transform:uppercase;">Existencias</span>
                <strong style="font-size:1.8rem;">${p.stockActual}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; opacity:0.7;">
                <span style="color:var(--text-dim); font-size:0.8rem; text-transform:uppercase;">Vendidos</span>
                <strong style="font-size:1.2rem; color:var(--p-amber);">${vendidos}</strong>
            </div>
        </div>`;
    }).join('');

    // RENDER VISTA ADMIN
    document.getElementById('admin-grid').innerHTML = db.productos.map(p => `
        <div class="card" style="padding:20px;">
            <h3 style="margin-bottom:15px; font-size:1rem;">${p.titulo}</h3>
            <input type="number" id="in-${p.id}" placeholder="0" inputmode="numeric">
            <div style="display:flex; gap:10px;">
                <button class="btn-act btn-amber" onclick="registrar('${p.id}', 'c')">STOCK</button>
                <button class="btn-act btn-gold" onclick="registrar('${p.id}', 'v')">VENTA</button>
            </div>
        </div>
    `).join('');

    // RENDER HISTORIAL
    document.getElementById('historial-list').innerHTML = db.movimientos.slice().reverse().map(m => `
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
}

// --- 5. FUNCIONES DE NAVEGACIÓN Y LOGIN ---
window.toggleView = (id) => {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

window.checkLogin = () => {
    if(document.getElementById('pass').value === '1710') toggleView('view-admin');
    else alert("Contraseña incorrecta");
};

// --- 6. INICIALIZACIÓN AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    // Efectos visuales de fondo
    const bg = document.getElementById('interactive-bg');
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.clientX) / 60;
        const y = (window.innerHeight / 2 - e.clientY) / 60;
        if(bg) bg.style.transform = `translate(${x}px, ${y}px)`;
    });

    // Partículas de abejas
    const layer = document.getElementById('bee-layer');
    if(layer) {
        for(let i=0; i<12; i++) {
            let b = document.createElement('div');
            b.className = 'bee-particle';
            b.style.left = Math.random() * 100 + 'vw';
            b.style.top = Math.random() * 100 + 'vh';
            b.style.animationDuration = (Math.random() * 6 + 4) + 's';
            layer.appendChild(b);
        }
    }
    
    // Ejecutar render inicial
    render();
});