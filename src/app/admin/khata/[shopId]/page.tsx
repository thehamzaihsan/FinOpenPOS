import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ShopPage({
  params,
}: {
  params: { shopId: string };
}) {
  return <p>{params.shopId}</p>;
}
