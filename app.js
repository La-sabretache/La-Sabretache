/**
 * app.js - Miel de La Sabretache
 * Interactive shopping cart and checkout integration via WhatsApp & Email.
 */

// --- CONFIGURATION ---
const ARTISAN_WHATSAPP_NUMBER = '32477236711'; 
const ARTISAN_EMAIL = 'patsy3.massange@gmail.com';

// --- PRODUCTS CONFIGURATION ---
const PRODUCTS = {
  honey_spring: {
    id: 'honey_spring',
    name: 'Miel de Printemps 2026',
    price: 8.00,
    unit: 'pot de 250 g',
    img: 'assets/images/miel_printemps_ete.jpg'
  },
  honey_summer: {
    id: 'honey_summer',
    name: "Miel d'Été 2026",
    price: 8.00,
    unit: 'pot de 250 g',
    img: 'assets/images/miel_pots.jpg'
  },
  walnuts_500g: {
    id: 'walnuts_500g',
    name: 'Noix du Jardin (500 g)',
    price: 3.00,
    unit: 'sachet de 500 g',
    img: 'assets/images/noix.jpeg'
  },
  walnuts_1kg: {
    id: 'walnuts_1kg',
    name: 'Noix du Jardin (1 kg)',
    price: 5.00,
    unit: 'grand sachet de 1 kg',
    img: 'assets/images/noix_jardin.jpg'
  }
};

// --- STATE MANAGEMENT ---
let cart = [];

// --- DOM ELEMENTS ---
const cartDrawer = document.getElementById('cartDrawer');
const cartItemsContainer = document.querySelector('.cart-items-container');
const cartCountBadges = document.querySelectorAll('.cart-count');
const totalPriceEl = document.querySelector('.total-price');
const checkoutForm = document.getElementById('checkoutForm');
const navbar = document.querySelector('.navbar');
const legalModal = document.getElementById('legalModal');
const cookieBanner = document.getElementById('cookieBanner');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromLocalStorage();
  window.addEventListener('scroll', handleNavbarScroll);
  handleNavbarScroll();
  setupDialogLightDismissFallback();
  setupScrollRevealFallback();
  initCookieBanner();
  handleInitialHash();
  setupCartButtonListeners();
});

function setupCartButtonListeners() {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.btn-card-add');
    if (!btn) return;
    const productId = btn.dataset.id;
    // Si l'attribut inline onclick n'a pas été défini, déclencher l'ajout
    if (productId && !btn.hasAttribute('onclick')) {
      addToCart(productId, btn);
    }
  });
}

// --- SCROLL & STYLE HELPERS ---
function handleNavbarScroll() {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

// --- CART LOGIC ---
function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem('sabretache_cart');
  if (savedCart) {
    try {
      const parsed = JSON.parse(savedCart);
      cart = parsed
        .filter(item => PRODUCTS[item.id])
        .map(item => ({
          ...item,
          price: PRODUCTS[item.id].price,
          name: PRODUCTS[item.id].name,
          unit: PRODUCTS[item.id].unit,
          img: PRODUCTS[item.id].img
        }));
      saveCartToLocalStorage();
      updateCartUI();
    } catch (e) {
      cart = [];
    }
  }
}

function saveCartToLocalStorage() {
  localStorage.setItem('sabretache_cart', JSON.stringify(cart));
}

function addToCart(productId, clickedElement = null) {
  const product = PRODUCTS[productId];
  if (!product) {
    console.warn(`Produit introuvable : ${productId}`);
    return;
  }
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      unit: product.unit,
      img: product.img,
      qty: 1
    });
  }
  
  saveCartToLocalStorage();
  updateCartUI();
  animateCartIcon();

  // Animation et retour visuel fiable sur le bouton
  let btn = clickedElement instanceof HTMLElement ? clickedElement.closest('button') : null;
  if (!btn) {
    btn = document.querySelector(`.btn-card-add[data-id="${productId}"]`);
  }
  if (btn) {
    triggerButtonFeedback(btn);
  }
  
  openCart();
}

