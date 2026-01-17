import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersTable } from "./users-table";

export const metadata = {
  title: "Usuarios",
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user?.role === "admin";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usuarios</h1>
      </div>

      <UsersTable isAdmin={isAdmin} />
    </div>
  );
}
