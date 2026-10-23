
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const services = `
London Cert Experts provides electrical and fire compliance services.
EICR: 1-3 bedrooms £90; 4-5 bedrooms £100; above 5 bedrooms £120.
Commercial EICR: £120 for 12 circuits, then £5 for each additional circuit.
Fire Alarm Certificate: 1-3 alarms £60; 4-6 £70; 7-12 £80.
Emergency Light Certificate: 1-3 circuits £50; 4-6 £60; 7-10 £70.
EPC: studio £80; 1 bedroom £90; 2-3 bedrooms £100; 4-5 bedrooms £110;
6-7 bedrooms £120; 7+ bedroom HMO £130.
Fire Risk Assessment: studio £90; 1-3 bedrooms £120; 4 bedrooms £130;
5 bedrooms £140; 6 bedrooms £150; communal property £110.
Gas Safety: 1-2 appliances £60; 3 £70; 4 £80; 5 £90.
PAT Testing: up to 12 items £40, each additional item £1.
10% multi-service discount applies when 2 or more distinct services are
selected and at least one is EICR or Fire Risk Assessment (FRA).
Contact email: info@londoncertexperts.co.uk.
Never claim an appointment is confirmed; bookings require team confirmation.
Never invent prices or claim that an inspection or certificate has been completed.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, {
      status: 405, headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length > 1000) {
      return Response.json({ error: "Enter a message up to 1000 characters." }, {
        status: 400, headers: corsHeaders
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "AI service is not configured." }, {
        status: 503, headers: corsHeaders
      });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `You are the polite customer-support assistant for London Cert Experts.
Answer clearly in the customer's language. Use only these verified service details:
${services}
Do not request payment card details, passwords or sensitive identity documents.
Do not claim you have made a booking. Direct customers to the website booking form
or info@londoncertexperts.co.uk for a quote or human help.`
          },
          { role: "user", content: message }
        ],
        max_tokens: 350,
        temperature: 0.3
      })
    });

    if (!aiResponse.ok) {
      return Response.json({ error: "AI provider temporarily unavailable." }, {
        status: 502, headers: corsHeaders
      });
    }

    const data = await aiResponse.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("Empty AI response");
    }

    return Response.json({ reply: reply.slice(0, 5000) }, {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch {
    return Response.json({ error: "Unable to process this message." }, {
      status: 500, headers: corsHeaders
    });
  }
});
