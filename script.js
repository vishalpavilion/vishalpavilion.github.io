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

    // --- BOOKING PRICING HELPERS (added) ---
    // Deluxe Room: base price is for 2 adults. Mon-Fri base = 1500, Sat-Sun base = 3000.
    // Every adult beyond 2 adds a flat 500 surcharge (e.g. 3 adults on a weekday = 2000,
    // 3 adults on a weekend = 3500).
    // Party Hall: always a fixed 20,000, no per-adult calculation.
    const BASE_ADULTS = 2;
    const EXTRA_ADULT_CHARGE = 500;

    const getBookingAmount = (type, dateValue, adultsValue) => {
        if (type === 'Party Hall') {
            return 20000;
        }
        if (!dateValue) return 0;

        // Parse the yyyy-mm-dd value manually as a LOCAL date to avoid any
        // UTC/timezone day-shift issues from `new Date("yyyy-mm-dd")`.
        const [year, month, day] = dateValue.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        const dayOfWeek = localDate.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const baseAmount = isWeekend ? 3000 : 1500;

        const adults = parseInt(adultsValue, 10) || BASE_ADULTS;
        const extraAdults = Math.max(0, adults - BASE_ADULTS);

        return baseAmount + (extraAdults * EXTRA_ADULT_CHARGE);
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
    // Computed fresh from the real-time current date, so it works correctly
    // every day/year without any code changes.
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

    // --- LIVE TOTAL AMOUNT DISPLAY (added) ---
    const stayTypeEl = document.getElementById('stayType');
    const checkInEl = document.getElementById('checkIn');
    const adultsEl = document.getElementById('adults');
    const totalAmountBox = document.getElementById('totalAmountBox');
    const totalAmountValue = document.getElementById('totalAmountValue');

    const refreshTotalAmount = () => {
        const type = stayTypeEl.value;
        const dateValue = checkInEl.value;
        const adultsValue = adultsEl.value;

        // Only show the total once we have enough info to calculate it
        // (date is required for Deluxe Room; Party Hall only needs the type).
        const hasEnoughInfo = (type === 'Party Hall') || (dateValue && adultsValue);

        if (!hasEnoughInfo) {
            totalAmountBox.style.display = 'none';
            return;
        }

        const amount = getBookingAmount(type, dateValue, adultsValue);
        totalAmountValue.textContent = `₹${amount.toLocaleString('en-IN')}`;
        totalAmountBox.style.display = 'flex';
    };

    if (stayTypeEl) stayTypeEl.addEventListener('change', refreshTotalAmount);
    if (checkInEl) checkInEl.addEventListener('change', refreshTotalAmount);
    if (adultsEl) adultsEl.addEventListener('input', refreshTotalAmount);
    // --- END LIVE TOTAL AMOUNT DISPLAY ---

    // --- SYNC MODAL WITH THE CLICKED CARD (added) ---
    // Both "View Details" buttons (Deluxe Room card & Party Hall card) open the
    // SAME #bookModal. Without this, the dropdown always defaulted to whatever
    // option is first in the <select> ("Deluxe Room"), even when the Party Hall
    // button was clicked. This reads which button triggered the modal and sets
    // the dropdown to match automatically.
    const bookModalEl = document.getElementById('bookModal');
    if (bookModalEl) {
        bookModalEl.addEventListener('show.bs.modal', (e) => {
            const trigger = e.relatedTarget;
            const requestedType = trigger ? trigger.getAttribute('data-stay-type') : null;

            if (requestedType && stayTypeEl) {
                stayTypeEl.value = requestedType;
                // Fire the existing change handlers (updates the
                // adults/guests label AND the live total amount box)
                stayTypeEl.dispatchEvent(new Event('change'));
            } else {
                // Buttons without a specific type (e.g. the general
                // "BOOK YOUR ROYAL STAY NOW" / "INITIATE ENQUIRY" CTAs)
                // just refresh the display for whatever is currently selected.
                refreshTotalAmount();
            }
        });
    }
    // --- END SYNC MODAL WITH THE CLICKED CARD ---
    // --- END BOOKING PRICING HELPERS ---
    
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.getElementById('stayType').value;
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;
        const adults = document.getElementById('adults').value;
        const request = document.getElementById('specialRequest').value || "None";

        // Guard: block any accidental past-date submission (defense in depth
        // alongside the native min-date restriction on the input itself)
        const [ciY, ciM, ciD] = checkIn.split('-').map(Number);
        const selectedLocalDate = new Date(ciY, ciM - 1, ciD);
        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);
        if (selectedLocalDate < todayLocal) {
            alert('Please select today or a future check-in date.');
            return;
        }

        // Calculate booking amount (also shown live on the page above)
        const bookingAmount = getBookingAmount(type, checkIn, adults);
        const formattedAmount = bookingAmount.toLocaleString('en-IN');
        const formattedDate = formatBookingDate(checkIn);
        
        const phoneNumber = "919443058306";
        
        const message = `*Enquiry - Vishal Pavilion*%0a%0a` +
                        `*Selection:* ${type}%0a` +
                        `*Check-In:* ${checkIn}%0a` +
                        `*Check-Out:* ${checkOut}%0a` +
                        `*Adults:* ${adults}%0a` +
                        `*Booking Date:* ${formattedDate}%0a` +
                        `*Total Amount:* ₹${formattedAmount}%0a` +
                        `*Special Request:* ${request}`;
        
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;
        window.open(whatsappUrl, '_blank');
    });

    // 3. DYNAMIC FORM LABEL (Room vs Party Hall)
    const stayType = document.getElementById('stayType');
    const label = document.getElementById('occupancyLabel');
    
    stayType.addEventListener('change', () => {
        if(stayType.value === "Party Hall") {
            label.innerText = "Estimated Number of Guests";
        } else {
            label.innerText = "Number of Adults";
        }
    });
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
    galleryObserver.observe(gallerySection);

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
            lightbox.style.display = 'flex';
        });
    });

    const showImage = (index) => {
        const src = galleryItems[index].querySelector('img').src;
        lightboxImg.src = src;
    };

    document.querySelector('.close-lightbox').addEventListener('click', () => lightbox.style.display = 'none');
    
    document.querySelector('.next-lightbox').addEventListener('click', () => {
        currentImgIndex = (currentImgIndex + 1) % galleryItems.length;
        showImage(currentImgIndex);
    });

    document.querySelector('.prev-lightbox').addEventListener('click', () => {
        currentImgIndex = (currentImgIndex - 1 + galleryItems.length) % galleryItems.length;
        showImage(currentImgIndex);
    });

    // SWIPE SUPPORT (Simple)
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
    lightbox.addEventListener('touchend', e => {
        if (e.changedTouches[0].screenX < touchStartX - 50) document.querySelector('.next-lightbox').click();
        if (e.changedTouches[0].screenX > touchStartX + 50) document.querySelector('.prev-lightbox').click();
    });
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

    contactObserver.observe(contactSection);

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
