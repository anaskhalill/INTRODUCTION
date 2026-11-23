/* =========================================================
   Anas Khalil — Portfolio interactions
   ========================================================= */

(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

  /* -------------------------------------------------------
     Content details
     ------------------------------------------------------- */

  const age = $("#age");

  if (age && age.dataset.dob) {
    const birthday = new Date(age.dataset.dob + "T00:00:00");

    if (!Number.isNaN(birthday.getTime())) {
      const today = new Date();
      let years = today.getFullYear() - birthday.getFullYear();
      const monthDiff = today.getMonth() - birthday.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
        years -= 1;
      }

      age.textContent = years + "-year-old";
    }
  }

  /* -------------------------------------------------------
     Loader
     ------------------------------------------------------- */

  const loader = $("#loader");

  if (loader) {
    const count = $("#loader .count", loader);
    const body = document.body;
    let finished = false;
    let fallbackId = 0;

    body.classList.add("locked");

    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallbackId);
      loader.classList.add("done");
      body.classList.remove("locked");
      window.setTimeout(() => loader.remove(), 1100);
    };

    if (reducedMotion) {
      finish();
    } else {
      fallbackId = window.setTimeout(finish, 2200);
      loader.addEventListener("click", finish);
      window.addEventListener("keydown", finish, { once: true });

      const start = performance.now();
      const duration = 1300;

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(eased * 100);

        count.textContent = String(value).padStart(3, "0") + "%";

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          window.setTimeout(finish, 260);
        }
      };

      requestAnimationFrame(tick);
    }
  }

  /* -------------------------------------------------------
     Custom cursor
     ------------------------------------------------------- */

  const cursor = $(".cur");
  const dot = $(".cur-dot");

  if (finePointer && cursor && dot && !reducedMotion) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    window.addEventListener(
      "mousemove",
      (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        document.body.classList.add("has-cursor");
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", () => {
      document.body.classList.remove("has-cursor");
    });

    const renderCursor = () => {
      cursorX += (mouseX - cursorX) * 0.18;
      cursorY += (mouseY - cursorY) * 0.18;

      cursor.style.transform =
        "translate3d(" + cursorX + "px," + cursorY + "px,0) translate(-50%,-50%)";
      dot.style.transform =
        "translate3d(" + mouseX + "px," + mouseY + "px,0) translate(-50%,-50%)";

      requestAnimationFrame(renderCursor);
    };

    requestAnimationFrame(renderCursor);

    document.addEventListener("mouseover", (event) => {
      const element = event.target instanceof Element ? event.target : null;
      const target = element && element.closest("a, button, .row, .stats > div");
      document.body.classList.toggle("cursor-hover", Boolean(target));
    });
  }

  /* -------------------------------------------------------
     Navigation
     ------------------------------------------------------- */

  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");

  const closeMenu = () => {
    if (!nav || !menuBtn) return;
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    document.body.classList.toggle("locked", Boolean($("#loader")));
  };

  if (nav && menuBtn) {
    menuBtn.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      menuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      document.body.classList.toggle("locked", isOpen || Boolean($("#loader")));
    });

    if (navLinks) {
      $$("a", navLinks).forEach((link) => {
        link.addEventListener("click", closeMenu);
      });
    }

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) closeMenu();
    });

    const progress = $("#scrollProgress");
    const scrollLinks = $$('a[href^="#"]', navLinks || nav)
      .map((link) => ({ link: link, href: link.getAttribute("href") }))
      .filter((item) => item.href && document.getElementById(item.href.slice(1)));

    let scrollTicking = false;

    const updateScrollState = () => {
      scrollTicking = false;
      nav.classList.toggle("scrolled", window.scrollY > 24);

      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const value = max > 0 ? (window.scrollY / max) * 100 : 0;
        progress.style.width = Math.min(100, Math.max(0, value)).toFixed(2) + "%";
      }

      let active = null;

      if (window.scrollY < window.innerHeight * 0.6) {
        active = scrollLinks.find((item) => item.href === "#top");
      }

      if (!active) {
        const line = window.innerHeight * 0.35;
        scrollLinks.forEach((item) => {
          if (item.href === "#top") return;
          const rect = document.getElementById(item.href.slice(1)).getBoundingClientRect();
          if (rect.top <= line && rect.bottom > line) active = item;
        });
      }

      scrollLinks.forEach((item) => {
        if (item === active) item.link.setAttribute("aria-current", "page");
        else item.link.removeAttribute("aria-current");
      });
    };

    const requestScrollUpdate = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
  }

  /* -------------------------------------------------------
     About — word reveal
     ------------------------------------------------------- */

  const bio = $("#bio");

  if (bio) {
    const words = $$("span", bio);

    if (reducedMotion) {
      bio.classList.add("on");
    } else {
      words.forEach((word, index) => {
        word.style.transitionDelay = Math.min(index * 22, 620) + "ms";
      });

      const bioObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              bio.classList.add("on");
              observer.disconnect();
            }
          });
        },
        { threshold: 0.22 }
      );

      bioObserver.observe(bio);
    }
  }

  /* -------------------------------------------------------
     Stats — count up
     ------------------------------------------------------- */

  const stats = $("#stats");

  const setFinalNumber = (element) => {
    const target = parseFloat(element.dataset.n || "0");
    const decimals = parseInt(element.dataset.decimals || "0", 10);
    const pad = parseInt(element.dataset.pad || "0", 10);
    const suffix = element.dataset.suffix || "";

    let text = decimals ? target.toFixed(decimals) : String(Math.round(target));

    if (pad) text = text.padStart(pad, "0");
    if (target >= 1000) text = Number(text).toLocaleString("en-US");

    element.textContent = text + suffix;
  };

  const animateNumber = (element) => {
    const target = parseFloat(element.dataset.n || "0");
    const decimals = parseInt(element.dataset.decimals || "0", 10);
    const pad = parseInt(element.dataset.pad || "0", 10);
    const suffix = element.dataset.suffix || "";
    const duration = 1500;
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;

      let text = decimals ? value.toFixed(decimals) : String(Math.round(value));

      if (pad) text = text.padStart(pad, "0");
      if (target >= 1000) text = Number(text).toLocaleString("en-US");

      element.textContent = text + suffix;

      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  };

  if (stats) {
    const numbers = $$("b", stats);

    if (reducedMotion) {
      numbers.forEach(setFinalNumber);
    } else {
      const statsObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              numbers.forEach(animateNumber);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );

      statsObserver.observe(stats);
    }
  }

  /* -------------------------------------------------------
     Pinned projects
     ------------------------------------------------------- */

  const work = $("#work");
  const pin = $("#pin");

  if (work && pin) {
    const projects = $$(".project", work);
    const current = $("#cur");
    const progressBar = $("#prog");
    const prevButton = $("#prev");
    const nextButton = $("#next");
    const total = projects.length;
    let activeIndex = 0;

    const setActiveProject = (index) => {
      if (index === activeIndex && projects[index].classList.contains("is-active")) {
        return;
      }

      projects.forEach((project, i) => {
        project.classList.toggle("is-active", i === index);
      });

      pin.style.setProperty("--work-bg", projects[index].dataset.bg || "#102b50");
      if (current) current.textContent = String(index + 1).padStart(2, "0");
      activeIndex = index;
    };

    const updateWork = () => {
      const rect = work.getBoundingClientRect();
      const scrollable = work.offsetHeight - window.innerHeight;
      const progress = scrollable > 0 ? (0 - rect.top) / scrollable : 0;
      const clamped = Math.min(Math.max(progress, 0), 1);
      const index = Math.min(total - 1, Math.floor(clamped * total));

      setActiveProject(Math.max(0, index));

      if (progressBar) {
        progressBar.style.width = (clamped * 100).toFixed(2) + "%";
      }
    };

    updateWork();
    window.addEventListener("scroll", updateWork, { passive: true });
    window.addEventListener("resize", updateWork);

    const scrollToProject = (index) => {
      const targetIndex = Math.min(Math.max(index, 0), total - 1);
      const scrollable = work.offsetHeight - window.innerHeight;
      const top =
        work.offsetTop + (targetIndex / total) * scrollable + 2;

      window.scrollTo({
        top,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    };

    if (prevButton) {
      prevButton.addEventListener("click", () => scrollToProject(activeIndex - 1));
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => scrollToProject(activeIndex + 1));
    }
  }

  /* -------------------------------------------------------
     Contact reveal
     ------------------------------------------------------- */

  const contact = $(".contact");

  if (contact) {
    if (reducedMotion) {
      contact.classList.add("inview");
    } else {
      const contactObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              contact.classList.add("inview");
              observer.disconnect();
            }
          });
        },
        { threshold: 0.18 }
      );

      contactObserver.observe(contact);
    }
  }

  /* -------------------------------------------------------
     Section reveals
     ------------------------------------------------------- */

  const revealTargets = $$(".label, .stats, .row, .exp-row, .contact-meta");

  if (revealTargets.length) {
    revealTargets.forEach((element) => element.classList.add("reveal"));

    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
      );

      revealTargets.forEach((element) => revealObserver.observe(element));
    }
  }
})();