function triggerButtonFeedback(btn) {
  if (!btn) return;
  const span = btn.querySelector('.btn-text') || btn.querySelector('span');
  if (span && !btn._origText) {
    btn._origText = span.textContent;
  }
  btn.classList.add('added');
  if (span) {
    span.textContent = '✓ Ajouté !';
  }
  clearTimeout(btn._resetTimer);
  btn._resetTimer = setTimeout(() => {
    btn.classList.remove('added');
    if (span && btn._origText) {
      span.textContent = btn._origText;
    }
  }, 1200);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCartToLocalStorage();
  updateCartUI();
}

function updateQuantity(productId, amount) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;
  
  item.qty += amount;
  
  if (item.qty <= 0) {
    removeFromCart(productId);
  } else {
    saveCartToLocalStorage();
    updateCartUI();
  }
}

function getCartTotal() {
  return cart.reduce((total, item) => total + (item.price * item.qty), 0);
}

function getCartItemsCount() {
  return cart.reduce((count, item) => count + item.qty, 0);
}

function updateCartUI() {
  const totalCount = getCartItemsCount();
  cartCountBadges.forEach(badge => {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  });
  
  totalPriceEl.textContent = `${getCartTotal().toFixed(2)} €`;
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-message">
        <svg viewBox="0 0 24 24"><path d="M17.21 9l-4.38-6.56c-.18-.28-.5-.44-.83-.44s-.65.16-.83.44L6.79 9H2c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h.08l1.49 8.28c.11.58.61 1.01 1.2 1.01h14.46c.59 0 1.09-.43 1.2-1.01L21.92 12h.08c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-4.79zM9 9l3-4.5L15 9H9zm3 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
        <p>Votre panier est vide pour l'instant.</p>
        <p style="font-size: 0.85rem; opacity: 0.7;">Parcourez notre boutique et découvrez les délices de Lasne !</p>
      </div>
    `;
    toggleFormFields(false);
  } else {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.name}</h4>
          <p style="font-size: 0.8rem; color: var(--color-charcoal-light);">${item.unit}</p>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)" aria-label="Diminuer">-</button>
            <span class="cart-item-qty">${item.qty}</span>
            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)" aria-label="Augmenter">+</button>
            <span class="cart-item-price" style="margin-left: auto;">${(item.price * item.qty).toFixed(2)} €</span>
          </div>
        </div>
        <button class="btn-remove-item" onclick="removeFromCart('${item.id}')" aria-label="Supprimer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');
    toggleFormFields(true);
  }
}

function toggleFormFields(enable) {
  const inputs = checkoutForm.querySelectorAll('input, select, button');
  inputs.forEach(input => {
    if (enable) {
      input.removeAttribute('disabled');
    } else {
      input.setAttribute('disabled', 'true');
    }
  });
}

function animateCartIcon() {
  const toggle = document.querySelector('.cart-toggle');
  toggle.style.transform = 'scale(0.8)';
  setTimeout(() => {
    toggle.style.transform = 'scale(1.15)';
    setTimeout(() => {
      toggle.style.transform = 'none';
    }, 150);
  }, 100);
}

// --- DRAWER OPEN/CLOSE ---
function openCart() {
  if (!cartDrawer) return;
  if (!cartDrawer.open) {
    if (typeof cartDrawer.showModal === 'function') {
      try {
        cartDrawer.showModal();
      } catch (e) {
        cartDrawer.setAttribute('open', '');
      }
    } else {
      cartDrawer.setAttribute('open', '');
    }
  }
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  if (!cartDrawer) return;
  if (cartDrawer.open) {
    if (typeof cartDrawer.close === 'function') {
      try {
        cartDrawer.close();
      } catch (e) {
        cartDrawer.removeAttribute('open');
      }
    } else {
      cartDrawer.removeAttribute('open');
    }
  }
  document.body.style.overflow = '';
}

// --- FALLBACKS ---
function setupDialogLightDismissFallback() {
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    [cartDrawer, legalModal].forEach(dialog => {
      if (!dialog) return;
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        
        if (!isDialogContent) {
          dialog.close();
          document.body.style.overflow = '';
        }
      });
    });
  }
}

function setupScrollRevealFallback() {
  if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach(el => el.classList.add('scroll-reveal-fallback'));
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });
    
    reveals.forEach(el => observer.observe(el));
  }
}

// --- CHECKOUT CHANNELS ---
function handleCheckout(channel) {
  const name = document.getElementById('custName').value.trim();
  const pickup = document.getElementById('pickupOption').value;
  
  if (!name) {
    alert("Veuillez saisir votre nom pour valider la commande.");
    document.getElementById('custName').focus();
    return;
  }
  
  if (cart.length === 0) {
    alert("Votre panier est vide.");
    return;
  }
  
  const dateStr = new Date().toLocaleDateString('fr-FR');
  const itemsText = cart.map(item => `- ${item.qty}x ${item.name} (${item.unit}) : ${(item.price * item.qty).toFixed(2)}€`).join('\n');
  const total = getCartTotal().toFixed(2);
  const pickupMethod = pickup === 'collect' ? 'Retrait à La Sabretache (Lasne)' : 'Livraison locale de proximité';
  
  const rawMessage = `Bonjour ! 🍯🌸\nJe souhaite réserver des produits de La Sabretache :\n\nCommande du ${dateStr} :\n${itemsText}\n\nTotal : ${total} €\n\nClient : ${name}\nMode de retrait : ${pickupMethod}\n\nMerci beaucoup ! À bientôt pour le retrait.`;
  
  if (channel === 'whatsapp') {
    const encodedText = encodeURIComponent(rawMessage);
    const whatsappUrl = `https://wa.me/${ARTISAN_WHATSAPP_NUMBER}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  } else if (channel === 'email') {
    const subject = encodeURIComponent(`Réservation Miel Artisanal - Sabretache - ${name}`);
    const encodedBody = encodeURIComponent(rawMessage);
    const mailtoUrl = `mailto:${ARTISAN_EMAIL}?subject=${subject}&body=${encodedBody}`;
    window.location.href = mailtoUrl;
  }
  
  setTimeout(() => {
    cart = [];
    saveCartToLocalStorage();
    updateCartUI();
    closeCart();
    alert("Votre message de commande a été préparé ! Merci de l'envoyer dans l'application ouverte.");
  }, 1000);
}


