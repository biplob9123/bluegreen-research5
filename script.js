(function () {
  "use strict";

  /* ---------- mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var status = document.getElementById("form-status");
    var params = new URLSearchParams(window.location.search);
    var topic = params.get("topic");
    var select = form.querySelector("select[name=interest]");
    if (topic && select) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].getAttribute("data-key") === topic.toLowerCase()) {
          select.selectedIndex = i;
          break;
        }
      }
    }
    var setStatus = function (msg, cls) {
      status.textContent = msg;
      status.className = "form-status " + (cls || "");
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      if (data.get("botcheck")) { return; }
      var key = form.getAttribute("data-key");
      var email = form.getAttribute("data-email");
      var btn = form.querySelector("button[type=submit]");

      var viaMailClient = function () {
        var body = "Name: " + data.get("name") + "\nEmail: " + data.get("email") +
          "\nPhone: " + (data.get("phone") || "-") + "\nOrganisation: " + (data.get("organisation") || "-") +
          "\nInterested in: " + data.get("interest") + "\n\n" + data.get("message");
        window.location.href = "mailto:" + email + "?subject=" +
          encodeURIComponent("Enquiry: " + data.get("interest")) + "&body=" + encodeURIComponent(body);
        setStatus("Your email app should open with the message ready to send. If it does not, write to " + email + " or message us on WhatsApp.", "ok");
      };

      if (!key || key.indexOf("YOUR_") === 0) { viaMailClient(); return; }

      btn.disabled = true;
      setStatus("Sending…");
      var payload = {
        access_key: key,
        subject: "Website enquiry: " + data.get("interest"),
        from_name: "BlueGreen website",
        name: data.get("name"), email: data.get("email"), phone: data.get("phone"),
        organisation: data.get("organisation"), interest: data.get("interest"), message: data.get("message")
      };
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j.success) {
          form.reset();
          setStatus("Thank you. We have your message and will reply within one working day.", "ok");
        } else { throw new Error(j.message || "failed"); }
      }).catch(function () {
        setStatus("The message could not be sent. Please email " + email + " or message us on WhatsApp.", "err");
      }).finally(function () { btn.disabled = false; });
    });
  }

  /* ---------- footer year ---------- */
  var y = document.getElementById("year");
  if (y) { y.textContent = new Date().getFullYear(); }
})();
