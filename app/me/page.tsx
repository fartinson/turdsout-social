import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileEditorClient } from "./ProfileEditorClient";
import { routes } from "@/lib/routes";

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  async function logout() {
    "use server";
    await signOut({ redirectTo: routes.home });
  }

  return (
    <>
      <ProfileEditorClient />
      <form action={logout} className="mx-auto w-full max-w-xl px-6 pb-12">
        <button
          type="submit"
          className="border-border text-danger bg-surface hover:bg-surface/60 inline-flex w-full cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold"
        >
          Log out
        </button>
      </form>
    </>
  );
}
