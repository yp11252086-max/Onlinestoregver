// Global State Variables
let cart = [];
let loggedInUser = null;

// Check if a user is already logged in from last time when page loads
window.onload = function() {
    const savedUser = localStorage.getItem('currentSKZUser');
    if (savedUser) {
        loggedInUser = JSON.parse(savedUser);
        updateAuthBar();
    }
};

// --- POPUP DISPLAY CONTROLS ---
function openPopup(id) {
    document.getElementById(id).style.display = 'flex';
}
function closePopup(id) {
    document.getElementById(id).style.display = 'none';
}

// --- SHOPPING CART LOGIC ---
function toggleCart() {
    const panel = document.getElementById('cart-panel');
    panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
}

function addToCart(name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const itemsContainer = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    // Update count indicator
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    countEl.innerText = totalItems;

    if (cart.length === 0) {
        itemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        totalEl.innerText = "0";
        return;
    }

    itemsContainer.innerHTML = "";
    let grandTotal = 0;

    cart.forEach((item, index) => {
        grandTotal += (item.price * item.quantity);
        itemsContainer.innerHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:14px; background:#f9f9f9; padding:5px; border-radius:4px;">
                <div>
                    <strong>${item.name}</strong><br>
                    ${item.price} NTD x ${item.quantity}
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer;">Remove</button>
            </div>
        `;
    });
    totalEl.innerText = grandTotal;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// --- AUTHENTICATION (SIGN UP & LOG IN) LOGIC ---
function registerUser() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
        alert("Please fill in all sign-up boxes!");
        return;
    }

    // Save user locally
    let users = JSON.parse(localStorage.getItem('skzStoreUsers')) || [];
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        alert("This email is already registered! Please Log In instead.");
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('skzStoreUsers', JSON.stringify(users));

    // Automatically log them in
    loggedInUser = newUser;
    localStorage.setItem('currentSKZUser', JSON.stringify(newUser));
    
    alert("Account created successfully!");
    closePopup('signupPopup');
    updateAuthBar();
}

function loginUser() {
    const email = document.getElementById('logEmail').value.trim();
    const password = document.getElementById('logPassword').value;

    let users = JSON.parse(localStorage.getItem('skzStoreUsers')) || [];
    const userMatch = users.find(u => u.email === email && u.password === password);

    if (userMatch) {
        loggedInUser = userMatch;
        localStorage.setItem('currentSKZUser', JSON.stringify(userMatch));
        closePopup('loginPopup');
        updateAuthBar();
    } else {
        alert("Invalid email or password. Please try again or Sign Up!");
    }
}

function logoutUser() {
    loggedInUser = null;
    localStorage.removeItem('currentSKZUser');
    alert("Logged out successfully.");
    location.reload();
}

function updateAuthBar() {
    const loggedOutState = document.getElementById('loggedOutState');
    const loggedInState = document.getElementById('loggedInState');
    const displayUsername = document.getElementById('displayUsername');
    const inputEmail = document.getElementById('customer-email');
    const inputName = document.getElementById('customer-name');

    if (loggedInUser) {
        loggedOutState.style.display = 'none';
        loggedInState.style.display = 'inline';
        displayUsername.innerText = loggedInUser.name;
        
        // Auto-fill checkout fields
        inputEmail.value = loggedInUser.email;
        inputName.value = loggedInUser.name;
    } else {
        loggedOutState.style.display = 'inline';
        loggedInState.style.display = 'none';
    }
}

// --- CHECKOUT GUARD & ORDER STORAGE ---
function processCheckout() {
    // 1. STRIKT LOGIN GUARD RULE
    if (!loggedInUser) {
        alert("🔒 You must be signed up and logged in to purchase from our store!");
        toggleCart(); // Close cart drawer
        openPopup('loginPopup'); // Force open login window
        return;
    }

    if (cart.length === 0) {
        alert("Your cart is empty. Please add items before purchasing.");
        return;
    }

    const name = document.getElementById('customer-name').value.trim();
    const notes = document.getElementById('customer-notes').value.trim();

    if (!name) {
        alert("Please enter your name for delivery.");
        return;
    }

    // Create unique order layout
    const newOrder = {
        userEmail: loggedInUser.email,
        customerName: name,
        items: [...cart],
        total: document.getElementById('cart-total').innerText,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        deliveryNotes: notes
    };

    // Load past orders, add new order, save back
    let allOrders = JSON.parse(localStorage.getItem('skzStoreOrders')) || [];
    allOrders.push(newOrder);
    localStorage.setItem('skzStoreOrders', JSON.stringify(allOrders));

    // Reset everything
    cart = [];
    updateCartUI();
    toggleCart();
    document.getElementById('customer-notes').value = "";
    
    // Show beautiful completion confirmation screen
    openPopup('thankyouPopup');
}

// --- DISPLAY SAVED ORDER HISTORY ---
function showHistory() {
    const listContainer = document.getElementById('historyList');
    let allOrders = JSON.parse(localStorage.getItem('skzStoreOrders')) || [];
    
    // Filter orders to only show the ones belonging to the logged-in customer account email
    const myOrders = allOrders.filter(o => o.userEmail === loggedInUser.email);

    if (myOrders.length === 0) {
        listContainer.innerHTML = "<p style='color:#777;text-align:center;'>You haven't placed any orders yet!</p>";
        return;
    }

    listContainer.innerHTML = "";
    // Show newest orders on top
    myOrders.reverse().forEach(order => {
        let itemLines = "";
        order.items.forEach(i => {
            itemLines += `<li>${i.name} (x${i.quantity})</li>`;
        });

        listContainer.innerHTML += `
            <div class="order-history-card">
                <p style="margin:0; font-size:12px; color:#666;">Ordered on: ${order.date}</p>
                <p style="margin:5px 0; font-weight:bold;">Total Cost: ${order.total} NTD</p>
                <ul style="margin:5px 0; padding-left:20px; font-size:13px;">${itemLines}</ul>
                ${order.deliveryNotes ? `<p style="margin:5px 0 0 0; font-size:12px; color:#555; font-style:italic;">Note: "${order.deliveryNotes}"</p>` : ''}
            </div>
        `;
    });
}
