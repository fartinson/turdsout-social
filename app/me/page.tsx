import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileEditorClient } from "./ProfileEditorClient";

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return <ProfileEditorClient />;
}
