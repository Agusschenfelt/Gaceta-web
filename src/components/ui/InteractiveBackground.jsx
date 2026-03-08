import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform float uScrollVelocity;
uniform vec2 uMouse;

varying vec2 vUv;

// Función de ruido clásico (Simplex)
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  
  // Distancia al mouse (para que el humo se aparte)
  float dist = distance(st, uMouse);
  float mouseEffect = smoothstep(0.3, 0.0, dist) * 0.5;

  // Coordenadas
  vec2 pos = st * 2.0; 
  
  // El scroll empuja el Y suavemente
  pos.y += uTime * 0.05 - (uScrollVelocity * 0.02);
  pos.x += uTime * 0.02;

  // Single-layer noise (Ultra fast)
  float n = snoise(pos) * 0.5 + 0.5;
  
  // Interacción del mouse
  n -= mouseEffect;

  // Base #0a0a0a
  vec3 bgColor = vec3(0.04, 0.04, 0.04);
  // Red #8d1e1e
  vec3 redColor = vec3(0.55, 0.12, 0.12);
  // Gold #dee5a0
  vec3 goldColor = vec3(0.87, 0.90, 0.63);

  // Mapear el ruido a colores
  vec3 color = bgColor;
  float intensity = smoothstep(0.4, 0.9, n);
  
  // Mezcla de humo rojo
  color = mix(bgColor, redColor, smoothstep(0.4, 0.7, n) * 0.4);
  
  // Puntas doradas vibrantes que aparecen si el scroll es muy rápido o el ruido es muy alto
  float goldThreshold = max(0.0, (uScrollVelocity * 0.02));
  color = mix(color, goldColor, smoothstep(0.7 - goldThreshold, 1.0, n) * 0.6);

  // Viñeta oscura (borde más negro)
  float vignette = st.x * st.y * (1.0 - st.x) * (1.0 - st.y);
  vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);

  gl_FragColor = vec4(color * vignette, 1.0);
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ShaderPlane = () => {
  const materialRef = useRef(null);
  const { size, viewport } = useThree();
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  let scrollVelY = useRef(0);
  let lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uScrollVelocity: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    [size.width, size.height]
  );

  useEffect(() => {
    const onMouseMove = (e) => {
      // Normalizar coordenadas (0 a 1) e Y invertido
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - (e.clientY / window.innerHeight);
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    // Calcular velocidad de scroll
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY.current;
    
    // Inercia de velocidad (lerp para suavidad)
    scrollVelY.current = THREE.MathUtils.lerp(scrollVelY.current, scrollDelta, 0.1);
    lastScrollY.current = currentScrollY;

    // Update uniforms
    materialRef.current.uniforms.uTime.value += delta;
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    materialRef.current.uniforms.uScrollVelocity.value = scrollVelY.current;
    
    // Lerp del mouse para sensación de arrastre viscoso en el humo
    materialRef.current.uniforms.uMouse.value.lerp(mouseRef.current, 0.05);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

export default function InteractiveBackground({ children }) {
  return (
    <div className="relative min-h-screen w-full">
      {/* CAPA 1: FONDO WEBGL */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0a0a0a]">
        <Canvas 
          camera={{ position: [0, 0, 1] }} 
          dpr={1} 
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <ShaderPlane />
        </Canvas>
      </div>
      
      {/* CAPA 2: CONTENIDO */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
