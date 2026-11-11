import { StagesCarousel } from './stages-carousel.js';

document.addEventListener('DOMContentLoaded', () => {
    const carousel = new StagesCarousel('.stages-screen_carousel', {
        root: '.stages-screen_carousel-track',
        slides: '.stages-screen_carousel-slide',
        prevBtn: '.stages-screen_carousel-controls--prev',
        nextBtn: '.stages-screen_carousel-controls--next',
        dots: '.stages-screen_carousel-controls--dots',
        dot: 'dot',
        dotActive: 'dot--active',
    });

    const rootStyles = getComputedStyle(document.documentElement);
    const scrennMediumSize = rootStyles.getPropertyValue('--screen-medium').trim();
    const mediaQuery = window.matchMedia(`(max-width: ${scrennMediumSize})`);

    const handleBreakpointChange = (event) => {
        if (event.matches) {
            carousel.init();
        } else {
            carousel.destroy();
        }
    };

    handleBreakpointChange(mediaQuery);
    mediaQuery.addEventListener('change', handleBreakpointChange);
});
