import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import MusicPlayer from "../components/MusicPlayer.jsx";
import IntroLogoToVideo from "../components/IntroToLogo.jsx";
import ArtistScroller from "../components/ArtistScroller.jsx";

gsap.registerPlugin(ScrollTrigger, useGSAP, SplitText);

export default function PruebasPage() {
  const sectionRef = useRef();
  const presentacion = useRef();
  const title1 = useRef();
  const img1 = useRef();
  const canvasRef = useRef();
  const araImg = useRef();
  const contenedorAra = useRef();
  const TOTAL_FRAMES = 76;

  useGSAP(() => {
        const split = new SplitText(presentacion.current, { type: "words" });
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

        gsap.from(split.words, {
                y: 10,
                autoAlpha: 0,
                filter: "blur(10px)",
                stagger: 0.1,
                duration: 0.5
            },0); 

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "-60 top", 
                end: "bottom top",
                scrub: true,
                markers: true
            }
        });

        tl.to(canvas, { autoAlpha: 1, duration: 0.1 }, 0);
        tl.to(visualizer, {
                frame: TOTAL_FRAMES - 1,
                snap: "frame",
                onUpdate: render,},0);
        tl.to(canvas, { autoAlpha: 0, duration: 0.1 }, .5);

        gsap.from(title1.current, {
            y: 50,
            autoAlpha: 0,
            duration: 1,
            ease: "expoScale",
            scrollTrigger: {
                trigger: title1.current,
                start: "top 90%",   
                end: "top 60%",
                scrub: true,
            }
        });

        gsap.from(img1.current, {
            scale: 0.8,
            autoAlpha: 0,
            duration: 0.6,
            ease: "back.out(1.2)",
            scrollTrigger: {
              trigger: img1.current,
              start: "top 85%",
              end: "top 65%",
              scrub: true,
            }
          });
          
        gsap.set(araImg.current, { autoAlpha: 0 });
        const textos = contenedorAra.current.querySelectorAll("p");
        gsap.set(textos, { autoAlpha: 0, y: 50 });

        // 2) Animación de la imagen al hacer scroll sobre todo el contenedor:
        gsap.to(araImg.current, {
            autoAlpha: 1,
            duration: 0.8,
            scrollTrigger: {
                trigger: contenedorAra.current,
                start:   "top center",   // cuando el top del contenedor llega al centro
                end:     "top 30%",       // hasta que el top del contenedor sube al 30% arriba
                scrub:   true,
            }
        });
        textos.forEach((p) => {
            gsap.to(p, {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: p,
                    start:   "top 90%",   // cuando el top del <p> entra al 90% del viewport
                    end:     "top 70%",   // hasta el 70%
                    scrub:   true,
                }
                });
            });
  }, []);

  return (
    <section className="bg-black h-[800vh]">
        <IntroLogoToVideo />
        <div className="h-auto flex flex-col align-center justify-start pt-32 gap-10">
            <img src="src/assets/logo-gaceta-blanco.png" alt="" className="w-1/5 mx-auto" />
            <p
                ref={presentacion}
                className="text-white font-inter font-normal text-xl leading-normal max-w-prose mb-4 tracking-tight mx-auto"
            >
                Somos una productora audiovisual y estudio creativo, especializada en el
                desarrollo de proyectos musicales. Nos enfocamos en crear piezas que
                conecten con la audiencia, combinando creatividad, estrategia y
                produccion de calidad.
            </p>
        </div>
        <div className="h-[160vh] relative" ref={sectionRef}>
            <canvas ref={canvasRef} className="w-full h-screen sticky top-0"></canvas>
        </div>
        <div className="relative h-[100vh] py-8 flex justify-evenly">
            <img src="src/assets/ramma-bstrap.jpeg" alt="" className="w-auto h-5/6" ref={img1}/>
            <p className="text-white text-7xl titulo mt-24 top-0 sticky"ref={title1} >de la <span>esperanza </span> <br />al <span className="cursiva">primer paso</span> </p>
        </div>
        <div className="relative h-[260vh]" ref={contenedorAra}>
                <img
                    ref={araImg}
                    src="src/assets/ara.png"
                    alt="Ara"
                    className="h-auto w-auto top-1/2 left-1/2 transform pt-20 -translate-x-1/2 -translate-y-1/2 z-10 sticky"
                />

            <div className=" space-y-72">
                <p className="w-2/5 text-right ml-auto mr-8 cursiva text-2xl text-white">
                    "Estoy tranquilo porque se que nos vamos worldwide"
                </p>
                <p className="w-2/5 text-left ml-8 cursiva text-2xl text-white">
                    "La respuesta que necesito está a mi lado, y sos vos..."
                </p>
                <p className="w-2/5 text-right ml-auto mr-8 cursiva text-2xl text-white">
                    "De tanto bien a veces pienso que nos hacemos mal"
                </p>
                <p className="w-2/5 text-left ml-8 cursiva text-2xl text-white">
                    "Soy otro mas que no perdio la fé"
                </p>
            </div>
        </div>
        <div>
            <MusicPlayer />
        </div>

        <ArtistScroller />
      
    </section>
  );
}
