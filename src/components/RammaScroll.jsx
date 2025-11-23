import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

export default function RammaScroll() {
    const canvasRef = useRef();
    const sectionRef = useRef();
    const TOTAL_FRAMES = 76;
    useGSAP(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width  = 1920;
        canvas.height = 1080;

        const createURL = (frame) => {
            const id = frame.toString().padStart(4, '0');
            return `/assets/ramma-bstrap-frames/frame_${id}.png` 
        }

        const images = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
            const img = new Image();
            img.src = createURL(i);
            return img;
        })

        const visualizer = {
            frame: 1
        }

        function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(images[visualizer.frame], 0, 0, canvas.width, canvas.height);
        }

        gsap.set(canvas, { autoAlpha: 0 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "-150 top", 
                end: "bottom top",
                scrub: true,
            }
        });

        tl.to(canvas, { autoAlpha: 1, duration: 0.1 }, 0);
        tl.to(visualizer, {
                frame: TOTAL_FRAMES - 1,
                snap: "frame",
                onUpdate: render,},0);
        tl.to(canvas, { autoAlpha: 0, duration: 0.1 }, .5);
    });

    return (
        <div className="h-[250vh] relative" ref={sectionRef}>
            <canvas ref={canvasRef} className="w-full h-screen sticky top-0"></canvas>
        </div>
    )
}