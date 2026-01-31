
/**
 * UI Scaling Script
 * Ensures the Keypad Card scales to fit the viewport while maintaining absolute pixel layout.
 */
export function initKeypadScaling() {
  const BASE_WIDTH = 360; 
  const BASE_MARGIN = 20;

  function resize() {
    const keypads = document.querySelectorAll('.keypad-card');
    const vw = window.innerWidth;
    
    const availableWidth = vw - (BASE_MARGIN * 2);
    let scale = availableWidth / BASE_WIDTH;
    if (scale > 1) scale = 1;

    keypads.forEach(keypad => {
        keypad.style.transformOrigin = 'center center'; 
        keypad.style.transform = `scale(${scale})`;
        keypad.style.marginBottom = '0px';
    });
  }

  window.addEventListener('resize', resize);
  
  const observer = new MutationObserver((mutations) => {
      let shouldResize = false;
      for (const mutation of mutations) {
          if (mutation.addedNodes.length) shouldResize = true;
      }
      if (shouldResize) resize();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });

  resize();
}

// Auto-init if module script, or exported.
initKeypadScaling();
