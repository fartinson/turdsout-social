import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NewPostClient } from "./NewPostClient";
import { routes } from "@/lib/routes";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(routes.signIn);

  return <NewPostClient />;
}
