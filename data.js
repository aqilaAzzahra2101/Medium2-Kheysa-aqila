const DATA_FILES = {
    jobs: './datas/jobs.json',
    properties: './datas/house.json',
    livingCosts: './datas/living-cost.json'
};

async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Gagal mengambil ${path} (HTTP ${response.status}).`);
    return response.json();
}

export async function loadMarketplaceData() {
    try {
        const [jobs, properties, livingCosts] = await Promise.all(Object.values(DATA_FILES).map(fetchJson));
        if (!Array.isArray(jobs) || !Array.isArray(properties) || !Array.isArray(livingCosts)) {
            throw new Error('Format data marketplace tidak valid.');
        }
        if (jobs.some((job) => !Number.isFinite(job.id) || !Number.isFinite(job.salary) || !job.postedDate)
            || properties.some((property) => !Number.isFinite(property.id) || !Number.isFinite(property.price) || !property.location)
            || livingCosts.some((entry) => !entry.location || !entry.monthlyExpenses
                || !['food', 'transport', 'utilitiesAndInternet', 'entertainment'].every((field) => Number.isFinite(entry.monthlyExpenses[field]))
                || !entry.lifestyleTier)) {
            throw new Error('Sebagian data tidak memiliki field wajib.');
        }
        return { jobs, properties, livingCosts };
    } catch (error) {
        throw new Error(`Data tidak bisa diproses: ${error.message}`);
    }
}

function findLivingCost(location, livingCosts) {
    return livingCosts.find((entry) => entry.location === location)
        || livingCosts.find((entry) => entry.jobRegionMatch === location)
        || null;
}

export function enrichJob(job, livingCosts) {
    if (job.location === 'Remote') {
        return { ...job, lifestyleTier: 'Flexible', regionalMinimumWage: null, monthlyExpenses: null };
    }
    const livingCost = findLivingCost(job.location, livingCosts);
    return {
        ...job,
        lifestyleTier: livingCost?.lifestyleTier || 'Medium',
        regionalMinimumWage: livingCost?.regionalMinimumWage ?? null,
        monthlyExpenses: livingCost?.monthlyExpenses ?? null
    };
}

export function enrichProperty(property, livingCosts) {
    const livingCost = findLivingCost(property.location, livingCosts);
    return { ...property, lifestyleTier: livingCost?.lifestyleTier || 'Medium' };
}