import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import { authApi } from "../lib/api";

/**
 * Auth store — manages user session, tokens, and profiles.
 * Persisted to localStorage for session continuity.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Supabase Native Login ─────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authErr) throw authErr;

          // Fetch Profile from Supabase public.profiles safely
          let { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authData.user.id)
            .maybeSingle();

          // Guarantee profile existence in database
          if (!profile && authData.user) {
            const newProfile = {
              id: authData.user.id,
              email: authData.user.email,
              full_name: authData.user.user_metadata?.full_name || email.split("@")[0],
              role: authData.user.user_metadata?.role || "buyer",
              phone: authData.user.user_metadata?.phone || "",
              avatar_url: authData.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authData.user.email)}`,
              is_verified: true,
              is_active: true,
            };

            const { data: created } = await supabase
              .from("profiles")
              .upsert(newProfile)
              .select("*")
              .maybeSingle();

            profile = created || newProfile;
          }

          if (authData.session?.access_token) {
            localStorage.setItem("access_token", authData.session.access_token);
            localStorage.setItem("refresh_token", authData.session.refresh_token);
          }

          set({
            user: profile,
            session: authData.session,
            isAuthenticated: true,
            isLoading: false,
          });

          return authData;
        } catch (error) {
          const message = error.message || "Login failed";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // ── Supabase Native Register ──────────────────────────────
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { email, password, full_name, role = "buyer", phone } = userData;
          
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name,
                role,
                phone,
                avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name || email)}&background=random`,
              },
            },
          });

          if (authErr) throw authErr;

          // Explicit profile upsert to guarantee profile creation
          if (authData.user) {
            await supabase.from("profiles").upsert({
              id: authData.user.id,
              email: authData.user.email,
              full_name: full_name || email.split("@")[0],
              role: role,
              phone: phone || "",
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name || email)}&background=random`,
              is_active: true,
              is_verified: true,
            });
          }

          set({ isLoading: false });
          return authData;
        } catch (error) {
          const message = error.message || "Registration failed";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // ── Supabase Logout ───────────────────────────────────────
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch {
          // Silent fail on logout
        } finally {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          set({ user: null, session: null, isAuthenticated: false, error: null });
        }
      },

      // ── Auto Restore Supabase Session ─────────────────────────
      restoreSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            let { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();

            if (!profile) {
              profile = {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
                role: session.user.user_metadata?.role || "buyer",
                avatar_url: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email)}`,
                is_verified: true,
                is_active: true,
              };
            }

            set({ user: profile, session, isAuthenticated: true });
          }
        } catch {
          // Ignore if no session
        }
      },

      // ── Fetch Profile ─────────────────────────────────────────
      fetchProfile: async () => {
        try {
          // 1. Try FastAPI backend /auth/me if access token exists
          const token = localStorage.getItem("access_token");
          if (token) {
            try {
              const { data: bProfile } = await authApi.getProfile();
              if (bProfile) {
                set({ user: bProfile, isAuthenticated: true });
                return bProfile;
              }
            } catch {
              // Fall through to Supabase fallback
            }
          }

          // 2. Supabase Session Fallback
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            let { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();

            if (!profile) {
              profile = {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
                role: session.user.user_metadata?.role || "buyer",
                phone: session.user.user_metadata?.phone || "",
                avatar_url: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email)}`,
                is_verified: true,
                is_active: true,
              };
            }

            set({ user: profile, session, isAuthenticated: true });
            return profile;
          }
        } catch (err) {
          console.error("fetchProfile error:", err);
        }
      },

      // ── Update Profile ────────────────────────────────────────
      updateProfile: async (profileData) => {
        const { user } = get();
        if (user?.id) {
          const { data, error } = await supabase
            .from("profiles")
            .update(profileData)
            .eq("id", user.id)
            .select()
            .maybeSingle();

          if (!error && data) {
            set({ user: data });
            return data;
          }
        }
      },

      // ── Clear Error ───────────────────────────────────────────
      clearError: () => set({ error: null }),
    }),
    {
      name: "propverse-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Theme store — manages light/dark/system theme preference.
 */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "system", // "light" | "dark" | "system"

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      initTheme: () => {
        const { theme } = get();
        applyTheme(theme);
      },
    }),
    { name: "propverse-theme" }
  )
);

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  } else {
    root.classList.add(theme);
  }
}

// Listen for system theme changes
if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const { theme } = useThemeStore.getState();
      if (theme === "system") applyTheme("system");
    });
}
