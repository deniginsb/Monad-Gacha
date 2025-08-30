"use client";
import AdminPanel from "../../../components/AdminPanel";
import { Address } from "viem";

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as Address;

export default function AdminPage() {
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <AdminPanel vault={VAULT_ADDRESS} />
    </main>
  );
}

