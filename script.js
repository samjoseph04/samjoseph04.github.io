
document.addEventListener("DOMContentLoaded", () => {

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
