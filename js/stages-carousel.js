export class StagesCarousel {
    #root;
    #track;
    #slides;
    #prevBtn;
    #nextBtn;
    #dotsContainer;
    #dots = [];
    #index = 0;
    #isInitialized = false;
    #intersection = null;
    #isScroll = false;
    #scrollTimeout = null;
    #options = {
        root: '.stages-carousel_track',
        slides: '.stages-carousel_slide',
        prevBtn: '.stages-carousel_btn--prev',
        nextBtn: '.stages-carousel_btn--next',
        dots: '.stages-carousel_dots',
        dot: 'stages-carousel_dot',
        dotActive: 'is-active',
    };

    constructor (selectorOrElement, options) {
        this.#root = typeof selectorOrElement === 'string'
                ? document.querySelector(selectorOrElement)
                : selectorOrElement;

        if (!this.#root) return;

        this.#options = { ...this.#options, ...options };
        this.#track = this.#root.querySelector(this.#options.root);
        this.#slides = Array.from(this.#root.querySelectorAll(this.#options.slides));
        this.#prevBtn = this.#root.querySelector(this.#options.prevBtn);
        this.#nextBtn = this.#root.querySelector(this.#options.nextBtn);
        this.#dotsContainer = this.#root.querySelector(this.#options.dots);
    }

    init () {
        if (this.#isInitialized || !this.#track || this.#slides.length === 0) {
            return;
        }

        this.#renderDots();
        this.#bindEvents();
        this.#initObserver();
        this.#isInitialized = true;
    }

    #renderDots () {
        if (!this.#dotsContainer) {
            return;
        }

        const fragment = document.createDocumentFragment();

        this.#slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add(this.#options.dot);

            if (index === 0) dot.classList.add(this.#options.dotActive);

            dot.addEventListener('click', () => this.goTo(index));
            fragment.appendChild(dot);
            this.#dots.push(dot);
        });

        this.#dotsContainer.appendChild(fragment);
    }

    #bindEvents () {
        this.#nextBtn?.addEventListener('click', this.next);
        this.#prevBtn?.addEventListener('click', this.prev);
        this.#track.addEventListener('scrollend', this.#onScrollEnd);
    }

    #onScrollEnd = () => {
        this.#isScroll = false;
        clearTimeout(this.#scrollTimeout);
    };

    #initObserver () {
        this.#intersection = new IntersectionObserver(
                (entries) => {
                    if (this.#isScroll) {
                        return;
                    }

                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        const visibleIndex = this.#slides.indexOf(entry.target);
                        if (visibleIndex !== -1 && visibleIndex !== this.#index) {
                            this.#index = visibleIndex;
                            this.#updateDots();
                        }
                    });
                },
                {
                    root: this.#track,
                    threshold: 0.6,
                }
        );

        this.#slides.forEach((slide) => this.#intersection.observe(slide));
    }

    #updateDots () {
        this.#dots.forEach((dot, idx) => {
            dot.classList.toggle(
                    this.#options.dotActive,
                    idx === this.#index
            );
        });
    }

    goTo (index) {
        if (!this.#isInitialized) {
            return;
        }

        const total = this.#slides.length;
        this.#index = ((index % total) + total) % total;

        this.#isScroll = true;
        clearTimeout(this.#scrollTimeout);
        this.#scrollTimeout = setTimeout(this.#onScrollEnd, 800);

        this.#track.scrollTo({
            left: this.#track.clientWidth * this.#index,
            behavior: 'smooth',
        });

        this.#updateDots();
    }

    next = () => {
        this.goTo(this.#index + 1);
    };

    prev = () => {
        this.goTo(this.#index - 1);
    };

    destroy () {
        if (!this.#isInitialized) {
            return;
        }

        this.#nextBtn?.removeEventListener('click', this.next);
        this.#prevBtn?.removeEventListener('click', this.prev);
        this.#track?.removeEventListener('scrollend', this.#onScrollEnd);
        clearTimeout(this.#scrollTimeout);

        this.#intersection?.disconnect();
        this.#intersection = null;

        if (this.#dotsContainer) this.#dotsContainer.innerHTML = '';
        this.#dots = [];
        this.#index = 0;

        if (this.#track) this.#track.scrollLeft = 0;

        this.#isInitialized = false;
    }
}
