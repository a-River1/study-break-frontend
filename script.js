// The deployed Flask backend on Render.
const BACKEND_URL = "https://study-break-backend.onrender.com";

const form = document.getElementById("break-form");
const input = document.getElementById("minutes");
const button = form.querySelector("button");
const message = document.getElementById("message");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = input.value.trim();
  const minutes = Number(value);
  input.removeAttribute("aria-invalid");

  if (value === "") {
    showMessage("Please enter how many minutes you have for a break.", true);
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }

  if (!/^\d+$/.test(value) || !Number.isSafeInteger(minutes) || minutes < 1) {
    showMessage("Please enter a positive whole number, such as 5 or 10.", true);
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }

  button.disabled = true;
  showMessage("Finding an activity...");

  // Stop waiting if the backend does not respond within 15 seconds.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${BACKEND_URL}/break?minutes=${minutes}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      showMessage("The backend could not provide an activity. Please try again.", true);
      return;
    }

    const data = await response.json();
    if (typeof data.activity !== "string" || !Number.isInteger(data.minutes)) {
      showMessage("The backend returned an unexpected response. Please try again.", true);
      return;
    }

    showMessage(`${data.activity} (${data.minutes} minute${data.minutes === 1 ? "" : "s"})`);
  } catch (error) {
    if (error.name === "AbortError") {
      showMessage("The backend took too long to respond. Please try again in a moment.", true);
    } else {
      showMessage("Could not load an activity. Make sure the backend is running and try again.", true);
    }
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
  }
});
