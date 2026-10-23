
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const services = `
London Cert Experts service prices:
EICR: 1-3 bedrooms £90; 4-5 £100; above 5 £120;
commercial £120 for 12 circuits plus £5 per extra circuit.
Fire Alarm Certificate: 1-3 alarms £60; 4-6 £70; 7-12 £80.
Emergency Light Certificate: 1-3 circuits £50; 4-6 £60; 7-10 £70.
EPC: studio £80; 1 bedroom £90; 2-3 £100; 4-5 £110; 6-7 £120; 7+ bedroom HMO £130.
FRA: studio £90; 1-3 bedrooms £120; 4 bedrooms £130; 5 bedrooms £140;
6 bedrooms £150; communal property £110.
Gas Safety: 1-2 appliances £60; 3 £70; 4 £80; 5 £90.
PAT Testing: £40 up to 12 items, then £1 per additional item.
10% discount on 2+ different services when EICR or FRA is included.
Email: info@londoncertexperts.co.uk.
Never claim a booking is confirmed. Ask the customer to submit the website form
or email the team for appointment confirmation.
`;

serve(async (req) => {
  const url = new URL(req.url);

  // Meta uses GET to verify the webhook subscription.
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token && verifyToken && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Webhook verification failed", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const payload = await req.json();
    const entries = payload.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const messages = value.messages || [];

        for (const message of messages) {
          // Only respond to incoming text messages.
          if (message.type !== "text" || !message.from || !message.text?.body) continue;

          const customerWaId = String(message.from);
          const incoming = String(message.text.body).trim().slice(0, 1000);
          if (!incoming) continue;

          const openAiKey = Deno.env.get("OPENAI_API_KEY");
          const waToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
          const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
          const graphVersion = Deno.env.get("WHATSAPP_GRAPH_VERSION") || "v23.0";

          if (!openAiKey || !waToken || !phoneId) {
            console.error("WhatsApp AI secrets are not configured");
            continue;
          }

          const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openAiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini",
              messages: [
                {
                  role: "system",
                  content: `You are the WhatsApp customer support assistant for London Cert Experts.
Be friendly, concise and professional. Reply in the customer's language.
Use only these service details:
${services}
Never claim that an appointment or certificate has been confirmed or issued.
For booking enquiries direct customers to the website booking form.
For human help, give info@londoncertexperts.co.uk.
Do not ask for passwords, payment card details or sensitive identity documents.`
                },
                { role: "user", content: incoming }
              ],
              max_tokens: 250,
              temperature: 0.3
            })
          });

          if (!aiResponse.ok) {
            console.error("AI provider returned an error");
            continue;
          }

          const aiData = await aiResponse.json();
          const reply = aiData.choices?.[0]?.message?.content;
          if (typeof reply !== "string" || !reply.trim()) continue;

          const waResponse = await fetch(
            `https://graph.facebook.com/${graphVersion}/${phoneId}/messages`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${waToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: customerWaId,
                type: "text",
                text: { preview_url: false, body: reply.slice(0, 3500) }
              })
            }
          );

          if (!waResponse.ok) {
            console.error("WhatsApp send failed", await waResponse.text());
          }
        }
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error", error);
    return new Response("Webhook processing error", { status: 500 });
  }
});
