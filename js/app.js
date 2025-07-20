/* Main application initialization and event handlers */

/* Initialize the application when DOM is loaded */
document.addEventListener('DOMContentLoaded', () => {
  /* Get references to DOM elements */
  const categoryFilter = document.getElementById("categoryFilter");
  const productSearch = document.getElementById("productSearch");
  const chatForm = document.getElementById("chatForm");
  const generateBtn = document.getElementById('generateRoutine');

  /* Debounce function for search input */
  let searchTimeout;
  function debounceSearch(func, delay) {
    return function(...args) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /* Load selected products from localStorage and update display */
  loadSelectedProducts();
  updateSelectedProductsList();

  /* Show featured products on initial page load */
  displayFeaturedProducts();

  /* Initialize with default LTR layout */
  const html = document.documentElement;
  html.setAttribute('dir', 'ltr');
  html.setAttribute('lang', 'en');

  /* Category filter change handler */
  categoryFilter.addEventListener("change", async (e) => {
    if (categoryFilter.value === '') {
      /* If category is cleared, show featured products */
      productSearch.value = '';
      await displayFeaturedProducts();
    } else {
      await filterAndDisplayProducts();
    }
  });

  /* Search input handler - filter as user types with debouncing */
  const debouncedSearch = debounceSearch(async () => {
    await filterAndDisplayProducts();
  }, 300); // Wait 300ms after user stops typing

  productSearch.addEventListener("input", debouncedSearch);

  /* Clear category filter when user starts typing in search */
  productSearch.addEventListener("focus", () => {
    if (productSearch.value.trim() === '') {
      categoryFilter.value = '';
    }
  });

  /* Add clear search functionality */
  productSearch.addEventListener("keydown", (e) => {
    if (e.key === 'Escape' || (e.key === 'Backspace' && productSearch.value.length === 1)) {
      productSearch.value = '';
      categoryFilter.value = '';
      displayFeaturedProducts();
    }
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
    generateBtn.addEventListener('click', async () => {
      /* Directly call the routine generation function instead of triggering form submit */
      await generateRoutineFromProducts();
    });
  }

  /* Initialize products display */
  initializeProducts();
});
