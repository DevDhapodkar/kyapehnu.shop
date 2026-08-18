import { formatPaise } from '../lib/money.js';

/** HTML-escape all interpolated, user-supplied text to prevent stored XSS. */
export const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (paise) => formatPaise(paise ?? 0);

const STYLE = `
  :root{--bg:#050506;--panel:#0f0f12;--panel2:#17171c;--line:#26262e;--ink:#f4f4f5;--muted:#9a9aa5;--crimson:#e11d48;--gold:#d4af37;--green:#16a34a;--amber:#d97706;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  a{color:inherit}
  header{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid var(--line);background:rgba(15,15,18,.7);backdrop-filter:blur(12px);position:sticky;top:0;z-index:5}
  .brand{font-weight:700;letter-spacing:.5px}
  .brand small{color:var(--muted);font-weight:400;margin-left:8px}
  nav a{margin-left:20px;color:var(--muted);text-decoration:none;font-size:14px}
  nav a:hover,nav a.active{color:var(--ink)}
  main{max-width:1100px;margin:0 auto;padding:28px}
  h1{font-size:22px;margin:0 0 4px}
  .sub{color:var(--muted);margin:0 0 24px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:28px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px}
  .stat{font-size:30px;font-weight:700}
  .stat.crimson{color:var(--crimson)} .stat.gold{color:var(--gold)} .stat.green{color:var(--green)}
  .label{color:var(--muted);font-size:13px;text-transform:uppercase;letter-spacing:.6px}
  table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}
  th,td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);font-size:14px;vertical-align:top}
  th{color:var(--muted);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
  tr:last-child td{border-bottom:none}
  .pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;border:1px solid var(--line)}
  .pill.pending{color:var(--amber);border-color:var(--amber)}
  .pill.approved,.pill.delivered{color:var(--green);border-color:var(--green)}
  .pill.rejected,.pill.cancelled{color:var(--crimson);border-color:var(--crimson)}
  form.inline{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  input,select{background:var(--panel2);border:1px solid var(--line);color:var(--ink);padding:9px 11px;border-radius:9px;font-size:14px}
  input:focus,select:focus{outline:none;border-color:var(--gold)}
  button{background:var(--ink);color:#050506;border:none;padding:9px 16px;border-radius:9px;font-weight:600;cursor:pointer;font-size:14px}
  button.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
  button.danger{background:var(--crimson);color:#fff}
  button.gold{background:var(--gold);color:#050506}
  .muted{color:var(--muted)}
  .row{display:flex;gap:24px;flex-wrap:wrap}
  .box{flex:1;min-width:280px}
  .empty{padding:40px;text-align:center;color:var(--muted)}
  .login{max-width:360px;margin:12vh auto;text-align:center}
  .login .card{padding:28px}
  .login input{width:100%;margin:8px 0}
  .login button{width:100%;margin-top:12px}
  .err{color:var(--crimson);font-size:14px;margin-top:10px}
  .flash{background:rgba(22,163,74,.12);border:1px solid var(--green);color:var(--green);padding:10px 14px;border-radius:10px;margin-bottom:18px;font-size:14px}
  .lines td{font-size:13px}
  .totals{margin-top:10px;font-size:14px}
  .totals div{display:flex;justify-content:space-between;padding:3px 0}
  .totals .grand{border-top:1px solid var(--line);margin-top:6px;padding-top:8px;font-weight:700;font-size:16px}
  @media print{header,nav,.noprint{display:none}body{background:#fff;color:#000}.card,table{border-color:#ccc}}
`;

const navLink = (href, label, active) =>
  `<a href="${href}" class="${active === label ? 'active' : ''}">${label}</a>`;

export const layout = (title, body, { admin, active, flash } = {}) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)} · Kya Pehnu Admin</title><style>${STYLE}</style></head>
<body>
<header>
  <div class="brand">Kya Pehnu? <small>Admin</small></div>
  ${
    admin
      ? `<nav>
      ${navLink('/admin', 'Dashboard', active)}
      ${navLink('/admin/products', 'Products', active)}
      ${navLink('/admin/vendors', 'Vendors', active)}
      ${navLink('/admin/orders', 'Orders', active)}
      ${navLink('/admin/settings', 'Settings', active)}
      <a href="/admin/logout" class="noprint">Sign out (${esc(admin.name)})</a>
    </nav>`
      : ''
  }
