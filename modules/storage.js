export const CART_KEY = 'ruang-karier-cart-v1';

export function readCart() {
    try {
        const savedCart = localStorage.getItem(CART_KEY);
        if (!savedCart) return [];
        const parsedCart = JSON.parse(savedCart);
        if (!Array.isArray(parsedCart)) return [];
        return parsedCart.filter((item) => item && typeof item.key === 'string' && typeof item.title === 'string');
    } catch (error) {
        console.error('Data keranjang lokal tidak valid:', error);
        return [];
    }
}

export function writeCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
        throw new Error(`Keranjang gagal disimpan: ${error.message}`);
    }
}

