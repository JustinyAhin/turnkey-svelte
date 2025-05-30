import { browser } from '$app/environment';

const getStorageItem = <T>(key: string): T | null => {
	if (!browser) return null;

	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : null;
	} catch {
		return null;
	}
};

const watchStorageItem = <T>(key: string, callback: (value: T | null) => void) => {
	if (!browser) return () => {};

	const handler = (e: StorageEvent) => {
		if (e.key === key) {
			const newValue = e.newValue ? JSON.parse(e.newValue) : null;
			callback(newValue);
		}
	};

	window.addEventListener('storage', handler);
	return () => window.removeEventListener('storage', handler);
};

const clearStorageItem = (key: string) => {
	if (!browser) return;
	localStorage.removeItem(key);
};

export { getStorageItem, watchStorageItem, clearStorageItem };
