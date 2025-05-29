const isJWTExpired = (token: string): boolean => {
	try {
		const payload = JSON.parse(atob(token.split('.')[1]));
		const currentTime = Math.floor(Date.now() / 1000);
		return payload.exp < currentTime;
	} catch (error) {
		console.error('[isJWTExpired] Error decoding JWT:', error);
		return true; // If we can't decode, assume expired
	}
};

export { isJWTExpired };
