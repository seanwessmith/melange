document.getElementById("pasteButton")?.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (document.getElementById("textDisplay")?.textContent) {
      document.getElementById("textDisplay")!.textContent = text;
    }
  } catch (err) {
    console.error("Failed to read clipboard: ", err);
  }
});
