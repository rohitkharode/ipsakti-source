import { supabase } from "@/integrations/supabase/client";

export const AUTH_COOKIE = "ip_sakti_access_token";

export function setAuthCookie(accessToken: string) {
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export async function signOut() {
  await supabase.auth.signOut();
  clearAuthCookie();
}
