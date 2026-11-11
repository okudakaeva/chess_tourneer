export class Carousel {
    #root;
    #track;
    #slides;
    #prevBtn;
    #nextBtn;
    #dots;
    #counter;
    #counterTotal;
    #index = 0;
    #visibleCount = 0;
    #intersect = null;
    #resizeObserver = null;
    #breakpointQueries = [];
    #autoplay = null;
    #isInitialized = false;
    #isScroll = false;
    #scrollTimeout = null;
    #ignoreInitialObserver = true;
    #lastTrackWidth = 0;

    #options = {
        trackSelector: '[data-carousel-track]',
        slideSelector: '[data-carousel-slide]',
        prevSelector: '.btn-prev',
        nextSelector: '.btn-next',
        dotsSelector: '[data-dot]',
        dotActive: 'active',
        counterSelector: '[data-carousel-current]',
        totalSelector: '[data-carousel-total]',
        breakpoints: [],
        defaultVisibleCount: 1,
        loop: false,
        autoplay: 0,
        stepByVisible: false,
    };

    constructor (rootSelector, options = {}) {
        this.#root = typeof rootSelector === 'string'
                ? document.querySelector(rootSelector)
                : rootSelector;

        if (!this.#root) {
            return;
        }

        this.#options = { ...this.#options, ...options };

        this.#track = this.#root.querySelector(this.#options.trackSelector);
        this.#slides = Array.from(this.#root.querySelectorAll(this.#options.slideSelector));
        this.#prevBtn = this.#root.querySelector(this.#options.prevSelector);
        this.#nextBtn = this.#root.querySelector(this.#options.nextSelector);
        this.#dots = Array.from(this.#root.querySelectorAll(this.#options.dotsSelector));
        this.#counter = this.#root.querySelector(this.#options.counterSelector);
        this.#counterTotal = this.#root.querySelector(this.#options.totalSelector);

        if (!this.#track || !this.#slides.length) {
            return;
        }

        this.#setupBreakpointListeners();
        this.#evaluateState();
    }

    #setupBreakpointListeners () {
        this.#breakpointQueries = this.#options.breakpoints.map((bp) => {
            const mql = window.matchMedia(bp.query);
            mql.addEventListener('change', this.#evaluateState);

            return { mql, visibleCount: bp.visibleCount };
        });
    }

    #calculateVisibleCount () {
        for (const item of this.#breakpointQueries) {
            if (item.mql.matches) {
                return item.visibleCount;
            }
        }

        return this.#options.defaultVisibleCount;
    }

    #evaluateState = () => {
        const nextVisibleCount = this.#calculateVisibleCount();

        if (nextVisibleCount <= 0) {
            this.#destroy();
            this.#visibleCount = 0;
            return;
        }

        if (nextVisibleCount !== this.#visibleCount) {
            this.#destroy();
            this.#visibleCount = nextVisibleCount;
            this.#init();
        }
    };

    #init () {
        if (this.#isInitialized) {
            return;
        }

        this.#isInitialized = true;
        this.#ignoreInitialObserver = true;
        this.#index = 0;
        this.#lastTrackWidth = this.#track.offsetWidth;
        this.#track.scrollTo({ left: 0, behavior: 'instant' });

        this.#bindEvents();
        this.#setupObserver();
        this.#setupResizeObserver();
        this.#updateUI();
        this.#startAutoplay();
    }

    #destroy () {
        if (!this.#isInitialized) {
            return;
        }

        this.#isInitialized = false;
        this.#stopAutoplay();
        clearTimeout(this.#scrollTimeout);
        this.#isScroll = false;

        if (this.#intersect) {
            this.#intersect.disconnect();
            this.#intersect = null;
        }

        if (this.#resizeObserver) {
            this.#resizeObserver.disconnect();
            this.#resizeObserver = null;
        }

        this.#prevBtn?.removeEventListener('click', this.#handlePrev);
        this.#nextBtn?.removeEventListener('click', this.#handleNext);
        this.#root.removeEventListener('mouseenter', this.#stopAutoplay);
        this.#root.removeEventListener('mouseleave', this.#startAutoplay);

        this.#dots.forEach((dot) => {
            dot.removeEventListener('click', dot._clickHandler);
            delete dot._clickHandler;
        });

        this.#track.scrollTo({ left: 0, behavior: 'instant' });
        this.#index = 0;
    }

    #bindEvents () {
        this.#prevBtn?.addEventListener('click', this.#handlePrev);
        this.#nextBtn?.addEventListener('click', this.#handleNext);

        this.#dots.forEach((dot, index) => {
            dot._clickHandler = () => this.goTo(index);
            dot.addEventListener('click', dot._clickHandler);
        });

        if (this.#options.autoplay > 0) {
            this.#root.addEventListener('mouseenter', this.#stopAutoplay);
            this.#root.addEventListener('mouseleave', this.#startAutoplay);
        }
    }

    #setupResizeObserver () {
        this.#resizeObserver = new ResizeObserver((entries) => {
            const newWidth = entries[0]?.contentRect.width;

            if (!newWidth || newWidth === this.#lastTrackWidth) {
                return;
            }

            this.#lastTrackWidth = newWidth;

            this.#isScroll = true;
            clearTimeout(this.#scrollTimeout);
            this.#scrollTimeout = setTimeout(this.#onScrollEnd, 150);

            if (this.#options.autoplay <= 0) {
                this.#index = 0;
                this.#track.scrollTo({ left: 0, behavior: 'instant' });
                this.#updateUI();
            } else {
                const currentSlide = this.#slides[this.#index];
                if (currentSlide) {
                    this.#track.scrollTo({ left: currentSlide.offsetLeft, behavior: 'instant' });
                }
            }
        });

        this.#resizeObserver.observe(this.#track);
    }

    #setupObserver () {
        this.#intersect = new IntersectionObserver(
                (entries) => {
                    if (this.#ignoreInitialObserver) {
                        this.#ignoreInitialObserver = false;
                        return;
                    }

                    if (this.#isScroll) {
                        return;
                    }

                    const visibleIndexes = entries
                            .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6)
                            .map((entry) => this.#slides.indexOf(entry.target))
                            .filter((idx) => idx !== -1);

                    if (visibleIndexes.length > 0) {
                        const firstVisibleIndex = Math.min(...visibleIndexes);
                        if (firstVisibleIndex !== this.#index) {
                            const maxIndex = this.#getMaxIndex();
                            this.#index = Math.min(firstVisibleIndex, maxIndex);
                            this.#updateUI();
                        }
                    }
                },
                {
                    root: this.#track,
                    threshold: 0.6,
                }
        );

        this.#slides.forEach((slide) => this.#intersect.observe(slide));
    }

    #getMaxIndex () {
        return Math.max(0, this.#slides.length - this.#visibleCount);
    }

    #getStep () {
        return this.#options.stepByVisible ? this.#visibleCount : 1;
    }

    #handlePrev = () => {
        const maxIndex = this.#getMaxIndex();
        const step = this.#getStep();

        if (this.#index > 0) {
            this.goTo(Math.max(0, this.#index - step));
        } else if (this.#options.loop) {
            this.goTo(maxIndex);
        }
    };

    #handleNext = () => {
        const maxIndex = this.#getMaxIndex();
        const step = this.#getStep();

        if (this.#index < maxIndex) {
            this.goTo(Math.min(maxIndex, this.#index + step));
        } else if (this.#options.loop) {
            this.goTo(0);
        }
    };

    #updateUI () {
        const maxIndex = this.#getMaxIndex();

        if (!this.#options.loop) {
            if (this.#prevBtn) this.#prevBtn.disabled = this.#index === 0;
            if (this.#nextBtn) this.#nextBtn.disabled = this.#index >= maxIndex;
        }

        if (this.#dots.length) {
            this.#dots.forEach((dot, idx) => {
                dot.classList.toggle(this.#options.dotActive, idx === this.#index);
            });
        }

        if (this.#counter && this.#counterTotal) {
            this.#counter.textContent = Math.min(this.#index + this.#visibleCount, this.#slides.length);
            this.#counterTotal.textContent = this.#slides.length;
        }
    }

    #startAutoplay = () => {
        if (this.#options.autoplay <= 0 || this.#autoplay) {
            return;
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        this.#autoplay = setInterval(() => {
            this.#handleNext();
        }, this.#options.autoplay);
    };

    #stopAutoplay = () => {
        if (this.#autoplay) {
            clearInterval(this.#autoplay);
            this.#autoplay = null;
        }
    };

    #onScrollEnd = () => {
        this.#isScroll = false;
        clearTimeout(this.#scrollTimeout);
    };

    goTo (index) {
        if (!this.#isInitialized) {
            return;
        }

        const maxIndex = this.#getMaxIndex();
        const targetIndex = Math.max(0, Math.min(index, maxIndex));
        const targetSlide = this.#slides[targetIndex];

        if (!targetSlide) {
            return;
        }

        this.#isScroll = true;
        clearTimeout(this.#scrollTimeout);
        this.#scrollTimeout = setTimeout(this.#onScrollEnd, 800);

        this.#index = targetIndex;
        this.#track.scrollTo({
            left: targetSlide.offsetLeft,
            behavior: 'smooth'
        });

        this.#updateUI();
    }
}
