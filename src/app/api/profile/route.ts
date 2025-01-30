import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("name, address, phoneNumber")
      .eq("id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No profile found
        return NextResponse.json({ error: "No profile found" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, address, phoneNumber } = await request.json()

    const { error } = await supabase.from("users").upsert({
      id: user.id,
      name,
      address,
      phoneNumber,
    })

    if (error) throw error

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

