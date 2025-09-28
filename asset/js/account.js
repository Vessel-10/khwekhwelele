function toggleForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    loginForm.classList.toggle('active');
    registerForm.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const loginFormEl = document.getElementById('loginForm');
    const registerFormEl = document.getElementById('registerForm');

    function showError(input, message) {
        const inputGroup = input.closest('.input-group');
        const errorSpan = inputGroup.querySelector('.error-message');
        if (errorSpan) {
            errorSpan.textContent = message;
        }
    }

    function clearError(input) {
        const inputGroup = input.closest('.input-group');
        const errorSpan = inputGroup.querySelector('.error-message');
        if (errorSpan) {
            errorSpan.textContent = '';
        }
    }

    function validateUsername(username) {
        if (username.length < 3) {
            return 'Username must be at least 3 characters long.';
        }
        return '';
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address.';
        }
        return '';
    }

    function validatePassword(password) {
        if (password.length < 6) {
            return 'Password must be at least 6 characters long.';
        }
        return '';
    }
            
    
    if (registerFormEl) {
        registerFormEl.addEventListener('submit', function(e) {
            e.preventDefault();
            let isValid = true;
                    
            this.querySelectorAll('input').forEach(input => clearError(input));

            const usernameInput = this.querySelector('input[name="full_name"]');
            const emailInput = this.querySelector('input[name="email"]');
            const passwordInput = this.querySelector('input[name="password"]');

            let usernameError = validateUsername(usernameInput.value.trim());
            if (usernameError) {
                showError(usernameInput, usernameError);
                isValid = false;
            }

            let emailError = validateEmail(emailInput.value.trim());
            if (emailError) {
                showError(emailInput, emailError);
                isValid = false;
            }

            let passwordError = validatePassword(passwordInput.value.trim());
            if (passwordError) {
                showError(passwordInput, passwordError);
                isValid = false;
            }

            if (isValid) {
                const formData = new FormData(this);
                fetch("asset/php/create.php", {
                    method: "POST",
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    alert(data.message); 
                    if (data.status === "success") {
                        window.location.href = "page.html";
                        this.reset();
                    }
                })
                .catch(err => console.error(err));
            }
        });
    }

    if (loginFormEl) {
        loginFormEl.addEventListener('submit', function(e) {
            e.preventDefault(); 
            let isValid = true;

            this.querySelectorAll('input').forEach(input => clearError(input));

            const emailInput = this.querySelector('input[name="email"]');
            const passwordInput = this.querySelector('input[name="password"]');

            let emailError = validateEmail(emailInput.value.trim());
            if (emailError) {
                showError(emailInput, emailError);
                isValid = false;
            }

            let passwordError = validatePassword(passwordInput.value.trim());
            if (passwordError) {
                showError(passwordInput, passwordError);
                isValid = false;
            }

            if (isValid) {
                const formData = new FormData(this);
                fetch("asset/php/login.php", {
                    method: "POST",
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    alert(data.message); 
                    if (data.status === "success") {
                        window.location.href = "asset/pages/home.html";
                    }
                })
                .catch(err => console.error(err));
            }
        });
    }
});