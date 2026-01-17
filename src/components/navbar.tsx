"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-24">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <img src="/mty_gdm_logo_iso.svg" alt="Logo" className="h-14 sm:hidden" />
              <img src="/mty_gdm_logo_comp.svg" alt="Logo" className="h-20 hidden sm:block" />
            </Link>
            <div className="hidden sm:flex gap-2">
              <Link
                href="/dashboard/registros"
                className="px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
              >
                Registros
              </Link>
              {session?.user?.role === "admin" && (
                <Link
                  href="/dashboard/analytics"
                  className="px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                >
                  Analytics
                </Link>
              )}
              {session?.user?.role === "admin" && (
                <Link
                  href="/dashboard/users"
                  className="px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                >
                  Usuarios
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Cerrar Sesión
            </Button>
          </div>
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/dashboard/registros"
              className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Registros
            </Link>
            {session?.user?.role === "admin" && (
              <Link
                href="/dashboard/analytics"
                className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Analytics
              </Link>
            )}
            {session?.user?.role === "admin" && (
              <Link
                href="/dashboard/users"
                className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Usuarios
              </Link>
            )}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
