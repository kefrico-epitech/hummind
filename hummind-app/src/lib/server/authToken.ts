const COOKIE_NAME = "hm_access";

export function setAuthToken(token: string, days = 30) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function getAuthToken(): string {
    const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : "";
}

export function clearAuthToken() {
    document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
