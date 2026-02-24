import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function IndexPage() {
  const session = await auth();

  // If the user is not authenticated, send them to login
  if (!session) {
    redirect("/login");
  }

  // If they are authenticated, send them to the dashboard
  redirect("/dashboard");
}
