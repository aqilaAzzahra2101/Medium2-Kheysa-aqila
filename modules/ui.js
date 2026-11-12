export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function lifestyleBadge(tier) {
    const colors = { Low: 'bg-lime/50 text-forest', Medium: 'bg-amber-100 text-amber-900', High: 'bg-rose-100 text-rose-900', Flexible: 'bg-sky-100 text-sky-900' };
    return `<span class="rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[tier] || colors.Medium}">${escapeHtml(tier)}</span>`;
}

function expenseTotal(expenses) {
    return Object.values(expenses || {}).reduce((total, value) => total + (Number(value) || 0), 0);
}

export function renderJobCard(job, isHot) {
    const expenses = expenseTotal(job.monthlyExpenses);
    const savings = job.salary - expenses;
    const wageComparison = job.regionalMinimumWage === null
        ? '<p class="text-xs leading-5 text-ink/55">Patokan UMR mengikuti lokasi tempat tinggalmu.</p>'
        : `<p class="text-xs leading-5 text-ink/55">UMR wilayah: ${formatCurrency(job.regionalMinimumWage)} · <span class="font-bold ${job.salary >= job.regionalMinimumWage ? 'text-forest' : 'text-coral'}">${job.salary >= job.regionalMinimumWage ? 'di atas' : 'di bawah'} standar</span></p>`;
    const budgetNote = job.monthlyExpenses
        ? `<div class="mt-3 rounded-xl bg-canvas px-3 py-2.5"><p class="text-[11px] font-semibold uppercase tracking-wide text-ink/45">Estimasi sisa setelah biaya rutin</p><p class="mt-0.5 text-sm font-extrabold ${savings >= 0 ? 'text-forest' : 'text-coral'}">${formatCurrency(savings)}<span class="ml-1 text-[11px] font-medium text-ink/45">/ bulan</span></p></div>`
        : '<div class="mt-3 rounded-xl bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-900">Remote: biaya bulanan dan potensi tabungan bergantung pada kota tempat tinggalmu.</div>';
    return `<article class="flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
        <div class="flex items-start justify-between gap-3"><div><p class="text-xs font-bold text-forest">${escapeHtml(job.company)}</p><h4 class="mt-1 font-display text-lg font-extrabold leading-snug">${escapeHtml(job.title)}</h4></div>${isHot ? '<span class="shrink-0 rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-extrabold text-coral">HOT</span>' : ''}</div>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink/55"><span>${escapeHtml(job.location)}</span><span>·</span><span>${escapeHtml(job.type)}</span><span>·</span><span>${new Date(`${job.postedDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
        <div class="mt-4 flex items-center justify-between gap-3"><p class="font-display text-lg font-extrabold">${formatCurrency(job.salary)}<span class="ml-1 text-xs font-medium text-ink/45">/ bln</span></p>${lifestyleBadge(job.lifestyleTier)}</div>
        <div class="mt-2">${wageComparison}</div>${budgetNote}
        <div class="mt-3 flex flex-wrap gap-1.5">${(job.skills || []).map((skill) => `<span class="rounded-md border border-line px-2 py-1 text-[11px] text-ink/65">${escapeHtml(skill)}</span>`).join('')}</div>
        <button class="mt-5 w-full rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white transition hover:bg-ink" type="button" data-add-kind="job" data-add-id="${job.id}">+ Simpan ke keranjang</button>
    </article>`;
}

export function renderLivingCostCalculator(job, livingCost) {
    if (!job || !livingCost) {
        return '<p class="rounded-xl bg-canvas p-4 text-sm text-ink/60">Pilih lowongan dan kota domisili untuk melihat estimasi.</p>';
    }

    const expenses = livingCost.monthlyExpenses;
    const totalExpenses = expenseTotal(expenses);
    const remaining = job.salary - totalExpenses;
    const expenseRows = [
        ['Makan', expenses.food],
        ['Transportasi', expenses.transport],
        ['Utilitas & internet', expenses.utilitiesAndInternet],
        ['Hiburan', expenses.entertainment]
    ];

    return `<div class="rounded-2xl bg-canvas p-4 sm:p-5">
        <div class="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
            <div><p class="text-xs font-semibold text-ink/50">${escapeHtml(job.title)} · ${escapeHtml(livingCost.location)}</p><p class="mt-1 text-sm font-semibold">Gaji bulanan</p></div>
            <p class="font-display text-lg font-extrabold">${formatCurrency(job.salary)}</p>
        </div>
        <dl class="space-y-2 py-4 text-sm">${expenseRows.map(([label, amount]) => `<div class="flex justify-between gap-4"><dt class="text-ink/60">${label}</dt><dd class="font-semibold">${formatCurrency(amount)}</dd></div>`).join('')}
            <div class="flex justify-between gap-4 border-t border-line pt-3"><dt class="font-bold">Total biaya hidup</dt><dd class="font-extrabold">${formatCurrency(totalExpenses)}</dd></div>
        </dl>
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3">
            <p class="text-sm font-bold">Estimasi sisa gaji</p>
            <p class="font-display text-xl font-extrabold ${remaining >= 0 ? 'text-forest' : 'text-coral'}">${formatCurrency(remaining)}<span class="ml-1 text-xs font-medium text-ink/45">/ bulan</span></p>
        </div>
    </div>`;
}

export function renderPropertyCard(property) {
    const featured = ['Jakarta Selatan', 'Bali'].includes(property.location);
    return `<article class="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-soft">
        <div class="relative flex h-28 items-end justify-between bg-[radial-gradient(circle_at_80%_20%,rgba(212,239,104,.9),transparent_30%),linear-gradient(135deg,#dbe8dc,#b8d0c0)] p-4"><span class="rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-forest">${escapeHtml(property.type)}</span>${featured ? '<span class="rounded-full bg-forest px-3 py-1 text-xs font-bold text-lime">✦ FEATURED</span>' : ''}<span class="absolute bottom-3 right-4 text-4xl" aria-hidden="true">⌂</span></div>
        <div class="flex flex-1 flex-col p-5"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold text-ink/50">${escapeHtml(property.location)} · ${escapeHtml(property.certification)}</p><h4 class="mt-1 font-display text-lg font-extrabold leading-snug">${escapeHtml(property.title)}</h4></div>${lifestyleBadge(property.lifestyleTier)}</div>
        <p class="mt-3 line-clamp-2 text-sm leading-5 text-ink/60">${escapeHtml(property.description)}</p>
        <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-y border-line py-3 text-xs font-semibold text-ink/65"><span>${property.landArea} m² tanah</span><span>${property.buildingArea} m² bangunan</span><span>${property.bedrooms} kamar tidur</span></div>
        <div class="mt-4 flex items-end justify-between gap-3"><div><p class="text-[11px] font-bold uppercase tracking-wide text-ink/40">Harga</p><p class="mt-0.5 font-display text-lg font-extrabold">${formatCurrency(property.price)}</p><p class="text-xs text-ink/50">Sewa ${formatCurrency(property.monthlyRent)}/bln</p></div><button class="rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white transition hover:bg-ink" type="button" data-add-kind="property" data-add-id="${property.id}">+ Simpan</button></div></div>
    </article>`;
}

export function renderCart(cart) {
    if (!cart.length) return '<div class="py-10 text-center"><p class="font-display text-lg font-extrabold">Keranjang masih kosong</p><p class="mt-2 text-sm text-ink/55">Simpan pekerjaan atau properti untuk membandingkannya nanti.</p></div>';
    return cart.map((item) => `<article class="flex items-start justify-between gap-3 rounded-xl border border-line p-4"><div class="min-w-0"><p class="text-[11px] font-bold uppercase tracking-wide text-forest">${item.kind === 'job' ? 'Pekerjaan' : 'Properti'}</p><h3 class="mt-1 truncate text-sm font-extrabold">${escapeHtml(item.title)}</h3><p class="mt-1 text-xs text-ink/55">${escapeHtml(item.subtitle)} · ${formatCurrency(item.price)}${item.kind === 'job' ? '/bln' : ''}</p></div><button class="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-coral hover:bg-rose-50" type="button" data-remove-key="${escapeHtml(item.key)}">Hapus</button></article>`).join('');
}
