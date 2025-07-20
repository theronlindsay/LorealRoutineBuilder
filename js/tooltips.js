/* Tooltip functionality for product information */

/* Show product tooltip on hover */
function showProductTooltip(productId) {
  const tooltip = document.getElementById(`tooltip-${productId}`);
  if (tooltip) {
    tooltip.classList.add('visible');
  }
}

/* Hide product tooltip when not hovering */
function hideProductTooltip(productId) {
  const tooltip = document.getElementById(`tooltip-${productId}`);
  if (tooltip) {
    /* Only hide if it wasn't clicked (no 'clicked' class) */
    if (!tooltip.classList.contains('clicked')) {
      tooltip.classList.remove('visible');
    }
  }
}

/* Toggle product tooltip on click and change button text */
function toggleProductTooltip(productId) {
  const tooltip = document.getElementById(`tooltip-${productId}`);
  const button = document.querySelector(`[onclick*="toggleProductTooltip(${productId})"]`);
  if (!tooltip || !button) return;
  
  /* Hide all other clicked tooltips first and reset their buttons */
  document.querySelectorAll('.product-tooltip.clicked').forEach(tip => {
    if (tip.id !== `tooltip-${productId}`) {
      tip.classList.remove('clicked', 'visible');
      /* Reset the button text for other tooltips */
      const otherProductId = tip.id.replace('tooltip-', '');
      const otherButton = document.querySelector(`[onclick*="toggleProductTooltip(${otherProductId})"]`);
      if (otherButton) {
        otherButton.innerHTML = '<i class="fa-solid fa-info-circle"></i> More Info';
      }
    }
  });
  
  /* Toggle this tooltip */
  if (tooltip.classList.contains('clicked')) {
    tooltip.classList.remove('clicked', 'visible');
    button.innerHTML = '<i class="fa-solid fa-info-circle"></i> More Info';
  } else {
    tooltip.classList.add('clicked', 'visible');
    button.innerHTML = '<i class="fa-solid fa-times"></i> Close';
  }
}

/* Close all tooltips when clicking outside */
document.addEventListener('click', (e) => {
  /* Check if the click was outside any product card */
  if (!e.target.closest('.product-card')) {
    document.querySelectorAll('.product-tooltip.clicked').forEach(tooltip => {
      tooltip.classList.remove('clicked', 'visible');
      /* Reset the button text */
      const productId = tooltip.id.replace('tooltip-', '');
      const button = document.querySelector(`[onclick*="toggleProductTooltip(${productId})"]`);
      if (button) {
        button.innerHTML = '<i class="fa-solid fa-info-circle"></i> More Info';
      }
    });
  }
});