</header>
<main>${flash ? `<div class="flash">${esc(flash)}</div>` : ''}${body}</main>
</body></html>`;

export const loginPage = (error) =>
  layout(
    'Sign in',
    `<div class="login"><div class="card">
      <h1>Admin sign in</h1>
      <p class="sub">Platform staff only</p>
      <form method="post" action="/admin/login">
        <input name="email" type="email" placeholder="Email" autocomplete="username" required/>
        <input name="password" type="password" placeholder="Password" autocomplete="current-password" required/>
        <button type="submit">Sign in</button>
      </form>
      ${error ? `<div class="err">${esc(error)}</div>` : ''}
    </div></div>`,
    {}
  );

const statusPill = (s) => `<span class="pill ${esc(String(s).toLowerCase())}">${esc(s)}</span>`;

export const dashboardPage = (stats, admin) =>
  layout(
    'Dashboard',
    `<h1>Dashboard</h1><p class="sub">Operational overview</p>
    <div class="grid">
      <div class="card"><div class="label">Pending products</div><div class="stat gold">${stats.pendingProducts}</div></div>
      <div class="card"><div class="label">Pending vendors</div><div class="stat gold">${stats.pendingVendors}</div></div>
      <div class="card"><div class="label">Orders today</div><div class="stat">${stats.ordersToday}</div></div>
      <div class="card"><div class="label">Live orders</div><div class="stat">${stats.liveOrders}</div></div>
      <div class="card"><div class="label">GMV (delivered)</div><div class="stat green">${money(stats.gmvPaise)}</div></div>
      <div class="card"><div class="label">Platform earnings</div><div class="stat crimson">${money(stats.earningsPaise)}</div></div>
    </div>
    <div class="row">
      <div class="box card"><div class="label">Approved vendors</div><div class="stat">${stats.approvedVendors}</div></div>
      <div class="box card"><div class="label">Live products</div><div class="stat">${stats.approvedProducts}</div></div>
      <div class="box card"><div class="label">Total customers</div><div class="stat">${stats.customers}</div></div>
    </div>`,
    { admin, active: 'Dashboard' }
  );

export const productsPage = (products, settings, admin, flash) => {
  const defMargin = (settings.defaultMarginPaise / 100).toFixed(2);
  const rows = products
    .map(
      (p) => `<tr>
      <td><strong>${esc(p.name)}</strong><br/><span class="muted">${esc(p.category)}${p.subCategory ? ' · ' + esc(p.subCategory) : ''} · ${esc(p.vendor?.shopName || '—')}</span></td>
      <td>${money(p.basePricePaise)}<br/><span class="muted">vendor price</span></td>
      <td>
        <form class="inline" method="post" action="/admin/products/${p._id}/approve">
          <span class="muted">₹</span>
          <input name="marginRupees" type="number" step="0.01" min="0" value="${defMargin}" style="width:90px" required/>
          <button class="gold" type="submit">Approve</button>
        </form>
        <div class="muted" style="margin-top:4px">sells at base + margin</div>
      </td>
      <td>
        <form class="inline" method="post" action="/admin/products/${p._id}/reject">
          <input name="reason" placeholder="Reason" required style="width:140px"/>
          <button class="danger" type="submit">Reject</button>
        </form>
      </td>
    </tr>`
    )
    .join('');
  return layout(
    'Products',
    `<h1>Product approval queue</h1><p class="sub">Set Kya Pehnu's margin, then approve. Customer pays base + margin.</p>
    ${
      products.length
        ? `<table><thead><tr><th>Product</th><th>Base price</th><th>Margin & approve</th><th>Reject</th></tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="card empty">No products awaiting approval 🎉</div>`
    }`,
    { admin, active: 'Products', flash }
  );
};

export const vendorsPage = (vendors, admin, flash) => {
  const rows = vendors
    .map(
      (v) => `<tr>
      <td><strong>${esc(v.shopName)}</strong><br/><span class="muted">${esc(v.ownerName)} · ${esc(v.address?.area || '')}, ${esc(v.address?.city || 'Nagpur')}</span></td>
      <td class="muted">GSTIN: ${esc(v.kyc?.gstin || '—')}<br/>PAN: ${esc(v.kyc?.pan || '—')}</td>
      <td>
        <form class="inline" method="post" action="/admin/vendors/${v._id}/approve"><button class="gold" type="submit">Approve</button></form>
        <form class="inline" method="post" action="/admin/vendors/${v._id}/reject" style="margin-top:6px">
          <input name="reason" placeholder="Reason" required style="width:150px"/><button class="danger" type="submit">Reject</button>
        </form>
      </td>
    </tr>`
    )
    .join('');
  return layout(
    'Vendors',
    `<h1>Vendor approval queue</h1><p class="sub">Approve a shop to make it visible in customer discovery.</p>
    ${
      vendors.length
        ? `<table><thead><tr><th>Shop</th><th>KYC</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="card empty">No vendors awaiting approval</div>`
    }`,
    { admin, active: 'Vendors', flash }
  );
};

export const ordersPage = (orders, statusFilter, admin) => {
  const filters = ['ALL', 'PENDING', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REJECTED']
    .map(
      (s) =>
        `<a href="/admin/orders?status=${s}" class="pill ${statusFilter === s ? 'approved' : ''}" style="text-decoration:none">${s}</a>`
    )
    .join(' ');
  const rows = orders
    .map(
      (o) => `<tr>
      <td><a href="/admin/orders/${o._id}"><strong>${esc(o.orderNumber || o._id)}</strong></a><br/><span class="muted">${new Date(o.createdAt).toLocaleString('en-IN')}</span></td>
      <td>${esc(o.customer?.name || '—')}<br/><span class="muted">${esc(o.vendor?.shopName || '—')}</span></td>
      <td>${money(o.pricing?.grandTotalPaise)}<br/><span class="muted">${esc(o.payment?.method)} · ${esc(o.payment?.status)}</span></td>
      <td>${statusPill(o.status)}</td>
    </tr>`
    )
    .join('');
  return layout(
    'Orders',
    `<h1>Orders</h1><p class="sub">${filters}</p>
    ${
      orders.length
        ? `<table><thead><tr><th>Order</th><th>Customer / Shop</th><th>Total</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="card empty">No orders</div>`
    }`,
    { admin, active: 'Orders' }
  );
};

const lineRows = (items) =>
  items
    .map(
      (it) =>
        `<tr><td>${esc(it.name)} <span class="muted">(${esc(it.size)})</span></td><td>${it.quantity}</td><td>${money(it.unitSellingPricePaise)}</td><td>${money(it.lineTotalPaise)}</td></tr>`
    )
    .join('');

export const orderDetailPage = (order, invoice, admin, flash) => {
  const p = order.pricing;
  const canCancel = !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status);
  return layout(
    `Order ${order.orderNumber || order._id}`,
    `<h1>${esc(order.orderNumber || order._id)} ${statusPill(order.status)}</h1>
    <p class="sub">${new Date(order.createdAt).toLocaleString('en-IN')} · ${esc(order.payment?.method)} (${esc(order.payment?.status)})</p>
    <div class="row">
      <div class="box card">
        <div class="label">Customer</div><p>${esc(order.customer?.name || '—')}<br/><span class="muted">${esc(order.customer?.phone || '')}</span></p>
        <div class="label">Deliver to</div><p>${esc(order.deliveryAddress?.line1)}${order.deliveryAddress?.line2 ? ', ' + esc(order.deliveryAddress.line2) : ''}, ${esc(order.deliveryAddress?.city)} ${esc(order.deliveryAddress?.pincode)}</p>
        <div class="label">Shop</div><p>${esc(order.vendor?.shopName || '—')}</p>
      </div>
      <div class="box card">
        <table class="lines"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${lineRows(order.items)}</tbody></table>
        <div class="totals">
          <div><span>Items subtotal</span><span>${money(p.itemsSubtotalPaise)}</span></div>
          <div><span>Delivery</span><span>${money(p.deliveryFeePaise)}</span></div>
          <div><span>Tax</span><span>${money(p.taxPaise)}</span></div>
          <div><span>Platform fee</span><span>${money(p.platformFeePaise)}</span></div>
          <div class="grand"><span>Grand total</span><span>${money(p.grandTotalPaise)}</span></div>
          <div class="muted" style="margin-top:8px"><span>Vendor payout</span><span>${money(p.vendorPayoutPaise)}</span></div>
          <div class="muted"><span>Platform earnings</span><span>${money(p.platformEarningsPaise)}</span></div>
        </div>
      </div>
    </div>
    <div class="row" style="margin-top:20px">
      ${invoice ? `<a class="box" href="/admin/orders/${order._id}/invoice"><button class="ghost">View invoice ${esc(invoice.invoiceNumber)}</button></a>` : ''}
      ${
        canCancel
          ? `<form class="inline box" method="post" action="/admin/orders/${order._id}/cancel">
             <input name="reason" placeholder="Cancellation reason" required style="flex:1"/>
             <button class="danger" type="submit">Cancel order</button></form>`
          : ''
      }
    </div>`,
    { admin, active: 'Orders', flash }
  );
};

export const invoicePage = (inv) =>
  layout(
    `Invoice ${inv.invoiceNumber}`,
    `<div class="card" style="max-width:640px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1>Kya Pehnu?</h1><p class="muted">Tax Invoice</p></div>
        <div style="text-align:right"><strong>${esc(inv.invoiceNumber)}</strong><br/><span class="muted">${new Date(inv.issuedAt).toLocaleDateString('en-IN')}</span></div>
      </div>
      <div class="row" style="margin:16px 0">
        <div class="box"><div class="label">Sold by</div><p>${esc(inv.seller?.shopName)}<br/><span class="muted">${esc(inv.seller?.address)}</span>${inv.seller?.gstin ? `<br/><span class="muted">GSTIN: ${esc(inv.seller.gstin)}</span>` : ''}</p></div>
        <div class="box"><div class="label">Billed to</div><p>${esc(inv.buyer?.name)}<br/><span class="muted">${esc(inv.buyer?.deliveryAddress)}</span></p></div>
      </div>
      <table class="lines"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${lineRows(inv.lines)}</tbody></table>
      <div class="totals">
        <div><span>Items subtotal</span><span>${money(inv.itemsSubtotalPaise)}</span></div>
        <div><span>Delivery</span><span>${money(inv.deliveryFeePaise)}</span></div>
        <div><span>Tax</span><span>${money(inv.taxPaise)}</span></div>
        <div><span>Platform fee</span><span>${money(inv.platformFeePaise)}</span></div>
        <div class="grand"><span>Total (${esc(inv.paymentMethod)})</span><span>${money(inv.grandTotalPaise)}</span></div>
      </div>
      <p class="muted" style="margin-top:20px;font-size:12px">This is a computer-generated invoice. Payment collected as ${esc(inv.paymentMethod)}.</p>
      <button class="noprint" onclick="window.print()" style="margin-top:10px">Print / Save PDF</button>
    </div>`,
    { admin: null }
  );

export const settingsPage = (s, admin, flash) => {
  const r = (paise) => (paise / 100).toFixed(2);
  return layout(
    'Settings',
    `<h1>Platform settings</h1><p class="sub">Fees and margins apply to new orders and product approvals.</p>
    <form method="post" action="/admin/settings" class="card" style="max-width:520px">
      <p><span class="label">Platform fee (₹, charged per order)</span><br/><input name="platformFeeRupees" type="number" step="0.01" min="0" value="${r(s.platformFeePaise)}"/></p>
      <p><span class="label">Default margin at approval (₹)</span><br/><input name="defaultMarginRupees" type="number" step="0.01" min="0" value="${r(s.defaultMarginPaise)}"/></p>
      <p><span class="label">Delivery fee (₹) — 0 while Porter is deferred</span><br/><input name="deliveryFeeRupees" type="number" step="0.01" min="0" value="${r(s.deliveryFeePaise)}"/></p>
      <p><span class="label">Tax (basis points, 500 = 5%) — 0 until GSTIN</span><br/><input name="taxBps" type="number" step="1" min="0" value="${s.taxBps}"/></p>
      <p><span class="label">COD max order value (₹)</span><br/><input name="codMaxOrderRupees" type="number" step="0.01" min="0" value="${r(s.codMaxOrderPaise)}"/></p>
      <button type="submit">Save settings</button>
    </form>`,
    { admin, active: 'Settings', flash }
  );
};
