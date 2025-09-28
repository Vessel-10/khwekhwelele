document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector(".routes-table tbody");
  const pagination = document.getElementById("pagination");
  const bookingForm = document.querySelector('.booking-bar');
  const dateInput = document.getElementById('date');
  const busModal = document.getElementById('busModal');
  const confirmModal = document.getElementById('confirmModal');
  const bookingModal = document.getElementById('bookingModal');
  const modalBody = document.getElementById('modalBody');
  const confirmModalBody = document.getElementById('confirmModalBody');
  const bookingModalBody = document.getElementById('bookingModalBody');
  const closeBusModal = busModal.querySelector('.close-modal');
  const closeConfirmModal = confirmModal.querySelector('.close-modal');
  const closeBookingModal = bookingModal.querySelector('.close-modal');
  const rowsPerPage = 5; 
  let currentPage = 1;
  let routes = [];
  let currentBusData = [];
  let selectedBusDetails = null;
  let searchInfo = {};

  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  fetchAndDisplayRoutes();

  function fetchAndDisplayRoutes() {
    fetch("../php/route.php")
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          routes = data.data;
          displayPage(1);
          setupPagination();
        } else {
          tbody.innerHTML = `<tr><td colspan="6">${data.message}</td></tr>`;
        }
      })
      .catch(err => {
        console.error("Error fetching routes:", err);
        tbody.innerHTML = `<tr><td colspan="6">Unable to load routes</td></tr>`;
      });
  }

  function displayPage(page) {
    currentPage = page;
    tbody.innerHTML = "";

    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedRoutes = routes.slice(start, end);

    paginatedRoutes.forEach(route => {
      const row = `
        <tr>
          <td>${route.origin}</td>
          <td>${route.destination}</td>
          <td>MK${route.single_adult.toLocaleString()}</td>
          <td>MK${route.single_child.toLocaleString()}</td>
          <td>MK${route.return_adult.toLocaleString()}</td>
          <td>MK${route.return_child.toLocaleString()}</td>
        </tr>
      `;
      tbody.innerHTML += row;
    });

    updatePagination();
  }

  function setupPagination() {
    const totalPages = Math.ceil(routes.length / rowsPerPage);
    pagination.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.innerText = i;
      btn.addEventListener("click", () => displayPage(i));
      pagination.appendChild(btn);
    }
  }

  function updatePagination() {
    const buttons = pagination.querySelectorAll("button");
    buttons.forEach((btn, index) => {
      btn.classList.remove("active");
      if (index + 1 === currentPage) {
        btn.classList.add("active");
      }
    });
  }

  // Modal Management
  function showModal(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }

  function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto'; // Restore scrolling
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }

  function closeBusModalHandler() {
    hideModal(busModal);
  }

  function closeConfirmModalHandler() {
    hideModal(confirmModal);
  }

  function closeBookingModalHandler() {
    hideModal(bookingModal);
  }

  // Bus Search Functionality
  bookingForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData();
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const date = document.getElementById('date').value;

    // Handle Flatpickr date format
    let formattedDate = date;
    if (date && date.includes(',')) {
      // Convert "September 27, 2025" to "2025-09-27"
      const dateObj = new Date(date);
      formattedDate = dateObj.getFullYear() + '-' + 
                     String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(dateObj.getDate()).padStart(2, '0');
    }

    formData.append('origin', origin);
    formData.append('destination', destination);
    formData.append('date', formattedDate);

    // Validation
    if (!origin || !destination || !formattedDate) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formattedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      showNotification('Please select a future date', 'error');
      return;
    }

    // Store search info
    searchInfo = { origin, destination, date: formattedDate };

    // Show loading
    modalBody.innerHTML = '<div class="loading">🔍 Searching for available buses...</div>';
    showModal(busModal);

    fetch('../php/search.php', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(res => {
      if (res.status === 'success') {
        currentBusData = res.data;
        displayBusResults(res);
      } else {
        displayErrorMessage(res.message);
      }
    })
    .catch(err => {
      console.error('Search error:', err);
      displayErrorMessage('Unable to search for buses. Please check your connection and try again.');
    });
  });

  function displayBusResults(res) {
    let html = `
      <h3>Available Buses</h3>
      <div class="search-details">
        <p><strong>Route:</strong> ${res.search_info.origin} → ${res.search_info.destination}</p>
        <p><strong>Date:</strong> ${formatDisplayDate(res.search_info.date)}</p>
      </div>
    `;
    
    if (res.data.length === 0) {
      html += `
        <div class="no-buses">
          <p>${res.message}</p>
          ${res.suggestion ? `<p class="suggestion">${res.suggestion}</p>` : ''}
        </div>
      `;
    } else {
      html += `
        <div class="results-summary">
          <p>Found ${res.data.length} available bus(es)</p>
        </div>
        <div class="buses-grid">
      `;
      
      res.data.forEach(bus => {
        const isLowSeats = bus.seats_left <= 5;
        const soldOut = bus.seats_left <= 0;
        
        html += `
          <div class="bus-card ${isLowSeats && !soldOut ? 'low-seats' : ''}">
            <div class="bus-header">
              <h4>${bus.bus_number}</h4>
              <span class="capacity">Capacity: ${bus.capacity}</span>
            </div>
            <div class="bus-times">
              <div class="time-block">
                <label>Departure</label>
                <span>${formatTime(bus.departure_time)}</span>
              </div>
              <div class="time-block">
                <label>Arrival</label>
                <span>${formatTime(bus.arrival_time)}</span>
              </div>
            </div>
            <div class="bus-pricing">
              <div class="price-item">
                <label>Adult:</label>
                <span>MK${parseFloat(bus.single_adult).toLocaleString()}</span>
              </div>
              <div class="price-item">
                <label>Child:</label>
                <span>MK${parseFloat(bus.single_child).toLocaleString()}</span>
              </div>
            </div>
            <div class="seats-info">
              <span class="seats-left ${isLowSeats ? 'low' : ''}">${bus.seats_left} seats left</span>
            </div>
            <button class="book-btn ${soldOut ? 'sold-out' : ''}" 
                    data-schedule="${bus.schedule_ID}"
                    ${soldOut ? 'disabled' : ''}>
              ${soldOut ? 'Sold Out' : 'Select Bus'}
            </button>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    modalBody.innerHTML = html;
    
    // Add event listeners to book buttons
    modalBody.querySelectorAll('.book-btn:not([disabled])').forEach(button => {
      button.addEventListener('click', function() {
        const scheduleId = this.getAttribute('data-schedule');
        selectBus(scheduleId);
      });
    });
  }

  function displayErrorMessage(message) {
    modalBody.innerHTML = `<div class="error"><p>${message}</p></div>`;
  }

  function selectBus(scheduleId) {
    selectedBusDetails = currentBusData.find(bus => bus.schedule_ID == scheduleId);
    
    if (selectedBusDetails) {
      hideModal(busModal);
      showConfirmationModal();
    }
  }

  function showConfirmationModal() {
    const html = `
      <h3>Confirm Your Bus Selection</h3>
      <div class="confirm-details">
        <div class="bus-summary">
          <h4>${selectedBusDetails.bus_number}</h4>
          <div class="route-info">
            <p><strong>From:</strong> ${searchInfo.origin}</p>
            <p><strong>To:</strong> ${searchInfo.destination}</p>
            <p><strong>Date:</strong> ${formatDisplayDate(searchInfo.date)}</p>
          </div>
          <div class="time-info">
            <p><strong>Departure:</strong> ${formatTime(selectedBusDetails.departure_time)}</p>
            <p><strong>Arrival:</strong> ${formatTime(selectedBusDetails.arrival_time)}</p>
          </div>
          <div class="capacity-info">
            <p><strong>Seats Available:</strong> ${selectedBusDetails.seats_left} of ${selectedBusDetails.capacity}</p>
          </div>
        </div>
      </div>
      <div class="confirm-actions">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-proceed">Proceed to Booking</button>
      </div>
    `;
    
    confirmModalBody.innerHTML = html;
    showModal(confirmModal);

    // Add event listeners
    confirmModalBody.querySelector('.btn-cancel').addEventListener('click', closeConfirmModalHandler);
    confirmModalBody.querySelector('.btn-proceed').addEventListener('click', proceedToBooking);
  }

  function proceedToBooking() {
    hideModal(confirmModal);
    showBookingModal();
  }

  function showBookingModal() {
    const html = `
      <h3>Complete Your Booking</h3>
      <form class="booking-form" id="finalBookingForm">
        <input type="hidden" name="schedule_id" value="${selectedBusDetails.schedule_ID}">
        <input type="hidden" name="travel_date" value="${searchInfo.date}">
        
        <div class="trip-summary">
          <h4>Trip Summary</h4>
          <p><strong>Route:</strong> ${searchInfo.origin} → ${searchInfo.destination}</p>
          <p><strong>Date:</strong> ${formatDisplayDate(searchInfo.date)}</p>
          <p><strong>Bus:</strong> ${selectedBusDetails.bus_number}</p>
          <p><strong>Departure:</strong> ${formatTime(selectedBusDetails.departure_time)}</p>
          <p><strong>Arrival:</strong> ${formatTime(selectedBusDetails.arrival_time)}</p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="ticket_type">Ticket Type</label>
            <select id="ticket_type" name="ticket_type" required>
              <option value="single">Single (One Way)</option>
              <option value="return">Return (Round Trip)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="passenger_type">Passenger Type</label>
            <select id="passenger_type" name="passenger_type" required>
              <option value="adult">Adult</option>
              <option value="child">Child (12 years & under)</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="num_seats">Number of Seats</label>
            <input type="number" id="num_seats" name="seats" min="1" max="${Math.min(selectedBusDetails.seats_left, 10)}" value="1" required>
            <small class="seat-limit">Maximum ${Math.min(selectedBusDetails.seats_left, 10)} seats per booking</small>
          </div>
        </div>

        <div class="price-calculation">
          <div class="price-breakdown">
            <p>Price per ticket: <span id="price-per-ticket">MK 0</span></p>
            <p>Number of seats: <span id="seat-count">1</span></p>
            <hr>
            <p class="total-price">Total: <span id="total-price">MK 0</span></p>
          </div>
        </div>

        <div class="payment-info">
          <h4>Payment Information</h4>
          <p><strong>Payment Method:</strong> Mobile Money</p>
          <p><small>After booking confirmation, you will receive payment instructions via SMS.</small></p>
        </div>

        <div class="booking-actions">
          <button type="button" class="btn-cancel">Cancel</button>
          <button type="submit" class="btn-book">
            <span class="btn-text">Confirm Booking</span>
            <span class="btn-loader" style="display: none;">Processing...</span>
          </button>
        </div>
      </form>
    `;
    
    bookingModalBody.innerHTML = html;
    showModal(bookingModal);
    
    // Add event listeners
    bookingModalBody.querySelector('.btn-cancel').addEventListener('click', closeBookingModalHandler);
    
    // Setup price calculation
    setupPriceCalculation();
    
    // Setup form submission
    setupBookingFormSubmission();
  }

  function setupPriceCalculation() {
    const ticketTypeSelect = document.getElementById('ticket_type');
    const passengerTypeSelect = document.getElementById('passenger_type');
    const numSeatsInput = document.getElementById('num_seats');
    
    function updatePrice() {
      const ticketType = ticketTypeSelect.value;
      const passengerType = passengerTypeSelect.value;
      const seats = parseInt(numSeatsInput.value) || 1;
      
      let pricePerTicket = 0;
      
      if (ticketType === 'single') {
        pricePerTicket = passengerType === 'adult' ? 
          parseFloat(selectedBusDetails.single_adult) : parseFloat(selectedBusDetails.single_child);
      } else {
        pricePerTicket = passengerType === 'adult' ? 
          parseFloat(selectedBusDetails.return_adult) : parseFloat(selectedBusDetails.return_child);
      }
      
      const totalPrice = pricePerTicket * seats;
      
      document.getElementById('price-per-ticket').textContent = `MK ${pricePerTicket.toLocaleString()}`;
      document.getElementById('seat-count').textContent = seats;
      document.getElementById('total-price').textContent = `MK ${totalPrice.toLocaleString()}`;
    }
    
    ticketTypeSelect.addEventListener('change', updatePrice);
    passengerTypeSelect.addEventListener('change', updatePrice);
    numSeatsInput.addEventListener('input', updatePrice);
    
    // Initial calculation
    updatePrice();
  }

  function setupBookingFormSubmission() {
    const form = document.getElementById('finalBookingForm');
    const submitBtn = form.querySelector('.btn-book');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Disable submit button
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline';
      
      const formData = new FormData(form);
      
      fetch('../php/booking.php', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          displayBookingSuccess(res);
        } else {
          displayBookingError(res.message);
        }
      })
      .catch(err => {
        console.error('Booking error:', err);
        displayBookingError('Unable to process booking. Please try again.');
      })
      .finally(() => {
        // Re-enable submit button
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
      });
    });
  }

  function displayBookingSuccess(response) {
    const details = response.booking_details;
    const html = `
      <div class="booking-success">
        <div class="success-icon">✅</div>
        <h3>Booking Confirmed!</h3>
        <p class="success-message">Your booking has been successfully created.</p>
        
        <div class="booking-summary">
          <h4>Booking Details</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Booking ID:</label>
              <span class="booking-id">${details.booking_id}</span>
            </div>
            <div class="detail-item">
              <label>Bus:</label>
              <span>${details.bus_number}</span>
            </div>
            <div class="detail-item">
              <label>Route:</label>
              <span>${details.route}</span>
            </div>
            <div class="detail-item">
              <label>Date:</label>
              <span>${formatDisplayDate(details.travel_date)}</span>
            </div>
            <div class="detail-item">
              <label>Departure:</label>
              <span>${formatTime(details.departure_time)}</span>
            </div>
            <div class="detail-item">
              <label>Seats:</label>
              <span>${details.seats} x ${details.passenger_type} (${details.ticket_type})</span>
            </div>
            <div class="detail-item total-amount">
              <label>Total Amount:</label>
              <span>MK ${details.total_amount}</span>
            </div>
            <div class="detail-item">
              <label>Status:</label>
              <span class="status-pending">${details.status}</span>
            </div>
          </div>
        </div>
        
        <div class="next-steps">
          <h4>Next Steps</h4>
          <ul>
            <li>Save your booking ID: <strong>${details.booking_id}</strong></li>
            <li>You will receive payment instructions shortly</li>
            <li>Complete payment to confirm your reservation</li>
            <li>Arrive at the station 30 minutes before departure</li>
          </ul>
        </div>
        
        <div class="success-actions">
          <button class="btn-print" onclick="printBookingDetails()">Print Details</button>
          <button class="btn-close">Close</button>
        </div>
      </div>
    `;
    
    bookingModalBody.innerHTML = html;
    
    // Add close button functionality
    bookingModalBody.querySelector('.btn-close').addEventListener('click', closeAllModals);
    
    // Show success notification
    showNotification('Booking created successfully!', 'success');
  }

  function displayBookingError(message) {
    const html = `
      <div class="booking-error">
        <div class="error-icon">❌</div>
        <h3>Booking Failed</h3>
        <p class="error-message">${message}</p>
        <div class="error-actions">
          <button class="btn-retry">Try Again</button>
          <button class="btn-close">Close</button>
        </div>
      </div>
    `;
    
    bookingModalBody.innerHTML = html;
    
    bookingModalBody.querySelector('.btn-retry').addEventListener('click', showBookingModal);
    bookingModalBody.querySelector('.btn-close').addEventListener('click', closeBookingModalHandler);
    
    showNotification(message, 'error');
  }

  // Utility Functions
  function formatTime(timeString) {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });

    // Show animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
  }

  function closeAllModals() {
    hideModal(busModal);
    hideModal(confirmModal);
    hideModal(bookingModal);
  }

  function printBookingDetails() {
    const printContent = document.querySelector('.booking-summary').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Booking Details</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .detail-grid { display: grid; gap: 10px; }
            .detail-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
            .total-amount { font-weight: bold; font-size: 1.2em; }
            .booking-id { font-weight: bold; color: #ff9900; }
          </style>
        </head>
        <body>
          <h2>BusBooking - Booking Confirmation</h2>
          ${printContent}
          <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
            Please keep this confirmation for your records and present it at the station.
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // Event Listeners for Modal Close Buttons
  if (closeBusModal) {
    closeBusModal.addEventListener('click', closeBusModalHandler);
  }

  if (closeConfirmModal) {
    closeConfirmModal.addEventListener('click', closeConfirmModalHandler);
  }

  if (closeBookingModal) {
    closeBookingModal.addEventListener('click', closeBookingModalHandler);
  }

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === busModal) {
      closeBusModalHandler();
    }
    if (e.target === confirmModal) {
      closeConfirmModalHandler();
    }
    if (e.target === bookingModal) {
      closeBookingModalHandler();
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (bookingModal.style.display === 'flex') {
        closeBookingModalHandler();
      } else if (confirmModal.style.display === 'flex') {
        closeConfirmModalHandler();
      } else if (busModal.style.display === 'flex') {
        closeBusModalHandler();
      }
    }
  });

  // Make functions globally available for onclick handlers
  window.closeConfirmModalHandler = closeConfirmModalHandler;
  window.closeBookingModalHandler = closeBookingModalHandler;
  window.closeBusModalHandler = closeBusModalHandler;
  window.proceedToBooking = proceedToBooking;
  window.closeAllModals = closeAllModals;
  window.printBookingDetails = printBookingDetails;

  // Mobile menu toggle
  const mobileMenu = document.querySelector('.mobile-menu');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenu && navLinks) {
    mobileMenu.addEventListener('click', function() {
      navLinks.classList.toggle('show');
    });
  }
});