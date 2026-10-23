
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedServices = [
  "EICR", "FIRE_ALARM", "EMERGENCY_LIGHT", "EPC", "FRA", "GAS", "PAT"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const b = await req.json();
    const name = typeof b.name === "string" ? b.name.trim() : "";
    const email = typeof b.email === "string" ? b.email.trim() : "";
    const postcode = typeof b.postcode === "string" ? b.postcode.trim().toUpperCase() : "";
    const date = typeof b.preferredDate === "string" ? b.preferredDate : "";
    const services = Array.isArray(b.services)
      ? b.services.filter((s: unknown) => typeof s === "string" && allowedServices.includes(s))
      : [];

    if (name.length < 2 || name.length > 100) throw new Error("Enter a valid name.");
    if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    if (!postcode || postcode.length > 15) throw new Error("Enter a valid postcode.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < new Date().toISOString().slice(0,10)) {
      throw new Error("Choose a valid future date.");
    }
    if (services.length === 0 || services.length !== new Set(services).size) {
      throw new Error("Select at least one valid service.");
    }
    if (b.consent !== true) throw new Error("Consent is required.");

    // Recalculate prices on the server; do not trust prices sent by the browser.
    const base: Record<string, number> = {
      EICR: 90, FIRE_ALARM: 60, EMERGENCY_LIGHT: 50,
      EPC: 80, FRA: 90, GAS: 60, PAT: 40
    };
    const subtotal = services.reduce((sum: number, s: string) => sum + base[s], 0);
    const eligible = services.length >= 2 && services.some((s: string) => s === "EICR" || s === "FRA");
    const discount = eligible ? Math.round(subtotal * 10) / 100 : 0;
    const total = Math.round((subtotal - discount) * 100) / 100;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Booking service is not configured.");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await supabase.from("booking_requests").insert({
      customer_name: name,
      customer_email: email,
      property_postcode: postcode,
      property_type: String(b.propertyType || "Residential").slice(0, 50),
      preferred_date: date,
      preferred_time: String(b.preferredTime || "").slice(0, 50),
      services,
      notes: String(b.notes || "").slice(0, 2000),
      estimated_subtotal: subtotal,
      estimated_discount: discount,
      estimated_total: total
    }).select("id").single();

    if (error) throw new Error("Unable to save booking request.");

    return Response.json({ ok: true, requestId: data.id }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed.";
    const known = [
      "Enter a valid name.", "Enter a valid email address.",
      "Enter a valid postcode.", "Choose a valid future date.",
      "Select at least one valid service.", "Consent is required."
    ];
    return Response.json(
      { error: known.includes(message) ? message : "Unable to submit your request right now." },
      { status: 400, headers }
    );
  }
});
