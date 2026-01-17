import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Iniciar Sesión",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <img src="/mty_gdm_logo_comp.svg" alt="Logo" className="h-24 mb-8" />
      <LoginForm />
    </main>
  );
}
