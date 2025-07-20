/* Product management functionality */

/* Array to keep track of selected products */
let selectedProducts = [];

/* LocalStorage key for selected products */
const STORAGE_KEY = 'lorealSelectedProducts';

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedProducts));
}

/* Load selected products from localStorage */
function loadSelectedProducts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    selectedProducts = JSON.parse(saved);
  }
}

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Toggle product selection */
async function toggleProductSelection(productId) {
  const products = await loadProducts();
  const product = products.find(p => p.id === productId);
  
  if (!product) return;
  
  /* Check if product is already selected */
  const existingIndex = selectedProducts.findIndex(p => p.id === productId);
  
  if (existingIndex > -1) {
    /* Remove from selected products */
    selectedProducts.splice(existingIndex, 1);
  } else {
    /* Add to selected products */
    selectedProducts.push(product);
  }
  
  /* Save to localStorage and update display */
  saveSelectedProducts();
  updateSelectedProductsList();
  updateProductCardStates();
}

/* Update the visual state of product cards */
function updateProductCardStates() {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const productId = parseInt(card.dataset.productId);
    const isSelected = selectedProducts.some(p => p.id === productId);
    
    if (isSelected) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

/* Update the selected products list */
function updateSelectedProductsList() {
  const selectedProductsList = document.getElementById("selectedProductsList");
  
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = '<p style="color: #666; font-style: italic;">No products selected</p>';
    return;
  }
  
  /* Create HTML with a clear all button and individual product items */
  const clearAllButton = '<button class="clear-all-btn" onclick="clearAllProducts()" title="Remove all products"><i class="fa-solid fa-trash"></i> Clear All</button>';
  
  const productItems = selectedProducts
    .map(product => `
      <div class="selected-product-item">
        <span class="product-name">${product.name}</span>
        <button class="delete-btn" onclick="removeProduct(${product.id})" title="Remove product">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `).join('');
    
  selectedProductsList.innerHTML = clearAllButton + productItems;
}

/* Remove a product from selected list */
function removeProduct(productId) {
  selectedProducts = selectedProducts.filter(p => p.id !== productId);
  /* Save to localStorage and update display */
  saveSelectedProducts();
  updateSelectedProductsList();
  updateProductCardStates();
}

/* Clear all selected products */
function clearAllProducts() {
  selectedProducts = [];
  /* Save to localStorage and update display */
  saveSelectedProducts();
  updateSelectedProductsList();
  updateProductCardStates();
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  const productsContainer = document.getElementById("productsContainer");
  
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}" onclick="toggleProductSelection(${product.id})">
      <div class="image-section">
        <img src="${product.image}" alt="${product.name}">
        <div class="brand-name">${product.brand}</div>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <button class="more-info-btn" 
                onclick="event.stopPropagation(); toggleProductTooltip(${product.id})"
                onmouseenter="showProductTooltip(${product.id})"
                onmouseleave="hideProductTooltip(${product.id})">
          <i class="fa-solid fa-info-circle"></i> More Info
        </button>
      </div>
      <div class="product-tooltip" id="tooltip-${product.id}">
        <h4>${product.name}</h4>
        <div class="tooltip-brand">${product.brand}</div>
        <div class="tooltip-description">${product.description}</div>
      </div>
    </div>
  `
    )
    .join("");
    
  /* Update visual state of already selected products */
  updateProductCardStates();
}

/* Filter and display products when category changes */
const initializeProducts = async () => {
  /* Load selected products from localStorage first */
  loadSelectedProducts();
  updateSelectedProductsList();
  
  const categoryFilter = document.getElementById("categoryFilter");
  const productsContainer = document.getElementById("productsContainer");
  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;

  if (!selectedCategory) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category to view products
      </div>
    `;
    return;
  }

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
};
