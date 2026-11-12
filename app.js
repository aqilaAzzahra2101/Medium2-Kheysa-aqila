import { loadMarketplaceData, enrichJob, enrichProperty } from './modules/data.js';
import { CART_KEY, readCart, writeCart } from './modules/storage.js';
import { renderJobCard, renderPropertyCard, renderLivingCostCalculator, renderCart, formatCurrency, escapeHtml } from './modules/ui.js';

const byId = (id) => document.getElementById(id);
const state = { jobs: [], properties: [], livingCosts: [], cart: [] };

function isHotJob(job) {
	const postedAt = new Date(`${job.postedDate}T00:00:00`);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const ageInDays = (today - postedAt) / 86400000;
	return Number.isFinite(ageInDays) && ageInDays >= 0 && ageInDays < 3;
}

function getVisibleJobs() {
	const type = byId('job-type').value;
	const workMode = byId('job-work-mode').value;
	const location = byId('job-location').value;
	const lifestyle = byId('job-lifestyle').value;
	const sort = byId('job-sort').value;
	return state.jobs.filter((job) => {
		const matchesType = !type || job.type === type;
		const matchesWorkMode = !workMode || (workMode === 'remote' ? job.location === 'Remote' : job.location !== 'Remote');
		const matchesLocation = !location || job.location === location;
		return matchesType && matchesWorkMode && matchesLocation && (!lifestyle || job.lifestyleTier === lifestyle) && (!byId('job-hot').checked || isHotJob(job));
	}).sort((first, second) => {
		if (sort === 'salary-asc') return first.salary - second.salary;
		const direction = sort === 'date-asc' ? 1 : -1;
		return direction * (new Date(first.postedDate) - new Date(second.postedDate));
	});
}

function getVisibleProperties() {
	const type = byId('property-type').value;
	const certification = byId('property-cert').value;
	const lifestyle = byId('property-lifestyle').value;
	const sort = byId('property-sort').value;
	return state.properties.filter((property) => {
		const isFeaturedLocation = ['Jakarta Selatan', 'Bali'].includes(property.location);
		return (!type || property.type === type)
			&& (!certification || property.certification === certification)
			&& (!lifestyle || property.lifestyleTier === lifestyle)
			&& (!byId('property-featured').checked || isFeaturedLocation);
	}).sort((first, second) => {
		if (sort === 'price-desc') return second.price - first.price;
		if (sort === 'land-desc') return second.landArea - first.landArea;
		if (sort === 'bedrooms-desc') return second.bedrooms - first.bedrooms;
		return first.price - second.price;
	});
}

function renderJobs() {
	const jobs = getVisibleJobs();
	byId('jobs-list').innerHTML = jobs.length
		? jobs.map((job) => renderJobCard(job, isHotJob(job))).join('')
		: '<div class="rounded-2xl border border-dashed border-line bg-white px-5 py-10 text-center text-sm text-ink/60 md:col-span-2 xl:col-span-3">Tidak ada lowongan yang cocok. Hot Jobs akan muncul saat data memuat posting 3 hari terakhir.</div>';
	byId('job-count').textContent = `${jobs.length} lowongan`;
}

function renderProperties() {
	const properties = getVisibleProperties();
	byId('properties-list').innerHTML = properties.length
		? properties.map((property) => renderPropertyCard(property)).join('')
		: '<div class="rounded-2xl border border-dashed border-line bg-white px-5 py-10 text-center text-sm text-ink/60 md:col-span-2 xl:col-span-3">Belum ada properti yang cocok dengan filter ini.</div>';
	byId('property-count').textContent = `${properties.length} properti`;
}

function renderCartContents() {
	byId('cart-count').textContent = state.cart.length;
	byId('cart-items').innerHTML = renderCart(state.cart);
}

function populateLivingCalculator() {
    const jobSelect = byId('calculator-job');
    const locationSelect = byId('calculator-location');
    jobSelect.replaceChildren(new Option('Pilih lowongan', ''));
    locationSelect.replaceChildren(new Option('Pilih kota domisili', ''));

    state.jobs.forEach((job) => {
        jobSelect.add(new Option(`${job.title} — ${formatCurrency(job.salary)}/bln`, String(job.id)));
    });
    state.livingCosts.forEach((entry) => {
        locationSelect.add(new Option(entry.location, entry.location));
    });
    if (state.jobs.length) jobSelect.selectedIndex = 1;
    if (state.livingCosts.length) locationSelect.selectedIndex = 1;
    renderLivingCalculator();
}

