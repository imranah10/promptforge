import React, { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, PerspectiveCamera, OrbitControls, Html, ContactShadows, Environment, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const FeatureSphere = ({ position, title, desc, index }) => {
  const mesh = useRef();
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (mesh.current) {
      mesh.current.position.y = position[1] + Math.sin(time + index) * 0.4;
      mesh.current.rotation.y += 0.005;
      mesh.current.rotation.z += 0.002;
    }
  });

  return (
    <group position={position} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)} onClick={() => setActive(!active)}>
      <Float speed={4} rotationIntensity={1.5} floatIntensity={1.5}>
        <mesh ref={mesh} scale={active ? 2.5 : hovered ? 1.4 : 1.2}>
          <sphereGeometry args={[0.8, 64, 64]} />
          <MeshDistortMaterial 
            color={hovered || active ? "#7c5cfc" : "#38bdf8"}
            speed={3} 
            distort={0.4} 
            roughness={0.1}
            metalness={1}
          />
        </mesh>
      </Float>

      {active && (
        <Html position={[0, -2, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
          <div style={{
            background: 'rgba(10, 10, 20, 0.95)',
            border: '2px solid #7c5cfc',
            padding: '24px',
            borderRadius: '20px',
            width: '320px',
            textAlign: 'center',
            backdropFilter: 'blur(30px)',
            boxShadow: '0 0 40px rgba(124, 92, 252, 0.4)',
            color: 'white',
            fontFamily: 'Outfit, sans-serif'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7c5cfc', fontSize: '20px', fontWeight: 800 }}>{title}</h4>
            <p style={{ margin: 0, color: '#e0e0ff', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
          </div>
        </Html>
      )}

      <Text
        position={[0, 1.8, 0]}
        fontSize={0.3}
        color="white"
        font="https://fonts.gstatic.com/s/outfit/v11/QGYtz_9ZTumCDv5_OR46.woff"
        anchorX="center"
        anchorY="middle"
        opacity={hovered ? 1 : 0.5}
      >
        {title}
      </Text>
    </group>
  );
};

const ExplodingObjects = () => {
  const features = useMemo(() => [
    { title: "Universal Access", desc: "Connect to any model via standard BYOK protocols." },
    { title: "Quantum Security", desc: "Your keys never leave your device. 100% end-to-end encryption." },
    { title: "Real-time Sync", desc: "Sub-millisecond latency for ultra-responsive AI interactions." },
    { title: "Adaptive Scaling", desc: "Autoscaling architecture built for enterprise production." }
  ], []);

  return (
    <div id="architecture" style={{ 
      width: '100%', 
      height: '700px', 
      background: '#030308', 
      borderRadius: '48px', 
      overflow: 'hidden', 
      border: '1px solid rgba(124, 92, 252, 0.3)', 
      position: 'relative', 
      boxShadow: '0 40px 100px rgba(0,0,0,0.8)' 
    }}>
      {/* Cinematic Background Image for Architecture */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url("/ai_neural_nodes_visual_1778616393421.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.88,
        filter: 'brightness(1.1) saturate(1.3) contrast(1.1)',
        pointerEvents: 'none'
      }}></div>

      {/* Elegant glass overlay to ensure high readability of text on top of the image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(3, 3, 8, 0.85) 0%, rgba(3, 3, 8, 0.35) 60%, rgba(3, 3, 8, 0.9) 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }}></div>

      <div style={{ position: 'absolute', top: '50px', left: '50px', zIndex: 10 }}>
        <div style={{ color: '#7c5cfc', fontWeight: 800, letterSpacing: '3px', fontSize: '11px', marginBottom: '8px', fontFamily: 'Space Grotesk, sans-serif' }}>INTERACTIVE SYSTEM</div>
        <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '10px', color: 'white', letterSpacing: '-0.03em', fontFamily: 'Outfit, sans-serif' }}>Interactive 3D Blueprint Mesh</h3>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14.5px', maxWidth: '400px', lineHeight: 1.5, fontFamily: 'Outfit, sans-serif', margin: 0 }}>
          A zero-trust, model-agnostic workbench built for the next generation of AI engineering. Click and drag nodes.
        </p>
      </div>
      
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', paddingTop: '350px', opacity: 0.5 }}>Synchronizing Neural Nodes...</div>}>
          <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
            <PerspectiveCamera makeDefault position={[0, 0, 12]} />
            <ambientLight intensity={2.2} />
            <pointLight position={[10, 10, 10]} intensity={4.5} color="#7c5cfc" />
            <pointLight position={[-10, -10, 10]} intensity={3.5} color="#38bdf8" />
            <group position={[0, -0.5, 0]}>
              {features.map((f, i) => (
                <FeatureSphere 
                  key={i} 
                  index={i}
                  position={[ (i - 1.5) * 3.8, 0, 0 ]} 
                  title={f.title} 
                  desc={f.desc} 
                />
              ))}
            </group>
            <ContactShadows position={[0, -4, 0]} opacity={0.6} scale={20} blur={2.5} far={4.5} color="#7c5cfc" />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
          </Canvas>
        </Suspense>
      </div>

      <style>{`
        @keyframes revealScale {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ExplodingObjects;
