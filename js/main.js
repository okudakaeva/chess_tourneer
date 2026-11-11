import { Carousel } from './carousel.js';

document.addEventListener('DOMContentLoaded', () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const screenMinSize = rootStyles.getPropertyValue('--tablet-plus-portrait').trim();
    const screenMidSize = rootStyles.getPropertyValue('--screen-small').trim();
    const screenBigSize = rootStyles.getPropertyValue('--screen-medium').trim();

    document.querySelectorAll('.marquee-content')
            .forEach((track) => {
                const items = Array.from(track.children);
                items.forEach((item) => {
                    const clone = item.cloneNode(true);
                    clone.setAttribute('aria-hidden', 'true');
                    track.appendChild(clone);
                });
            });

    const stagesCarouselOpts = {
        trackSelector: '.stages-screen_carousel-track',
        slideSelector: '.stages-screen_carousel-slide',
        prevSelector: '.stages-screen_carousel-controls--prev',
        nextSelector: '.stages-screen_carousel-controls--next',
        dotsSelector: '.dot',
        dotActive: 'dot--active',
        defaultVisibleCount: 0,
        breakpoints: [
            { query: `(max-width: ${screenBigSize})`, visibleCount: 1 }
        ],
        loop: false
    };

    const fragment = document.createDocumentFragment();

    document.querySelectorAll(stagesCarouselOpts.slideSelector)
            .forEach((_, index) => {
                const dot = document.createElement('span');
                dot.classList.add(stagesCarouselOpts.dotsSelector.split('.')[1]);

                if (index === 0) {
                    dot.classList.add(stagesCarouselOpts.dotActive);
                }

                fragment.appendChild(dot);
            });

    document.querySelector('.stages-screen_carousel-controls--dots')
            .appendChild(fragment);

    new Carousel('.stages-screen_carousel', stagesCarouselOpts);

    new Carousel('.participants-screen_carousel', {
        trackSelector: '.participants-screen_carousel-track',
        slideSelector: '.participants-screen_carousel-card',
        prevSelector: '.participants-screen_carousel-controls--prev',
        nextSelector: '.participants-screen_carousel-controls--next',
        loop: true,
        autoplay: 4000,
        stepByVisible: true,
        defaultVisibleCount: 3,
        breakpoints: [
            { query: `(max-width: ${screenMinSize})`, visibleCount: 1 },
            { query: `(max-width: ${screenMidSize})`, visibleCount: 2 }
        ]
    });
});
