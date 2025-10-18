import React from 'react'

type Props = {
    tech: string
    className?: string
}

const TechLogoComponent: React.FC<Props> = ({ tech, className }) => {
    const png = `/logos/${tech.replace(/\s+/g, '_')}.png`
    const svg = `/logos/${tech.replace(/\s+/g, '_')}.svg`
    const [src, setSrc] = React.useState<string>(png)

    // Reset to the intended png when the tech prop changes so we reload the image
    React.useEffect(() => {
        setSrc(png)
    }, [png, tech])

    React.useEffect(() => {
        // preload svg in background so switching is instant if needed
        const probe = new Image()
        probe.src = svg
        probe.onload = () => {
            // preloaded
        }
        probe.onerror = () => {
            // preload failed
        }
        return () => {
            probe.onload = null
            probe.onerror = null
        }
    }, [svg, tech])

    const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.currentTarget
        if (img.src && img.src.endsWith('.png')) {
            setSrc(svg)
        } else {
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
        }
    }

    return <img src={src} alt={tech} className={className || 'w-6 h-6 sm:w-8 sm:h-8 object-contain'} onError={onError} />
}

export default React.memo(TechLogoComponent)
