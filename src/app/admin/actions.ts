"use server";

import { auth, signIn, signOut } from "@/auth";
import { addAllow, listAllow, removeAllow } from "@/lib/easybaby/allowlist";
import { adminListAdvisors, createAdvisor, getAdvisorById, removeAdvisor, updateAdvisor } from "@/lib/easybaby/advisors-repo";
import { deletePhoto, uploadPhoto } from "@/lib/easybaby/photos";
import type { AllowEntry, Advisor } from "@/lib/easybaby/advisors";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function signInGoogle() {
  await signIn("google", { redirectTo: "/admin" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/admin" });
}

// A signed-in user is, by construction, on the allowlist (login is gated on it),
// so a valid session is sufficient authority to manage the allowlist.
async function requireAdmin(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");
  return email;
}

export async function getAllowlistAction(): Promise<AllowEntry[]> {
  await requireAdmin();
  return listAllow();
}

export async function addAllowAction(email: string): Promise<AllowEntry[]> {
  await requireAdmin();
  const em = email.trim().toLowerCase();
  if (!EMAIL_RE.test(em)) throw new Error("Invalid email");
  await addAllow(em);
  return listAllow();
}

export async function removeAllowAction(email: string): Promise<AllowEntry[]> {
  const me = await requireAdmin();
  if (email.toLowerCase() === me.toLowerCase()) throw new Error("Cannot remove self");
  await removeAllow(email);
  return listAllow();
}

// ----- Advisor CRUD (D1) -----

export async function getAdvisorsAdminAction(): Promise<Advisor[]> {
  await requireAdmin();
  return adminListAdvisors();
}

export async function createAdvisorAction(draft: Omit<Advisor, "id">, photo: File | null): Promise<Advisor> {
  await requireAdmin();
  const zdjecie = photo && photo.size > 0 ? await uploadPhoto(photo) : "";
  return createAdvisor({ ...draft, zdjecie });
}

export async function updateAdvisorAction(advisor: Advisor, photo: File | null, removePhoto: boolean): Promise<void> {
  await requireAdmin();
  // Stary klucz bierzemy z bazy (źródło prawdy), nie od klienta.
  const existing = await getAdvisorById(advisor.id);
  const oldKey = existing?.zdjecie || "";

  let newKey = oldKey;
  if (photo && photo.size > 0) {
    newKey = await uploadPhoto(photo);
  } else if (removePhoto) {
    newKey = "";
  }

  await updateAdvisor({ ...advisor, zdjecie: newKey });

  // Sprzątanie R2: usuń stare zdjęcie, jeśli zostało podmienione lub usunięte.
  if (oldKey && oldKey !== newKey) await deletePhoto(oldKey);
}

export async function deleteAdvisorAction(id: string): Promise<void> {
  await requireAdmin();
  const existing = await getAdvisorById(id);
  await removeAdvisor(id);
  if (existing?.zdjecie) await deletePhoto(existing.zdjecie);
}
