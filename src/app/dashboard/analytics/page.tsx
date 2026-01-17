import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsContent } from "./analytics-content";

export const metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user?.role !== "admin") {
    redirect("/dashboard/registros");
  }

  return (
    <div>
      <AnalyticsContent />
    </div>
  );
}
