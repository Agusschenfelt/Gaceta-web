import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, PresentationControls, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

// El modelo sería idealmente the remera, pero un cilindro distorsionado puede actuar de vinilo o exhibidor abstracto.
function AbstractMerch({ hovered }) {
  const mesh = useRef();
  
  // Animar la rotación constantemente y reaccionar al hover
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * (hovered ? 1.5 : 0.2);
      mesh.current.rotation.x = THREE.MathUtils.lerp(
        mesh.current.rotation.x,
        hovered ? 0.3 : 0.1,
        0.1
      );
      // Efecto escala respiración
      const scaleTarget = hovered ? 1.2 : 0.9;
      mesh.current.scale.setScalar(
          THREE.MathUtils.lerp(mesh.current.scale.x, scaleTarget, 0.1)
      );
    }
  });

  return (
    <Float speed={hovered ? 4 : 2} rotationIntensity={0.5} floatIntensity={hovered ? 2 : 0.5}>
      <mesh ref={mesh} castShadow receiveShadow>
        {/* Un TorusKnot hace de exhibidor premium escultorico si no hay Asset de ropa */}
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <MeshTransmissionMaterial 
          backside={false}
          samples={2} // Reduced from 4
          thickness={0.1}
          roughness={0.4}
          ior={1}
          chromaticAberration={0} // Expensive
          anisotropy={0.1}
          color="var(--color-secundario)"
          metalness={0.5}
          resolution={128} // Forzar render frame target a muy baja res
        />
      </mesh>
    </Float>
  );
}

export default function Merch3DCard() {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
        className="relative w-full h-[400px] bg-fondo rounded-sm overflow-hidden"
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
    >
      <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={1} gl={{ antialias: false }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            
            <AbstractMerch hovered={hovered} />
            
            {/* Environment y ContactShadows son muy pesados, reducimos resolución paramétrica */}
            <Environment preset="city" resolution={128} />
            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={1} far={4} frames={1} />
          </Canvas>
      </div>

      <div className="absolute bottom-6 left-6 z-10 pointer-events-none mix-blend-difference">
         <h4 className="font-serif italic text-2xl text-white">Exclusive Drop</h4>
         <p className="text-white/60 font-mono text-xs uppercase tracking-widest">Agotado Temporalmente</p>
      </div>
      
      {/* Glitch red pulse on hover */}
      <div className={`absolute inset-0 bg-red-900/10 pointer-events-none transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} style={{ mixBlendMode: 'screen'}} />
    </div>
  );
}
