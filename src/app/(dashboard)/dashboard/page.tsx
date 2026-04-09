import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Redirect to role-specific dashboard
  switch (session.user.role) {
    case "admin":
      redirect("/admin");
    case "registrar":
      redirect("/registrar");
    case "parent":
      redirect("/parent");
    default:
      redirect("/login");
  }
}
