// Funções auxiliares para gerenciar cookies de autenticação
export function setAuthCookie(token: string) {
	// Define cookie com HttpOnly=false para permitir leitura no cliente
	document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
	console.log("🍪 Cookie set successfully");
}

export function getAuthCookie(): string | null {
	if (typeof window === "undefined") return null;

	const cookies = document.cookie.split(";");
	for (const cookie of cookies) {
		const [name, value] = cookie.trim().split("=");
		if (name === "auth-token") {
			return value;
		}
	}
	return null;
}

export function removeAuthCookie() {
	document.cookie =
		"auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
	console.log("🗑️ Cookie removed");
}
