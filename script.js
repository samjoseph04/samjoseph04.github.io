
document.addEventListener("DOMContentLoaded", () => {


  // ── Games Section ─────────────────────────────────────────────
  // Reads GAMES[] from games-data.js, builds cards dynamically.
  // To add a new game: only games-data.js needs a new entry.

  /** Emoji icons — fallback to 🎮 for unknown ids */
  const GAME_ICONS = {
    "archery":          "🏹",
    "bus-game":         "🚌",
    "clean-city":       "🌿",
    "color-maze":       "🎨",
    "dodge-the-blocks": "🟦",
    "drop":             "💧",
    "echo":             "🔊",
    "glow":             "✨",
    "harbour-control":  "⚓",
    "memory-grid":      "🧠",
    "neon-reflex":      "⚡",
    "number-rush":      "🔢",
    "reaction":         "⏱️",
    "slidensolve":      "🧩",
    "stack":            "📦",
    "traffic":          "🚦",
  }

  function renderGamesSection() {
    const grid = document.getElementById("games-grid")
    if (!grid || typeof GAMES === "undefined") return

    // Update the count badge
    const countEl = document.getElementById("games-count")
    if (countEl) countEl.textContent = `${GAMES.length} games`

    // Build one card per game
    GAMES.forEach((game, index) => {
      const tagsHTML = (game.tags || [])
        .map(t => `<span class="game-tag">${t}</span>`)
        .join("")

      const card = document.createElement("article")
      card.className = "game-card fade-in"
      card.dataset.category = game.category || "Casual"

      // Per-game accent — drives gradient, glow, tags, button
      card.style.setProperty("--game-color", game.color || "var(--accent-primary)")
      card.style.setProperty("--game-color-rgb", game.colorRGB || "0,217,255")

      // Stagger cards in groups of 3 (matching 3-col grid)
      card.style.animationDelay = `${(index % 3) * 0.07}s`

      card.innerHTML = `
        <div class="game-card-preview" aria-hidden="true">
          <span class="game-card-icon">${GAME_ICONS[game.id] || "🎮"}</span>
        </div>
        <div class="game-card-body">
          <h3 class="game-card-title">${game.name}</h3>
          <p class="game-card-desc">${game.description}</p>
          <div class="game-card-footer">
            <div class="game-tag-list">${tagsHTML}</div>
            <a
              class="game-card-play"
              href="${game.folder}/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Play ${game.name} — opens in new tab"
            >
              Play
              <svg class="play-arrow" viewBox="0 0 16 16" fill="none"
                stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round"
                aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4"/>
              </svg>
            </a>
          </div>
        </div>
      `

      grid.appendChild(card)
    })

    // Fade-in on scroll (cards start hidden via .fade-in)
    const cardObserver = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible") }),
      { root: null, rootMargin: "0px", threshold: 0.06 }
    )
    grid.querySelectorAll(".game-card").forEach(c => cardObserver.observe(c))

    // ── Filter chips ──────────────────────────────────────────
    const chips = document.querySelectorAll(".filter-chip")
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        // Update active chip
        chips.forEach(c => {
          c.classList.remove("is-active")
          c.removeAttribute("aria-pressed")
        })
        chip.classList.add("is-active")
        chip.setAttribute("aria-pressed", "true")

        const filter = chip.dataset.filter
        grid.querySelectorAll(".game-card").forEach(card => {
          const visible = filter === "all" || card.dataset.category === filter
          card.classList.toggle("card-hidden", !visible)
        })
      })
    })

    // ── Whole-card click ──────────────────────────────────────
    // Clicking anywhere on the card (outside the Play link) navigates to the game
    grid.addEventListener("click", e => {
      if (e.target.closest(".game-card-play")) return // let the link handle itself
      const card = e.target.closest(".game-card")
      if (!card) return
      const link = card.querySelector(".game-card-play")
      if (link) window.open(link.href, "_blank", "noopener,noreferrer")
    })
  }

  renderGamesSection()


  // Mobile Menu Toggle
  const hamburger = document.querySelector(".hamburger")
  const navLinks = document.querySelector(".nav-links")

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navLinks.classList.toggle("mobile-active")
    })

    // Close menu when a link is clicked
    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active")
        navLinks.classList.remove("mobile-active")
      })
    })
  }

  // Intersection Observer for Fade-in Animations
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible")
      }
    })
  }, observerOptions)

  const fadeElements = document.querySelectorAll(".fade-in")
  fadeElements.forEach((el) => observer.observe(el))

  // Hide scroll indicator on scroll
  const scrollIndicator = document.querySelector(".scroll-indicator")

  window.addEventListener("scroll", () => {
    if (scrollIndicator) {
      if (window.scrollY > 100) {
        scrollIndicator.classList.add("hidden")
      } else {
        scrollIndicator.classList.remove("hidden")
      }
    }
  })

  // Smooth Scrolling for Navigation Links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const targetElement = document.querySelector(targetId)

      if (targetElement) {
        const headerOffset = 70
        const elementPosition = targetElement.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        })
      }
    })
  })

  // Active Navigation State
  const sections = document.querySelectorAll("section[id]")
  const navItems = document.querySelectorAll(".nav-links a")

  window.addEventListener("scroll", () => {
    let current = ""

    sections.forEach((section) => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.clientHeight
      if (pageYOffset >= sectionTop - 150) {
        current = section.getAttribute("id")
      }
    })

    navItems.forEach((item) => {
      item.classList.remove("active")
      if (item.getAttribute("href") === `#${current}`) {
        item.classList.add("active")
      }
    })
  })

  // Contact Form Handling
  const contactForm = document.getElementById("contactForm")
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const statusMsg = document.getElementById("formStatus")
      const submitBtn = contactForm.querySelector("button[type='submit']")

      const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        message: document.getElementById("message").value
      }

      try {
        submitBtn.disabled = true
        submitBtn.textContent = "Sending..."

        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        })

        const data = await response.json()

        if (response.ok) {
          statusMsg.textContent = "Message sent successfully!"
          statusMsg.className = "form-status success"
          contactForm.reset()
        } else {
          throw new Error(data.message || "Failed to send message")
        }
      } catch (error) {
        statusMsg.textContent = "Error: " + error.message
        statusMsg.className = "form-status error"
      } finally {
        submitBtn.disabled = false
        submitBtn.textContent = "Send Message"

        // Clear status message after 5 seconds
        setTimeout(() => {
          statusMsg.textContent = ""
          statusMsg.className = "form-status"
        }, 5000)
      }
    })
  }
})
