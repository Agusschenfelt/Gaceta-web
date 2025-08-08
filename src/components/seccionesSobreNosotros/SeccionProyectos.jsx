import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function SeccionProyectos() {
  const sectionRef = useRef();
  const canvasRef  = useRef();
  const TOTAL_FRAMES = 107;

  useGSAP(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    canvas.width  = 960;
    canvas.height = 544;

    const createURL = (frame) => {
        const id = frame.toString().padStart(4, '0');
        return `/assets/visualizer-frames/frame_${id}.png`; 
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

    console.log(images.length)
    gsap.to(visualizer, {
        frame: TOTAL_FRAMES - 1,
        ease: "none",
        snap: "frame",
        scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            markers: true,
            pin: true,
        },
        onUpdate: render
    });

  }, []);

  return (
    <section ref={sectionRef} className="h-[300vh] w-full relative">
            <canvas ref={canvasRef} className="w-screen h-[50vh]" />
    </section>
  );
}
