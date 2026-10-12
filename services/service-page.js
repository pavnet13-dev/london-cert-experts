
const servicePages = {
  "fire-alarm": {
    title: "Fire Alarm Certification",
    intro: "Fire alarm inspection and system checks appropriate to your property's installation.",
    rows: [["1–3 alarms", "£60"], ["4–6 alarms", "£70"], ["7–12 alarms", "£80"]],
    note: "For systems outside these listed ranges, request confirmation of scope and price."
  },
  "emergency-lighting": {
    title: "Emergency Lighting Certificate",
    intro: "Emergency lighting system checks and relevant test records for your property.",
    rows: [["1–3 circuits", "£50"], ["4–6 circuits", "£60"], ["7–10 circuits", "£70"]],
    note: "Confirm the circuit count and installation scope before booking."
  },
  "epc": {
    title: "Energy Performance Certificate (EPC)",
    intro: "Arrange an energy performance assessment for your property.",
    rows: [["Studio", "£80"], ["1 bedroom", "£90"], ["2–3 bedrooms", "£100"], ["4–5 bedrooms", "£110"], ["6 bedrooms", "£120"], ["7+ bedroom HMO", "£130"]],
    note: "Property details and eligibility should be confirmed before the assessment."
  },
  "fire-risk-assessment": {
    title: "Fire Risk Assessment",
    intro: "Discuss fire hazards, risks and suitable assessment arrangements for your premises.",
    rows: [["Studio", "£90"], ["1–3 bedrooms", "£120"], ["4 bedrooms", "£130"], ["5 bedrooms", "£140"], ["6 bedrooms", "£150"], ["Communal property", "£110"]],
    note: "The final scope depends on the property, communal areas and assessment requirements."
  },
  "gas-safety": {
    title: "Gas Safety",
    intro: "Arrange a gas safety check and discuss the documentation needed for your property.",
    rows: [["1–2 appliances", "£60"], ["3 appliances", "£70"], ["4 appliances", "£80"], ["5 appliances", "£90"]],
    note: "Confirm appliance numbers and the required scope before booking."
  },
  "pat-testing": {
    title: "Portable Appliance Testing (PAT)",
    intro: "Discuss testing arrangements for portable electrical appliances at your premises.",
    rows: [["Up to 12 items", "£40"], ["Each additional item", "£1"]],
    note: "The total depends on the number of appliances included."
  },
  "legionella": {
    title: "Legionella Risk Assessment",
    intro: "Discuss water-system risk assessment requirements for your property.",
    rows: [["Property-specific scope", "Request a quote"]],
    note: "Pricing depends on the water system, property and assessment scope."
  },
  "asbestos": {
    title: "Asbestos Services",
    intro: "Enquire about asbestos survey requirements and suitable next steps for your property.",
    rows: [["Property-specific scope", "Request a quote"]],
    note: "The appropriate survey and price depend on the property and its circumstances."
  }
};

const key = document.body.dataset.service;
const service = servicePages[key];

if (service) {
  document.title = service.title + " | London Cert Experts";
  document.getElementById("serviceTitle").textContent = service.title;
  document.getElementById("serviceIntro").textContent = service.intro;
  document.getElementById("serviceNote").textContent = service.note;
  document.getElementById("priceRows").innerHTML = service.rows.map(row =>
    `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`
  ).join("");
  document.getElementById("bookingLink").href =
    "../booking.html?service=" + encodeURIComponent(key);
}
