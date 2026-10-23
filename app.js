
const SERVICES = [
  {id:"EICR", name:"EICR Certificate", icon:"⚡", description:"Electrical Installation Condition Report.", prices:[["1–3 bedrooms",90],["4–5 bedrooms",100],["Above 5 bedrooms",120],["Commercial: first 12 circuits",120]], extra:"Commercial: £5 per circuit after the first 12."},
  {id:"FIRE_ALARM", name:"Fire Alarm Certificate", icon:"♧", description:"Fire alarm system inspection and certification.", prices:[["1–3 alarms",60],["4–6 alarms",70],["7–12 alarms",80]]},
  {id:"EMERGENCY_LIGHT", name:"Emergency Light Certificate", icon:"☼", description:"Emergency lighting inspection and certification.", prices:[["1–3 circuits",50],["4–6 circuits",60],["7–10 circuits",70]]},
  {id:"EPC", name:"Energy Performance Certificate", icon:"⌂", description:"Energy efficiency assessment for your property.", prices:[["Studio",80],["1 bedroom",90],["2–3 bedrooms",100],["4–5 bedrooms",110],["6–7 bedrooms",120],["7+ bedroom HMO",130]]},
  {id:"FRA", name:"Fire Risk Assessment", icon:"♨", description:"Fire risk assessment for residential and communal properties.", prices:[["Studio",90],["1–3 bedrooms",120],["4 bedrooms",130],["5 bedrooms",140],["6 bedrooms",150],["Communal property",110]]},
  {id:"GAS", name:"Gas Safety Certificate", icon:"⌁", description:"Gas safety inspection for applicable appliances.", prices:[["1–2 appliances",60],["3 appliances",70],["4 appliances",80],["5 appliances",90]]},
  {id:"PAT", name:"PAT Testing", icon:"▤", description:"Portable appliance testing for electrical equipment.", prices:[["Up to 12 items",40]], extra:"Additional items: £1 each."}
];

const $ = selector => document.querySelector(selector);
const money = amount => new Intl.NumberFormat("en-GB", {
  style:"currency", currency:"GBP"
}).format(amount);

function renderServices() {
  const grid = $("#serviceGrid");
  const prices = $("#priceList");
  const choices = $("#bookingServiceChoices");
  if (!grid || !prices || !choices) return;

  grid.innerHTML = SERVICES.map(s => `
    <article class="service-card">
      <div class="service-icon" aria-hidden="true">${s.icon}</div>
      <h3>${s.name}</h3>
      <p>${s.description}</p>
      <div class="service-price">From ${money(Math.min(...s.prices.map(p=>p[1])))} <small>/ service</small></div>
      <button type="button" data-select-service="${s.id}">Add to enquiry ↗</button>
    </article>`).join("");

  prices.innerHTML = SERVICES.map(s => `
    <div class="price-row">
      <b>${s.name}</b>
      <span>From ${money(Math.min(...s.prices.map(p=>p[1])))}</span>
    </div>`).join("");

  choices.innerHTML = SERVICES.map(s => `
    <label class="checkbox-option">
      <input type="checkbox" name="services" value="${s.id}">
      <span>${s.name}</span>
    </label>`).join("");
}

function getSelectedServices() {
  return [...document.querySelectorAll('input[name="services"]:checked')]
    .map(input => SERVICES.find(s => s.id === input.value))
    .filter(Boolean);
}

function estimateTotal(selected) {
  // Default estimate uses the lowest published tier for each service.
  // Customer property details may change the actual price.
  const subtotal = selected.reduce((sum, s) =>
    sum + Math.min(...s.prices.map(p => p[1])), 0);
  const eligible = selected.length >= 2 &&
    selected.some(s => s.id === "EICR" || s.id === "FRA");
  const discount = eligible ? subtotal * 0.10 : 0;
  return {subtotal, discount, total:subtotal-discount, eligible};
}

function updateEstimate() {
  const selected = getSelectedServices();
  const result = estimateTotal(selected);
  $("#estimatedTotal").textContent = money(result.total);
  $("#discountMessage").textContent = !selected.length
    ? "Select services to calculate an estimate."
    : result.eligible
      ? `Includes 10% multi-service discount. Before discount: ${money(result.subtotal)}.`
      : "10% off when selecting 2+ services including EICR or FRA.";
}

