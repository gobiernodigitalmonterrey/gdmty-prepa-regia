import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegistrosTable } from "./registros-table";

export const metadata = {
  title: "Registros",
};

export default async function RegistrosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user?.role === "admin";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Registros</h1>
      </div>

      <RegistrosTable isAdmin={isAdmin} />
    </div>
  );
}
