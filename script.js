(function () {
  "use strict";

  /* ---------- tidy address bar: /about.html -> /about, /index.html -> / ---------- */
  try {
    if (/^https?:$/.test(location.protocol) && /\.html$/.test(location.pathname) && !/\/404\.html$/.test(location.pathname)) {
      var clean = location.pathname.replace(/index\.html$/, "").replace(/\.html$/, "");
      history.replaceState(null, "", clean + location.search + location.hash);
    }
  } catch (e) {}

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


  /* ---------- dropdown sub-menus (mobile accordion + keyboard) ---------- */
  var subToggles = document.querySelectorAll(".sub-toggle");
  Array.prototype.forEach.call(subToggles, function (b) {
    b.addEventListener("click", function () {
      var li = b.parentNode;
      var open = li.classList.toggle("open");
      b.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      Array.prototype.forEach.call(document.querySelectorAll(".has-sub.open"), function (li) {
        li.classList.remove("open");
        li.querySelector(".sub-toggle").setAttribute("aria-expanded", "false");
      });
    }
  });

  /* ---------- team profile pop-ups ---------- */
  var openers = document.querySelectorAll("[data-open]");
  Array.prototype.forEach.call(openers, function (el) {
    el.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".plinks a")) { return; }
      var d = document.getElementById(el.getAttribute("data-open"));
      if (d && d.showModal) { d.showModal(); document.body.classList.add("modal-open"); }
      e.stopPropagation();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("dialog.mdl"), function (d) {
    d.addEventListener("click", function (e) {
      if (e.target === d || (e.target.hasAttribute && e.target.hasAttribute("data-close"))) { d.close(); }
    });
    d.addEventListener("close", function () { document.body.classList.remove("modal-open"); });
  });

  /* ---------- scroll reveal, process line, number count-up ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(".sec-head, .svc-card, .four > div, .steps li, .strip, .linklist li, .mosaic figure, .member, .cta-in, .three > div, .row, .proj, .form-card, .info-card, .stats > div, .soft .split > *");
  if ("IntersectionObserver" in window && !reduce) {
    var order = 0, lastParent = null;
    Array.prototype.forEach.call(targets, function (el) {
      if (el.parentNode !== lastParent) { order = 0; lastParent = el.parentNode; }
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(order, 8) * 70 + "ms";
      order++;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        var el = en.target;
        el.classList.add("in");
        if (el.matches(".steps li")) { el.classList.add("lit"); }
        var num = el.querySelector && el.querySelector(".num");
        if (num) { countUp(num); }
        io.unobserve(el);
        if (!el.matches(".steps li")) {
          setTimeout(function () { el.classList.remove("reveal", "in"); el.style.transitionDelay = ""; }, 1400);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll(".steps li"), function (el) { el.classList.add("lit"); });
  }
  function countUp(el) {
    var to = parseInt(el.getAttribute("data-to"), 10);
    if (!to || reduce) { return; }
    var start = null, dur = 1300;
    function step(t) {
      if (start === null) { start = t; }
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) { requestAnimationFrame(step); } else { el.textContent = to; }
    }
    el.textContent = "0";
    requestAnimationFrame(step);
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