// --- LEGAL MODAL LOGIC ---
function openLegalModal(tabId = 'mentions') {
  if (!legalModal) return;
  legalModal.showModal();
  document.body.style.overflow = 'hidden';
  switchLegalTab(tabId);
}

function closeLegalModal() {
  if (!legalModal) return;
  legalModal.close();
  document.body.style.overflow = '';
}

function switchLegalTab(tabId) {
  const tabs = document.querySelectorAll('.legal-tab');
  const panels = document.querySelectorAll('.legal-panel');

  tabs.forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    } else {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    }
  });

  panels.forEach(panel => {
    if (panel.id === `panel-${tabId}`) {
      panel.classList.add('active');
      panel.removeAttribute('hidden');
    } else {
      panel.classList.remove('active');
      panel.setAttribute('hidden', 'true');
    }
  });
}

function handleInitialHash() {
  const hash = window.location.hash.replace('#', '');
  if (['mentions', 'rgpd', 'cookies', 'cgv'].includes(hash)) {
    setTimeout(() => {
      openLegalModal(hash);
    }, 300);
  }
}

// --- COOKIE BANNER LOGIC ---
function initCookieBanner() {
  if (!cookieBanner) return;
  const isAck = localStorage.getItem('sabretache_cookie_ack');
  if (!isAck) {
    setTimeout(() => {
      cookieBanner.classList.add('show');
    }, 1200);
  }
}

function acceptCookieConsent() {
  localStorage.setItem('sabretache_cookie_ack', 'true');
  if (cookieBanner) {
    cookieBanner.classList.remove('show');
    setTimeout(() => {
      cookieBanner.remove();
    }, 400);
  }
}