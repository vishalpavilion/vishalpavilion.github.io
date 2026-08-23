document.addEventListener('DOMContentLoaded', () => {
    const loaderWrapper = document.getElementById('loader-wrapper');
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    // 1. LOADER LOGIC
    setTimeout(() => {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
        
        // Fully remove loader from DOM after animation
        setTimeout(() => {
            if(loaderWrapper) loaderWrapper.style.display = 'none';
        }, 1500);
    }, 2500);

    // 2. CURSOR TRACKING
    document.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        dot.style.transform = `translate(${posX}px, ${posY}px)`;
        
        ring.animate({
            transform: `translate(${posX}px, ${posY}px)`
        }, { duration: 400, fill: "forwards" });
    });

    // 3. 3D PARALLAX (Desktop Performance Only)
    if (window.innerWidth > 992) {
        const heroBg = document.getElementById('hero-bg-parallax');
        const heroFrame = document.querySelector('.imperial-frame');

        document.addEventListener('mousemove', (e) => {
            let x = (window.innerWidth / 2 - e.clientX) / 50;
            let y = (window.innerHeight / 2 - e.clientY) / 50;

            heroBg.style.transform = `scale(1.1) translate(${x}px, ${y}px)`;
            heroFrame.style.transform = `rotateY(${-x}deg) rotateX(${y}deg)`;
        });
    }

    // 4. NAV SCROLL EFFECT
    const nav = document.querySelector('.imperial-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.padding = '8px 0';
            nav.style.background = 'rgba(80, 0, 0, 0.98)';
        } else {
            nav.style.padding = '15px 0';
            nav.style.background = 'rgba(102, 0, 0, 0.95)';
        }
    });

    // 5. INTERACTIVE ELEMENT HOVER
    const interactive = document.querySelectorAll('a, button, .luxury-card');
    interactive.forEach(el => {
        el.addEventListener('mouseenter', () => {
            ring.style.width = '60px';
            ring.style.height = '60px';
            ring.style.borderColor = '#f9e27d';
            ring.style.backgroundColor = 'rgba(197, 160, 89, 0.1)';
        });
        el.addEventListener('mouseleave', () => {
            ring.style.width = '35px';
            ring.style.height = '35px';
            ring.style.borderColor = '#c5a059';
            ring.style.backgroundColor = 'transparent';
        });
    });
});


// Add this inside your existing DOMContentLoaded listener
const aboutImgFrame = document.getElementById('about-parallax-img');

if (aboutImgFrame && window.innerWidth > 992) {
    document.addEventListener('mousemove', (e) => {
        let x = (window.innerWidth / 2 - e.clientX) / 50;
        let y = (window.innerHeight / 2 - e.clientY) / 50;

        // Image frame tilt based on mouse position
        aboutImgFrame.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
    });
}

// Scroll Entrance Observer (For smoother reveal)
const observerOptions = { threshold: 0.2 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('entrance-anim-active');
        }
    });
}, observerOptions);

