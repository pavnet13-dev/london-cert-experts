
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );
      menuToggle.textContent = isOpen ? "✕" : "☰";
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
        menuToggle.textContent = "☰";
      });
    });
  }

  // Footer year
  const year = document.getElementById("currentYear");
  if (year) year.textContent = new Date().getFullYear();

  // From Booking to Certificate interactive journey
  const journeyData = [
    {
      label: "STAGE 01",
      title: "Your journey begins",
      description:
        "A landlord or property manager visits the website to explore services suitable for their property.",
      icon: "⌂"
    },
    {
      label: "STAGE 02",
      title: "Choose your property details",
      description:
        "The customer selects the service, property type and relevant size or quantity so the scope can be understood.",
      icon: "⌂"
    },
    {
      label: "STAGE 03",
      title: "Select an available appointment",
      description:
        "The customer chooses from appointment slots actually configured in the booking system.",
      icon: "◷"
    },
    {
      label: "STAGE 04",
      title: "Submit the booking",
      description:
        "The customer enters their contact information, property address and any useful access notes.",
      icon: "✎"
    },
    {
      label: "STAGE 05",
      title: "Booking confirmation",
      description:
        "After the booking has been successfully saved, the system can display a unique booking reference.",
      icon: "✓"
    },
    {
      label: "STAGE 06",
      title: "The professional arrives",
      description:
        "The assigned professional attends the property at the agreed appointment time.",
      icon: "⌂"
    },
    {
      label: "STAGE 07",
      title: "Electrical inspection and testing",
      description:
        "Where an electrical service is booked, the appropriate inspection and testing is carried out and findings recorded.",
      icon: "ϟ"
    },
    {
      label: "STAGE 08",
      title: "Fire safety checks",
      description:
        "Where relevant to the booked service, fire alarm and emergency lighting systems are checked according to the agreed scope.",
      icon: "◉"
    },
    {
      label: "STAGE 09",
      title: "Record the results",
      description:
        "The professional documents the observations, test results and any identified issues.",
      icon: "▤"
    },
    {
      label: "STAGE 10",
      title: "Prepare and review the report",
      description:
        "The appropriate report or certificate is prepared after the required checks and review. Timing depends on the service and findings.",
      icon: "▧"
    },
    {
      label: "STAGE 11",
      title: "Receive your report and next steps",
      description:
        "The customer receives the completed report when it is ready. Recommended remedial work can be discussed separately.",
      icon: "✓"
    }
  ];

  const title = document.getElementById("journeyTitle");
  const description = document.getElementById("journeyDescription");
  const label = document.getElementById("journeyLabel");
  const counter = document.getElementById("journeyCounter");
  const progress = document.getElementById("journeyProgress");
  const art = document.getElementById("journeyArt");
  const previous = document.getElementById("journeyPrev");
  const next = document.getElementById("journeyNext");
  const play = document.getElementById("journeyPlay");
  const playNote = document.getElementById("journeyPlayNote");
  const stageButtons = [...document.querySelectorAll(".journey-stage")];

  if (
    title && description && label && counter && progress &&
    art && previous && next && play && stageButtons.length
  ) {
    let current = 0;
    let playTimer = null;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    function stopJourney() {
      if (playTimer !== null) {
        window.clearInterval(playTimer);
        playTimer = null;
      }

      play.textContent = "▶ Play journey";
    }

    function showStage(index) {
      current = (index + journeyData.length) % journeyData.length;
      const stage = journeyData[current];

      label.textContent = stage.label;
      title.textContent = stage.title;
      description.textContent = stage.description;
      counter.textContent =
        String(current + 1).padStart(2, "0") +
        " / " +
        String(journeyData.length).padStart(2, "0");

      progress.style.width =
        ((current + 1) / journeyData.length) * 100 + "%";

      // Use a text node so stage content cannot inject HTML.
      const icon = art.querySelector(".art-electric");
      if (icon) icon.textContent = stage.icon;

      stageButtons.forEach((button, i) => {
        const active = i === current;
        button.classList.toggle("active", active);

        if (active) {
          button.setAttribute("aria-current", "step");
        } else {
          button.removeAttribute("aria-current");
        }
      });

      art.classList.remove("stage-change");

      if (!reduceMotion) {
        // Restart the small stage-change effect.
        void art.offsetWidth;
        art.classList.add("stage-change");
      }
    }

    previous.addEventListener("click", () => {
      stopJourney();
      showStage(current - 1);
      playNote.textContent = "Journey paused. Explore any stage.";
    });

    next.addEventListener("click", () => {
      stopJourney();
      showStage(current + 1);
      playNote.textContent = "Journey paused. Explore any stage.";
    });

    stageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        stopJourney();
        showStage(Number(button.dataset.stage));
        playNote.textContent = "Stage selected. Continue at your own pace.";
      });
    });

    play.addEventListener("click", () => {
      if (playTimer !== null) {
        stopJourney();
        playNote.textContent = "Journey paused.";
        return;
      }

      // Do not autoplay. Playback starts only after the visitor clicks.
      if (reduceMotion) {
        showStage(current + 1);
        playNote.textContent =
          "Reduced-motion setting detected. Use Next stage to continue.";
        return;
      }

      if (current === journeyData.length - 1) {
        showStage(0);
      }

      play.textContent = "Ⅱ Pause journey";
      playNote.textContent =
        "Journey playing. Each stage stays visible for about 4.5 seconds.";

      playTimer = window.setInterval(() => {
        if (current >= journeyData.length - 1) {
          stopJourney();
          playNote.textContent = "Journey complete. You can replay it anytime.";
          return;
        }

        showStage(current + 1);
      }, 4500);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && playTimer !== null) {
        stopJourney();
        playNote.textContent =
          "Journey paused while the page is hidden.";
      }
    });

    showStage(0);
  }
});
