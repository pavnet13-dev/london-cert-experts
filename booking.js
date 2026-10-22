
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-form");
  if (!form) return;

  // Replace both placeholders with your Supabase project details.
  const SUPABASE_URL = https://skibqwqytsgmkmnmtuxn.supabase.co;
  const SUPABASE_PUBLISHABLE_KEY = sb_publishable_7IiW6Q96NxvV3d-6plIsag_eGlN-F0s;

  const message = document.getElementById("form-message");
  const button = document.getElementById("submit-button");
  const dateInput = document.getElementById("date");
  const serviceInput = document.getElementById("service");

  // Prevent selecting a past date in the browser.
  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  dateInput.min = localToday;

  // Preselect the service when the customer arrives from a service page.
  const requestedService = new URLSearchParams(location.search).get("service");
  const allowedServices = [
    "eicr", "fire-alarm", "emergency-lighting", "epc"
  ];

  if (allowedServices.includes(requestedService)) {
    serviceInput.value = requestedService;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.textContent = "";

    if (
      SUPABASE_URL.includes("YOUR_SUPABASE") ||
      SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE")
    ) {
      message.textContent =
        "Booking is not connected yet. Please contact info@londoncertexperts.co.uk.";
      return;
    }

    if (!window.supabase || !window.supabase.createClient) {
      message.textContent =
        "Booking service could not load. Please try again later or email us.";
      return;
    }

    const values = new FormData(form);
    const preferredDate = values.get("preferred_date");

    if (preferredDate < localToday) {
      message.textContent = "Please choose today or a future date.";
      return;
    }

    const client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    const booking = {
      name: String(values.get("name")).trim(),
      email: String(values.get("email")).trim(),
      phone: String(values.get("phone")).trim(),
      service: values.get("service"),
      address: String(values.get("address")).trim(),
      property_type: values.get("property_type"),
      bedrooms: values.get("bedrooms") || null,
      preferred_date: preferredDate,
      preferred_time: values.get("preferred_time"),
      details: String(values.get("details") || "").trim() || null,
      status: "pending"
    };

    if (!booking.name || !booking.email || !booking.phone ||
        !booking.address || !booking.service) {
      message.textContent = "Please complete all required fields.";
      return;
    }

    button.disabled = true;
    button.textContent = "Submitting…";

    try {
      const { error } = await client
        .from("booking_requests")
        .insert(booking);

      if (error) throw error;

      message.textContent =
        "Thank you. Your booking request has been submitted. " +
        "Your appointment is not confirmed until our team contacts you.";

      form.reset();
      dateInput.min = localToday;
    } catch (error) {
      console.error("Booking submission failed:", error);
      message.textContent =
        "We could not submit your request. Please email " +
        "info@londoncertexperts.co.uk or try again later.";
    } finally {
      button.disabled = false;
      button.textContent = "Submit Booking Request ↗";
    }
  });
});