document.querySelectorAll('.entrance-anim').forEach(el => observer.observe(el));

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. AUTO SLIDESHOW LOGIC
    const suites = document.querySelectorAll('.luxury-card-3d');
    
    suites.forEach(suite => {
        let currentSlide = 0;
        const images = suite.querySelectorAll('.slide-img');
        
        setInterval(() => {
            images[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % images.length;
            images[currentSlide].classList.add('active');
        }, 4000); // Change image every 4 seconds
    });

    // 2. WHATSAPP FORM LOGIC
    const bookingForm = document.getElementById('whatsappForm');

    // --- DYNAMIC CLOUD DATABASE ENGINE PRICING LOGIC ---
    let extraMattressPriceCached = 500;
    let deluxeRulesCached = [];
    let hallRulesCached = [];

    const initializeLivePriceEngines = () => {
        db.collection("configuration").doc("pricing_config").onSnapshot((doc) => {
            if (doc.exists) {
                extraMattressPriceCached = doc.data().extra_mattress_price || 0;
            }
            refreshTotalAmount();
        });

        db.collection("deluxe_rules").onSnapshot((snapshot) => {
            deluxeRulesCached = [];
            snapshot.forEach(doc => deluxeRulesCached.push(doc.data()));
            refreshTotalAmount();
        });

        db.collection("party_hall_rules").onSnapshot((snapshot) => {
            hallRulesCached = [];
            snapshot.forEach(doc => hallRulesCached.push(doc.data()));
            refreshTotalAmount();
        });
    };

    // Only hook into Firebase live pricing if it's actually loaded on this page.
    // Without this guard, a missing `db` throws and silently kills every listener
    // below it (form submit, live total display, etc.) — that was causing the
    // page to hard-refresh on "Send WhatsApp Enquiry" and the total to never show.
    if (typeof db !== 'undefined' && db) {
        try {
            initializeLivePriceEngines();
        } catch (err) {
            console.warn('Live pricing engine failed to start, using default rates.', err);
        }
    } else {
        console.warn('Firebase not loaded on this page — using default pricing (₹1500 base, weekend double, ₹500/extra adult).');
    }

    // Returns true if the given Date falls on Saturday or Sunday
    const isWeekendDate = (dateObj) => {
        const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
        return day === 0 || day === 6;
    };

    // Nightly base rate for ONE specific calendar date (admin overrides win; otherwise
    // weekday/weekend rate applies for the Deluxe Room, Party Hall stays flat).
    const getNightlyRate = (type, dateStr) => {
        const targetRules = type === 'Party Hall' ? hallRulesCached : deluxeRulesCached;

        let customMatchedAmount = null;
        targetRules.forEach(rule => {
            if (dateStr >= rule.startDate && dateStr <= rule.endDate) {
                customMatchedAmount = parseInt(rule.amount, 10);
            }
        });

        if (type === 'Party Hall') {
            return customMatchedAmount !== null ? customMatchedAmount : 20000;
        }

        // Deluxe Room
        if (customMatchedAmount !== null) {
            return customMatchedAmount;
        }

        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const baseAmount = 1500;
        return isWeekendDate(dateObj) ? baseAmount * 2 : baseAmount;
    };

    // Total amount across the full stay: sums the nightly rate for every night between
    // check-in (inclusive) and check-out (exclusive), plus the extra-adult surcharge per night.
    // Party Hall is a single flat booking, not charged per night.
    const getBookingAmount = (type, checkInValue, checkOutValue, adultsValue) => {
        if (!checkInValue) return 0;

        if (type === 'Party Hall') {
            return getNightlyRate(type, checkInValue);
        }

        const [ciY, ciM, ciD] = checkInValue.split('-').map(Number);
        const checkInDate = new Date(ciY, ciM - 1, ciD);

        let nights = 1;
        if (checkOutValue) {
            const [coY, coM, coD] = checkOutValue.split('-').map(Number);
            const checkOutDate = new Date(coY, coM - 1, coD);
            const diffDays = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) nights = diffDays;
        }

        const adults = parseInt(adultsValue, 10) || 2;
        const extraAdults = Math.max(0, adults - 2);

        let total = 0;
        for (let i = 0; i < nights; i++) {
            const nightDate = new Date(checkInDate);
            nightDate.setDate(nightDate.getDate() + i);
            const y = nightDate.getFullYear();
            const m = String(nightDate.getMonth() + 1).padStart(2, '0');
            const d = String(nightDate.getDate()).padStart(2, '0');
            const nightDateStr = `${y}-${m}-${d}`;

            total += getNightlyRate(type, nightDateStr) + (extraAdults * extraMattressPriceCached);
        }

        return total;
    };

    // Format a yyyy-mm-dd value as "15 August 2026"
    const formatBookingDate = (dateValue) => {
        const [year, month, day] = dateValue.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        return localDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Restrict the date pickers so users can only pick today or a future date.
    const setMinDateToday = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const checkInEl = document.getElementById('checkIn');
        const checkOutEl = document.getElementById('checkOut');
        if (checkInEl) checkInEl.setAttribute('min', todayStr);
        if (checkOutEl) checkOutEl.setAttribute('min', todayStr);
    };
    setMinDateToday();

    // --- LIVE TOTAL AMOUNT DISPLAY ---
    const stayTypeEl = document.getElementById('stayType');
    const checkInEl = document.getElementById('checkIn');
    const checkOutEl = document.getElementById('checkOut');
    const adultsEl = document.getElementById('adults');
    const totalAmountBox = document.getElementById('totalAmountBox');
    const totalAmountValue = document.getElementById('totalAmountValue');

    const refreshTotalAmount = () => {
        if (!stayTypeEl || !checkInEl || !adultsEl) return;
        const type = stayTypeEl.value;
        const checkInValue = checkInEl.value;
        const checkOutValue = checkOutEl ? checkOutEl.value : '';
        const adultsValue = adultsEl.value;

        const hasEnoughInfo = (type === 'Party Hall') ? !!checkInValue : (checkInValue && adultsValue);

        if (!hasEnoughInfo) {
            if (totalAmountBox) totalAmountBox.style.display = 'none';
            return;
        }

        const amount = getBookingAmount(type, checkInValue, checkOutValue, adultsValue);
        if (totalAmountValue) totalAmountValue.textContent = `₹${amount.toLocaleString('en-IN')}`;
        if (totalAmountBox) totalAmountBox.style.display = 'flex';
    };

    if (stayTypeEl) stayTypeEl.addEventListener('change', refreshTotalAmount);
    if (checkInEl) checkInEl.addEventListener('change', refreshTotalAmount);
    if (checkOutEl) checkOutEl.addEventListener('change', refreshTotalAmount);
    if (adultsEl) adultsEl.addEventListener('input', refreshTotalAmount);

    // --- SYNC MODAL WITH THE CLICKED CARD ---
    const bookModalEl = document.getElementById('bookModal');
    if (bookModalEl) {
        bookModalEl.addEventListener('show.bs.modal', (e) => {
            const trigger = e.relatedTarget;
            const requestedType = trigger ? trigger.getAttribute('data-stay-type') : null;

            if (requestedType && stayTypeEl) {
                stayTypeEl.value = requestedType;
                stayTypeEl.dispatchEvent(new Event('change'));
            } else {
                refreshTotalAmount();
            }
        });
    }
    
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.getElementById('stayType').value;
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;
        const adults = document.getElementById('adults').value;
        const request = document.getElementById('specialRequest').value || "None";

        const [ciY, ciM, ciD] = checkIn.split('-').map(Number);
        const selectedLocalDate = new Date(ciY, ciM - 1, ciD);
        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);
        if (selectedLocalDate < todayLocal) {
            alert('Please select today or a future check-in date.');
            return;
        }

        const bookingAmount = getBookingAmount(type, checkIn, checkOut, adults);
        const formattedAmount = bookingAmount.toLocaleString('en-IN');
        const formattedDate = formatBookingDate(checkIn);
        
        const phoneNumber = "916379028897"; // Vishal Pavilion WhatsApp number
        
        const message = `*Enquiry - Vishal Pavilion*%0a%0a` +
                        `*Selection:* ${type}%0a` +
                        `*Check-In:* ${checkIn}%0a` +
                        `*Check-Out:* ${checkOut}%0a` +
                        `*Adults:* ${adults}%0a` +
                        `*Booking Date:* ${formattedDate}%0a` +
                        `*Total Amount:* ₹${formattedAmount}%0a` +
                        `*Extra Mattress:* ₹${extraMattressPriceCached}%0a` +
                        `*Special Request:* ${request}`;
        
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;
        window.open(whatsappUrl, '_blank');
    });

    // 3. DYNAMIC FORM LABEL (Room vs Party Hall)
    const stayType = document.getElementById('stayType');
    const label = document.getElementById('occupancyLabel');
    
    if (stayType && label) {
        stayType.addEventListener('change', () => {
            if(stayType.value === "Party Hall") {
                label.innerText = "Estimated Number of Guests";
            } else {
                label.innerText = "Number of Adults";
            }
        });
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const gallerySection = document.getElementById('gallery');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    let currentImgIndex = 0;

    // 1. DYNAMIC COLLAPSE/ASSEMBLE LOGIC
    const galleryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                gallerySection.classList.add('gallery-active');
            } else {
                gallerySection.classList.remove('gallery-active');
            }
        });
    }, { threshold: 0.15 });
    if (gallerySection) galleryObserver.observe(gallerySection);

    // 2. CATEGORY FILTERING
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;

            galleryItems.forEach(item => {
                if (filter === 'all' || item.dataset.cat === filter) {
                    item.style.display = 'block';
                    setTimeout(() => item.style.opacity = '1', 10);
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => item.style.display = 'none', 400);
                }
            });
        });
    });

    // 3. LIGHTBOX LOGIC
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            currentImgIndex = index;
            showImage(index);
            if (lightbox) lightbox.style.display = 'flex';
        });
    });

    const showImage = (index) => {
        if (!galleryItems[index]) return;
        const src = galleryItems[index].querySelector('img').src;
        if (lightboxImg) lightboxImg.src = src;
    };

    const closeBtn = document.querySelector('.close-lightbox');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (lightbox) lightbox.style.display = 'none';
        });
    }
    
    const nextBtn = document.querySelector('.next-lightbox');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentImgIndex = (currentImgIndex + 1) % galleryItems.length;
            showImage(currentImgIndex);
        });
    }

    const prevBtn = document.querySelector('.prev-lightbox');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentImgIndex = (currentImgIndex - 1 + galleryItems.length) % galleryItems.length;
            showImage(currentImgIndex);
        });
    }

    // SWIPE SUPPORT (Simple)
    let touchStartX = 0;
    if (lightbox) {
        lightbox.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
        lightbox.addEventListener('touchend', e => {
            if (e.changedTouches[0].screenX < touchStartX - 50 && nextBtn) nextBtn.click();
            if (e.changedTouches[0].screenX > touchStartX + 50 && prevBtn) prevBtn.click();
        });
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const contactSection = document.getElementById('contact');
    
    // 1. Reveal Observer
    const contactObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                contactSection.classList.add('active-contact');
            } else {
                contactSection.classList.remove('active-contact');
            }
        });
    }, { threshold: 0.1 }); 

    if (contactSection) contactObserver.observe(contactSection);

    // 2. Desktop 3D Tilt Logic
    if (window.innerWidth > 992) {
        const cards = document.querySelectorAll('.card-inner');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`;
            });
        });
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const brandLink = document.getElementById('matrix-brand-hover');
    const glitterBox = document.getElementById('glitter-container');
    let dustInterval;

    function createDust() {
        if (!glitterBox) return;
        const colors = ['#FF0000', '#FFFFFF', '#FF8888'];
        for (let i = 0; i < 6; i++) {
            const dust = document.createElement('div');
            dust.className = 'star-dust';
            dust.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const x = (Math.random() - 0.5) * 80 + 'px';
            const y = (Math.random() - 0.5) * 80 + 'px';
            dust.style.setProperty('--x', x);
            dust.style.setProperty('--y', y);
            
            dust.style.left = '50%';
            dust.style.top = '50%';
            
            glitterBox.appendChild(dust);
            setTimeout(() => dust.remove(), 1000);
        }
    }

    if(brandLink) {
        brandLink.addEventListener('mouseenter', () => {
            dustInterval = setInterval(createDust, 150);
        });

        brandLink.addEventListener('mouseleave', () => {
            clearInterval(dustInterval);
        });

        brandLink.addEventListener('click', createDust);
    }
});

// --- ROYAL SPARKLE AMBIENCE (hero gold dust particles) ---
document.addEventListener('DOMContentLoaded', () => {
    const heroWrap = document.querySelector('.hero-wrap');
    if (!heroWrap) return;

    const sparkleLayer = document.createElement('div');
    sparkleLayer.className = 'royal-sparkle-layer';
    heroWrap.appendChild(sparkleLayer);

    const spawnSparkle = () => {
        const sparkle = document.createElement('span');
        sparkle.className = 'royal-sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.animationDuration = (4 + Math.random() * 4) + 's';
        sparkle.style.animationDelay = (Math.random() * 2) + 's';
        sparkle.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
        sparkleLayer.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 9000);
    };

    for (let i = 0; i < 25; i++) {
        setTimeout(spawnSparkle, i * 200);
    }
    setInterval(spawnSparkle, 350);
});
