import React, { useState, useEffect, useCallback } from 'react';

interface CarouselProps {
    images: string[];
    autoPlay?: boolean;
    interval?: number;
    className?: string;
}

const Carousel: React.FC<CarouselProps> = ({
    images,
    autoPlay = true,
    interval = 5000,
    className = ''
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false); // État pour la pause

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        if (!autoPlay || !isPaused) return;
        const timer = setInterval(goToNext, interval);
        return () => clearInterval(timer);
    }, [autoPlay, interval, goToNext]);

    if (!images?.length) return null;

    return (
        <div className={`group relative overflow-hidden bg-gray-900 shadow-2xl rounded-[24px] ${className}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)} >

            {/* Conteneur de Slide (Le coeur du mouvement) */}
            <div
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.45,0,0.15,1)]"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((image, index) => (
                    <div key={index} className="relative w-full shrink-0 aspect-[16/9]">
                        <img
                            src={image}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover select-none"
                        />
                        {/* Overlay subtil */}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full 
                                 bg-black/20 hover:bg-white/20 backdrop-blur-xl border border-white/10 
                                 text-white transition-all duration-300 z-20
                                 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
                    >
                        <ChevronLeftIcon />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full 
                                 bg-black/20 hover:bg-white/20 backdrop-blur-xl border border-white/10 
                                 text-white transition-all duration-300 z-20
                                 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                    >
                        <ChevronRightIcon />
                    </button>
                </>
            )}

            {/* Pagination & Barre de progression */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 z-20">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`relative h-1.5 transition-all duration-500 rounded-full overflow-hidden
                                   ${index === currentIndex ? 'w-10 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                    >
                        {index === currentIndex && autoPlay && (
                            <div
                                className="absolute inset-0 bg-purple-400 origin-left animate-progress"
                                style={{ animationDuration: `${interval}ms` }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Badge Compteur */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-md bg-black/20 backdrop-blur-md border border-white/10 z-20">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/90 font-bold">
                    {String(currentIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                </p>
            </div>
        </div>
    );
};

const ChevronLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
);

export default Carousel;