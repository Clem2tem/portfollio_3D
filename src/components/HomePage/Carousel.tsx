import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
    const [isFullscreen, setIsFullscreen] = useState(false);

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
        const shouldPause = isPaused || isFullscreen;
        if (!autoPlay || shouldPause) return;
        const timer = setInterval(goToNext, interval);
        return () => clearInterval(timer);
    }, [autoPlay, interval, goToNext, isPaused, isFullscreen]);

    // Bloquer le scroll du body en mode plein écran
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFullscreen]);

    if (!images?.length) return null;

    return (
        <>
            <div className={`group relative overflow-hidden bg-gray-900 shadow-2xl rounded-md ${className}`}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)} >

                {/* Conteneur de Slide (Le coeur du mouvement) */}
                <div
                    className="flex transition-transform duration-700 ease-[cubic-bezier(0.45,0,0.15,1)] cursor-pointer"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {images.map((image, index) => (
                        <div 
                            key={index} 
                            className="relative w-full shrink-0 aspect-[16/9] cursor-zoom-in"
                            onClick={() => setIsFullscreen(true)}
                        >
                            <img
                                src={image}
                                alt={`Slide ${index + 1}`}
                                className="w-full h-full object-cover select-none"
                            />
                            {/* Overlay subtil */}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full 
                                     bg-black/20 hover:bg-white/20 backdrop-blur-xl border border-white/10 
                                     text-white transition-all duration-300 z-20
                                     opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 cursor-pointer"
                        >
                            <ChevronLeftIcon />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); goToNext(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full 
                                     bg-black/20 hover:bg-white/20 backdrop-blur-xl border border-white/10 
                                     text-white transition-all duration-300 z-20
                                     opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 cursor-pointer"
                        >
                            <ChevronRightIcon />
                        </button>
                    </>
                )}

                {/* Pagination & Barre de progression */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 z-20">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                            className={`relative h-1.5 transition-all duration-500 rounded-full overflow-hidden
                                       ${index === currentIndex ? 'w-10 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                        >
                            {index === currentIndex && autoPlay && !isFullscreen && (
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

            {/* FULLSCREEN MODAL */}
            {isFullscreen && createPortal(
                <div 
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={() => setIsFullscreen(false)}
                >
                    <button 
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-6 right-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all z-[10000] hover:scale-110"
                    >
                        <XIcon className="w-8 h-8" />
                    </button>

                    <div 
                        className="relative w-full h-full max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
                             <div 
                                className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                            >
                                {images.map((img, idx) => (
                                    <div key={idx} className="w-full h-full shrink-0 flex items-center justify-center">
                                        <img 
                                            src={img} 
                                            className="max-w-full max-h-full object-contain select-none shadow-2xl"
                                            alt={`Fullscreen slide ${idx}`} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white hover:text-purple-400 hover:scale-110 transition-transform bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm shadow-xl"
                                >
                                    <ChevronLeftIcon className="w-10 h-10" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white hover:text-purple-400 hover:scale-110 transition-transform bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm shadow-xl"
                                >
                                    <ChevronRightIcon className="w-10 h-10" />
                                </button>
                            </>
                        )}
                        
                         <div className="absolute bottom-8 flex gap-2 p-3 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'}`}
                                />
                            ))}
                         </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

const ChevronLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
);

const XIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default Carousel;