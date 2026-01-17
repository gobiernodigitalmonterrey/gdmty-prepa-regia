import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegistroForm } from "./registro-form";

export default async function NuevoRegistroPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Nuevo Registro</h1>
      <div className="flex justify-center">
        <RegistroForm />
      </div>
    </div>
  );
}
