import { createStorage } from 'unstorage';
import indexedDbDriver from 'unstorage/drivers/indexedb';
import { browser } from '$app/environment';

const setupStorage = (base: string) => {
	if (!browser) return null;

	return createStorage({
		driver: indexedDbDriver({ base: `zipper_app_${base}` })
	});
};

type StorageEntry<T> = {
	data: T;
	timestamp: number;
};

const storageManager = ({ base, cacheDuration }: { base: string; cacheDuration?: number }) => {
	const storage = setupStorage(base);

	const get = async <T>(key: string): Promise<T | null> => {
		if (!storage) return null;

		try {
			const entry = await storage.getItem<StorageEntry<T>>(key);
			if (!entry) return null;

			if (!cacheDuration) {
				return entry.data;
			}

			const isValid = Date.now() - entry.timestamp < cacheDuration;

			if (!isValid) {
				await storage.removeItem(key);
				return null;
			}

			return entry.data;
		} catch (error) {
			console.warn(`Cache get failed for ${key}:`, error);
			return null;
		}
	};

	const set = async <T>(key: string, data: T) => {
		if (!storage) return;

		try {
			await storage.setItemRaw(key, {
				data,
				timestamp: Date.now()
			});
		} catch (error) {
			console.warn(`Cache set failed for ${key}:`, error);
		}
	};

	const clear = async (key?: string) => {
		if (!storage) return;

		try {
			if (key) {
				await storage.removeItem(key);
			} else {
				await storage.clear();
			}
		} catch (error) {
			console.warn(`Cache clear failed for ${key}:`, error);
		}
	};

	const lastUpdated = async <T>(key: string): Promise<number | null> => {
		if (!storage) return null;
		const entry = await storage.getItem<StorageEntry<T>>(key);
		return entry?.timestamp ?? null;
	};

	return {
		get,
		set,
		clear,
		lastUpdated
	};
};

export { storageManager };
