
(() => {
  const $ = id => document.getElementById(id);
  const message = $("message");
  const authPanel = $("authPanel");
  const dashboard = $("dashboard");
  let supabase;
  let isSignup = false;
  let currentUser;
  let properties = [];

  function say(text) {
    message.textContent = text;
  }

  function configured() {
    const c = window.LCE_CONFIG;
    return c && c.SUPABASE_URL.startsWith("https://") &&
      c.SUPABASE_KEY.length > 20 &&
      !c.SUPABASE_URL.includes("_HERE") &&
      !c.SUPABASE_KEY.includes("_HERE");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;",
      '"':"&quot;", "'":"&#39;"
    })[c]);
  }

  function setBusy(button, busy, text) {
    button.disabled = busy;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = text || "Please wait…";
    } else {
      button.textContent = button.dataset.originalText || text || "Submit";
    }
  }

  function showLoggedOut() {
    currentUser = null;
    authPanel.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }

  async function showLoggedIn(user) {
    currentUser = user;
    $("signedInAs").textContent = "Signed in as " + user.email;
    authPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await loadProperties();
    await loadDocuments();
  }

  function fillPropertySelect() {
    const select = $("documentProperty");
    select.replaceChildren(new Option(
      properties.length ? "Choose a property" : "Save a property first", ""
    ));
    properties.forEach(p => {
      select.add(new Option(p.property_name + " — " + p.postcode, p.id));
    });
  }

  async function loadProperties() {
    const { data, error } = await supabase
      .from("client_properties")
      .select("id,property_name,property_address,postcode,service_type,notes,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    properties = data || [];
    fillPropertySelect();

    $("propertiesList").innerHTML = properties.length
      ? properties.map(p => `
        <div class="doc">
          <strong>${escapeHtml(p.property_name)}</strong>
          <p>${escapeHtml(p.property_address)}</p>
          <small>${escapeHtml(p.postcode)} · ${escapeHtml(p.service_type)}</small>
        </div>`).join("")
      : "No properties saved yet. Add your first property above.";
  }

  async function loadDocuments() {
    const { data, error } = await supabase
      .from("client_documents")
      .select("id,property_id,document_type,file_name,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    const docs = data || [];

    if (!docs.length) {
      $("documentsList").textContent = "No documents uploaded yet.";
      return;
    }

    $("documentsList").innerHTML = docs.map(d => `
      <div class="doc">
        <strong>${escapeHtml(d.document_type)}</strong>
        <p>${escapeHtml(d.file_name)}</p>
        <small>${escapeHtml(new Date(d.created_at).toLocaleString())}</small>
        <div class="row"><button type="button" data-download="${escapeHtml(d.id)}">View / download</button></div>
      </div>`).join("");

    $("documentsList").querySelectorAll("[data-download]").forEach(button => {
      button.addEventListener("click", () => downloadDocument(button.dataset.download));
    });
  }

  async function downloadDocument(documentId) {
    say("Preparing a private document link…");
    const { data: doc, error } = await supabase
      .from("client_documents")
      .select("storage_path,file_name")
      .eq("id", documentId)
      .single();

    if (error) {
      say("Could not access this document. " + error.message);
      return;
    }

    const { data, error: storageError } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(doc.storage_path, 60);

    if (storageError) {
      say("Could not create a private link. " + storageError.message);
      return;
    }

    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open private document: " + doc.file_name;
    message.replaceChildren(document.createTextNode("Private link created. "));
    message.appendChild(link);
  }

  async function init() {
    if (!configured()) {
      $("setupWarning").classList.remove("hidden");
      showLoggedOut();
      say("Setup required: add your Supabase Project URL and publishable key in config.js.");
      $("authSubmit").disabled = true;
      $("toggleSignup").disabled = true;
      return;
    }

    if (!window.supabase || !window.supabase.createClient) {
      say("Supabase library did not load. Check your internet connection and refresh.");
      return;
    }

    supabase = window.supabase.createClient(
      window.LCE_CONFIG.SUPABASE_URL,
      window.LCE_CONFIG.SUPABASE_KEY
    );

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      say("Could not check login session: " + error.message);
      return;
    }

    if (data.session) {
      try {
        await showLoggedIn(data.session.user);
        say("You are logged in. Your account data is loaded.");
      } catch (e) {
        say("Could not load account data: " + e.message);
      }
    } else {
      showLoggedOut();
      say("Log in or create a client account to continue.");
    }

    supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(async () => {
        if (session && !currentUser) {
          try {
            await showLoggedIn(session.user);
            say("You are logged in.");
          } catch (e) {
            say("Could not load your dashboard: " + e.message);
          }
        } else if (!session) {
          showLoggedOut();
        }
      }, 0);
    });
  }

  $("toggleSignup").addEventListener("click", () => {
    isSignup = !isSignup;
    $("authHeading").textContent = isSignup ? "Create client account" : "Client login";
    $("authDescription").textContent = isSignup
      ? "Register with your email and create a password."
      : "Sign in to access your account and documents.";
    $("authSubmit").textContent = isSignup ? "Create account" : "Log in";
    $("toggleSignup").textContent = isSignup ? "Back to login" : "Create account";
    $("password").setAttribute("autocomplete", isSignup ? "new-password" : "current-password");
  });

  $("authForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!supabase) return say("Configure Supabase before logging in.");

    const button = $("authSubmit");
    setBusy(button, true, isSignup ? "Creating account…" : "Logging in…");

    try {
      const email = $("email").value.trim();
      const password = $("password").value;

      const result = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) throw result.error;

      if (isSignup && !result.data.session) {
        say("Account request submitted. Check your email for the verification link, then return here to log in.");
      } else if (result.data.user) {
        await showLoggedIn(result.data.user);
        say(isSignup ? "Account created and logged in." : "Login successful.");
      }
    } catch (error) {
      say("Authentication failed: " + error.message);
    } finally {
      setBusy(button, false);
    }
  });

  $("propertyForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentUser) return say("Please log in again.");

    const button = event.submitter;
    setBusy(button, true, "Saving property…");

    try {
      const row = {
        user_id: currentUser.id,
        property_name: $("propertyName").value.trim(),
        property_address: $("propertyAddress").value.trim(),
        postcode: $("propertyPostcode").value.trim(),
        service_type: $("serviceType").value,
        notes: $("propertyNotes").value.trim()
      };

      const { error } = await supabase.from("client_properties").insert(row);
      if (error) throw error;

      $("propertyForm").reset();
      await loadProperties();
      say("Property details saved to your client account.");
    } catch (error) {
      say("Could not save property: " + error.message);
    } finally {
      setBusy(button, false);
    }
  });

  $("uploadForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentUser) return say("Please log in again.");

    const file = $("documentFile").files[0];
    const propertyId = $("documentProperty").value;
    const documentType = $("documentType").value;
    if (!file || !propertyId || !documentType) {
      return say("Choose a property, document type and file.");
    }
    if (file.size > 10 * 1024 * 1024) {
      return say("File is larger than 10 MB. Choose a smaller file.");
    }

    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      return say("Only PDF, JPG and PNG files are supported.");
    }

    const button = $("uploadButton");
    setBusy(button, true, "Uploading securely…");
    let uploadedPath = null;

    try {
      const extension = file.name.split(".").pop().toLowerCase();
      const safeName = crypto.randomUUID() + "." + extension;
      const path = currentUser.id + "/" + safeName;

      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(path, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;
      uploadedPath = path;

      const { error: insertError } = await supabase
        .from("client_documents")
        .insert({
          user_id: currentUser.id,
          property_id: propertyId,
          document_type: documentType,
          file_name: file.name,
          storage_path: path,
          mime_type: file.type,
          file_size: file.size
        });

      if (insertError) throw insertError;

      $("uploadForm").reset();
      fillPropertySelect();
      await loadDocuments();
      say("Document uploaded and saved to your account.");
    } catch (error) {
      // If metadata failed, remove the uploaded file to avoid an orphan.
      if (uploadedPath) {
        await supabase.storage.from("client-documents").remove([uploadedPath]);
      }
      say("Upload failed: " + error.message);
    } finally {
      setBusy(button, false);
    }
  });

  $("logout").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) say("Logout failed: " + error.message);
    else {
      showLoggedOut();
      say("You have logged out.");
    }
  });

  init().catch(error => say("Portal error: " + error.message));
})();
