const USERNAME_KEY = "geotest:username";

export function getSignedInUsername(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(USERNAME_KEY);
}

export function setSignedInUsername(username: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERNAME_KEY, username);
  window.dispatchEvent(new Event("geotest:auth"));
}

export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USERNAME_KEY);
  window.dispatchEvent(new Event("geotest:auth"));
}
