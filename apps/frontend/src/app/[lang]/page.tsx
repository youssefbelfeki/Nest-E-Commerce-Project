"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t, localePath } = useI18n();

  useEffect(() => {
    if (!loading && user) {
      router.push(localePath("/products"));
    }
  }, [loading, user, router, localePath]);

  return (
    <section className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center">
      <span className="badge mb-6">{t("home.badge")}</span>
      <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 max-w-3xl">
        {t("home.titleBefore")}{" "}
        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          {t("home.titleHighlight")}
        </span>
      </h1>
      <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
        {t("home.subtitle")}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm pt-4">
        <Link
          href={localePath("/products")}
          className="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          {t("home.exploreCatalog")}
        </Link>
        <Link
          href={localePath("/login")}
          className="btn-secondary w-full sm:w-auto px-8 py-3.5 rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors"
        >
          {t("home.signIn")}
        </Link>
      </div>
    </section>
  );
}