function renderLivingCalculator() {
    const selectedJob = state.jobs.find((job) => job.id === Number(byId('calculator-job').value));
    const selectedLocation = state.livingCosts.find((entry) => entry.location === byId('calculator-location').value);
    byId('calculator-result').innerHTML = renderLivingCostCalculator(selectedJob, selectedLocation);
}

function addToCart(kind, id) {
	const collection = kind === 'job' ? state.jobs : state.properties;
	const item = collection.find((entry) => entry.id === Number(id));
	if (!item) return;
	const key = `${kind}-${item.id}`;
	if (state.cart.some((cartItem) => cartItem.key === key)) {
		showToast('Item ini sudah ada di keranjang.');
		return;
	}
	state.cart.push({ key, kind, id: item.id, title: item.title, subtitle: kind === 'job' ? item.company : item.location, price: kind === 'job' ? item.salary : item.price });
	try {
		writeCart(state.cart);
		renderCartContents();
		showToast('Ditambahkan ke keranjang.');
	} catch (error) {
		state.cart.pop();
		console.error('Keranjang gagal disimpan:', error);
		showToast('Keranjang tidak dapat disimpan di browser ini.');
	}
}

function showToast(message) {
	const toast = byId('toast');
	toast.textContent = message;
	toast.classList.remove('translate-y-4', 'opacity-0');
	toast.classList.add('translate-y-0', 'opacity-100');
	window.clearTimeout(showToast.timeoutId);
	showToast.timeoutId = window.setTimeout(() => {
		toast.classList.add('translate-y-4', 'opacity-0');
		toast.classList.remove('translate-y-0', 'opacity-100');
	}, 2200);
}

function showLoadError(error) {
	console.error('Data marketplace gagal dimuat:', error);
	const message = escapeHtml(error.message || 'Terjadi kesalahan yang tidak diketahui.');
	document.querySelector('main').innerHTML = `<section class="mx-auto mt-16 max-w-xl rounded-2xl border border-coral/30 bg-white p-7 shadow-soft"><p class="text-xs font-bold uppercase tracking-widest text-coral">Data belum tersedia</p><h1 class="mt-2 font-display text-2xl font-extrabold">Halaman tidak dapat dimuat</h1><p class="mt-3 text-sm leading-6 text-ink/65">${message} Pastikan halaman dibuka melalui server lokal agar file JSON dapat diakses, lalu muat ulang.</p><button class="mt-5 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white" onclick="location.reload()">Coba lagi</button></section>`;
}

function bindEvents() {
	['job-type', 'job-work-mode', 'job-location', 'job-lifestyle', 'job-sort', 'job-hot'].forEach((id) => byId(id).addEventListener('change', renderJobs));
	['property-type', 'property-cert', 'property-lifestyle', 'property-sort', 'property-featured'].forEach((id) => byId(id).addEventListener('change', renderProperties));
	['calculator-job', 'calculator-location'].forEach((id) => byId(id).addEventListener('change', renderLivingCalculator));
	document.addEventListener('click', (event) => {
		const button = event.target.closest('[data-add-kind]');
		if (button) addToCart(button.dataset.addKind, button.dataset.addId);
		const removeButton = event.target.closest('[data-remove-key]');
		if (removeButton) {
			const nextCart = state.cart.filter((item) => item.key !== removeButton.dataset.removeKey);
			try {
				writeCart(nextCart);
				state.cart = nextCart;
				renderCartContents();
			} catch (error) {
				console.error('Perubahan keranjang gagal disimpan:', error);
				showToast('Perubahan keranjang gagal disimpan.');
			}
		}
	});
	byId('cart-open').addEventListener('click', () => byId('cart-dialog').showModal());
	byId('cart-close').addEventListener('click', () => byId('cart-dialog').close());
	byId('cart-dialog').addEventListener('click', (event) => {
		if (event.target === byId('cart-dialog')) byId('cart-dialog').close();
	});
	window.addEventListener('pageshow', () => {
		state.cart = readCart();
		renderCartContents();
	});
	window.addEventListener('storage', (event) => {
		if (event.key === CART_KEY || event.key === null) {
			state.cart = readCart();
			renderCartContents();
		}
	});
}

async function initialize() {
	try {
		const data = await loadMarketplaceData();
		state.jobs = data.jobs.map((job) => enrichJob(job, data.livingCosts));
		state.properties = data.properties.map((property) => enrichProperty(property, data.livingCosts));
		state.livingCosts = data.livingCosts;
		state.cart = readCart();
		byId('job-total').textContent = state.jobs.length;
		byId('property-total').textContent = state.properties.length;
		bindEvents();
		populateLivingCalculator();
		renderJobs();
		renderProperties();
		renderCartContents();
	} catch (error) {
		showLoadError(error);
	}
}

initialize();