function showMessage(text, type="") {
  const el = $("#formMessage");
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${type}`;
}

function addChatMessage(text, type) {
  const messages = $("#chatMessages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${type}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function localFAQ(message) {
  const q = message.toLowerCase();
  if (/price|cost|how much|£|discount|cheap/.test(q)) {
    return "Our published starting prices are: EICR £90, Fire Alarm Certificate £60, Emergency Lighting £50, EPC £80, Fire Risk Assessment £90, Gas Safety £60 and PAT Testing £40. Your actual price depends on property details. Select at least two different services, including EICR or FRA, to qualify for 10% off.";
  }
  if (/eicr|electrical installation/.test(q)) {
    return "Our EICR starting prices are £90 for 1–3 bedrooms, £100 for 4–5 bedrooms and £120 above 5 bedrooms. Commercial starts at £120 for 12 circuits, then £5 per additional circuit.";
  }
  if (/fire alarm/.test(q)) {
    return "Fire Alarm Certificate prices: £60 for 1–3 alarms, £70 for 4–6 alarms and £80 for 7–12 alarms.";
  }
  if (/emergency light/.test(q)) {
    return "Emergency Light Certificate prices: £50 for 1–3 circuits, £60 for 4–6 circuits and £70 for 7–10 circuits.";
  }
  if (/\bfra\b|fire risk/.test(q)) {
    return "Fire Risk Assessment starts at £90 for a studio, £120 for 1–3 bedrooms, £130 for 4 bedrooms, £140 for 5 bedrooms, £150 for 6 bedrooms and £110 for communal property.";
  }
  if (/\bepc\b|energy performance/.test(q)) {
    return "EPC prices: studio £80, 1 bedroom £90, 2–3 bedrooms £100, 4–5 bedrooms £110, 6–7 bedrooms £120 and 7+ bedroom HMO £130.";
  }
  if (/gas safety|gas certificate/.test(q)) {
    return "Gas Safety Certificate prices: £60 for 1–2 appliances, £70 for 3, £80 for 4 and £90 for 5 appliances.";
  }
  if (/\bpat\b|portable appliance/.test(q)) {
    return "PAT Testing starts at £40 for up to 12 items, with each additional item priced at £1.";
  }
  if (/book|appointment|slot|date|available/.test(q)) {
    return "You can request an appointment using the online booking form on this page. Your date and time are a request, not a confirmed slot, until our team confirms availability.";
  }
  if (/whatsapp/.test(q)) {
    return "We are preparing WhatsApp AI support. It becomes active after the official WhatsApp Business Platform is configured with a registered business number and secure backend.";
  }
  if (/email|contact|speak|human|team|person/.test(q)) {
    return "You can contact London Cert Experts at info@londoncertexperts.co.uk. Our team can confirm your exact requirements and appointment.";
  }
  return "I can help with EICR, fire alarm certificates, emergency lighting, EPC, Fire Risk Assessments, Gas Safety Certificates, PAT Testing, published prices and booking enquiries. For an exact quote, email info@londoncertexperts.co.uk.";
}

async function askWebsiteAI(message) {
  // Set this to your deployed Supabase Edge Function URL after setup.
  const endpoint = window.LCE_CONFIG?.AI_CHAT_ENDPOINT;
  if (!endpoint) return localFAQ(message);

  try {
    const response = await fetch(endpoint, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message})
    });
    if (!response.ok) throw new Error("AI service unavailable");
    const data = await response.json();
    if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("Invalid AI response");
    return data.reply.slice(0,5000);
  } catch (error) {
    return "Our live AI service is temporarily unavailable. You can still ask basic questions about services and prices, or email info@londoncertexperts.co.uk.";
  }
}

async function saveBooking(payload) {
  // Set this after configuring the Supabase Edge Function.
  const endpoint = window.LCE_CONFIG?.BOOKING_ENDPOINT;
  if (!endpoint) {
    throw new Error("Online booking storage has not been configured yet. Please contact info@londoncertexperts.co.uk.");
  }

  const response = await fetch(endpoint, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });
  const result = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(result.error || "Unable to submit the booking request.");
  return result;
}

document.addEventListener("DOMContentLoaded", () => {
  renderServices();
  $("#year").textContent = new Date().getFullYear();

  const dateInput = $("#preferredDate");
  if (dateInput) dateInput.min = new Date().toISOString().slice(0,10);

  $("#menuToggle").addEventListener("click", () => $("#mainNav").classList.toggle("open"));
  $("#mainNav").addEventListener("click", event => {
    if (event.target.closest("a")) $("#mainNav").classList.remove("open");
  });

  $("#serviceGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-select-service]");
    if (!button) return;
    const checkbox = document.querySelector(`input[name="services"][value="${button.dataset.selectService}"]`);
    checkbox.checked = true;
    updateEstimate();
    $("#booking").scrollIntoView({behavior:"smooth"});
  });

  $("#bookingServiceChoices").addEventListener("change", updateEstimate);

  $("#bookingForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const selected = getSelectedServices();
    if (!selected.length) {
      showMessage("Please select at least one service.", "error");
      return;
    }

    const formData = new FormData(form);
    const total = estimateTotal(selected);
    const payload = {
      name:String(formData.get("name") || "").trim(),
      email:String(formData.get("email") || "").trim(),
      postcode:String(formData.get("postcode") || "").trim().toUpperCase(),
      propertyType:String(formData.get("propertyType") || ""),
      preferredDate:String(formData.get("date") || ""),
      preferredTime:String(formData.get("time") || ""),
      services:selected.map(s=>s.id),
      notes:String(formData.get("notes") || "").trim(),
      estimatedSubtotal:total.subtotal,
      estimatedDiscount:total.discount,
      estimatedTotal:total.total,
      consent:formData.get("consent") === "on"
    };

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Sending request…";
    showMessage("Submitting your enquiry securely…");

    try {
      await saveBooking(payload);
      showMessage("Thank you! Your request has been received. We will follow up by email. This is a request, not a confirmed appointment.", "success");
      form.reset();
      updateEstimate();
    } catch (error) {
      showMessage(error.message || "We couldn't submit your request. Please email info@londoncertexperts.co.uk.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Send booking request ↗";
    }
  });

  $("#chatLauncher").addEventListener("click", () => {
    $("#chatPanel").hidden = false;
    $("#chatInput").focus();
  });
  $("#chatClose").addEventListener("click", () => $("#chatPanel").hidden = true);

  $("#chatForm").addEventListener("submit", async event => {
    event.preventDefault();
    const input = $("#chatInput");
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    addChatMessage(message, "user");
    const pending = addChatMessage("One moment…", "bot");
    const send = event.currentTarget.querySelector("button");
    send.disabled = true;
    try {
      pending.textContent = await askWebsiteAI(message);
    } finally {
      send.disabled = false;
    }
  });

  updateEstimate();
});
