/* Main application initialization and event handlers */

/* Initialize the application when DOM is loaded */
document.addEventListener('DOMContentLoaded', () => {
  /* Get references to DOM elements */
  const categoryFilter = document.getElementById("categoryFilter");
  const chatForm = document.getElementById("chatForm");
  const generateBtn = document.getElementById('generateRoutine');

  /* Load selected products from localStorage and update display */
  loadSelectedProducts();
  updateSelectedProductsList();

  /* Show initial placeholder until user selects a category */
  const productsContainer = document.getElementById("productsContainer");
  productsContainer.innerHTML = `
    <div class="placeholder-message">
      Select a category to view products
    </div>
  `;

  /* Category filter change handler */
  categoryFilter.addEventListener("change", async (e) => {
    initializeProducts();
  });

  /* Chat form submission handler */
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    /* Get user input */
    const userInput = document.getElementById("userInput").value.trim();
    
    /* If there's user input, handle it as a follow-up question */
    if (userInput) {
      await handleChatMessage(userInput);
      document.getElementById("userInput").value = ""; // Clear input
      return;
    }

    /* Otherwise, generate initial routine from selected products */
    await generateRoutineFromProducts();
  });

  /* Generate Routine button functionality */
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      /* Trigger the same functionality as the chat form */
      const event = new Event('submit');
      chatForm.dispatchEvent(event);
    });
  }

  /* Initialize products display */
  initializeProducts();
});
