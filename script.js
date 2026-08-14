const form = document.getElementById("requestForm");
const output = document.getElementById("output");
const button = form.querySelector("button");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const body = new URLSearchParams({
    username: document.getElementById("username").value.trim(),
    question: document.getElementById("question").value.trim(),
    deviceId: document.getElementById("deviceId").value.trim(),
    gameSlug: "",
    style: "",
    referrer: ""
  });

  output.classList.remove("hidden");
  output.textContent = "Sending one request...";
  button.disabled = true;

  try {
    const response = await fetch("https://ngl.link/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body,
      credentials: "include"
    });

    const responseText = await response.text();

    output.textContent = `REQUEST SENT

Status: ${response.status} ${response.statusText}

Response:
${responseText || "(empty response)"}`;
  } catch (error) {
    output.textContent = `REQUEST FAILED

${error.message}`;
  } finally {
    button.disabled = false;
  }
});
