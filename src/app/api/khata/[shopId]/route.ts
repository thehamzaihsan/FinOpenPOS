import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  const supabase = createClient();

  // Authenticate the user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch the total number of products for the authenticated user
    const { data: khataData, error: khataError } = await supabase
      .from("khata")
      .select(
        `
    *,
    shops (name)
  `
      )
      .eq("user_uid", user.id)
      .eq("shop_id", params.shopId);

    if (khataError) {
      console.error("Error fetching khata data:", khataError);
      return;
    }
    const { data: balanceData, error: balanceError } = await supabase
      .from("shop_balances")
      .select("total_balance")
      .eq("shop_id", params.shopId);

    if (balanceError) {
      console.error("Error fetching balance data:", balanceError);
      return;
    }
    const combinedData = khataData.map((khataItem) => ({
      ...khataItem,
      total_balance: balanceData[0]?.total_balance || null, // Use the first match or default to null
    }));

    console.log("Combined Data:", combinedData);
    // Return the counttotalExpensestotalExpenses of products
    return NextResponse.json(combinedData);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
