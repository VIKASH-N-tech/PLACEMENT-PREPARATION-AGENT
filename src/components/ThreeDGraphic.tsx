import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeDGraphic() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 240;
    const height = container.clientHeight || 240;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 2. Diffuse & Holographic Point Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x3b82f6, 12, 50); // bright neon blue
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 8, 50); // vivid purple
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // 3. Central Nested Crystals (Outer Icosahedron + Inner Octahedron)
    const coreGeometry = new THREE.IcosahedronGeometry(4, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
      shininess: 120,
      specular: 0x3b82f6
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);

    const innerGeometry = new THREE.OctahedronGeometry(2, 0);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: 0xc084fc,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
      shininess: 150,
      specular: 0xa855f7
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerMesh);

    // 4. Orbiting Stream Particle Rings
    const particleCount = 140;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorBlue = new THREE.Color(0x3b82f6);
    const colorPurple = new THREE.Color(0xa855f7);

    for (let i = 0; i < particleCount; i++) {
      // Ring orbit around Y axis with light vertical randomness
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 6.2 + (Math.random() - 0.5) * 1.2;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5; // thin band
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Color interpolation around the ring
      const mixedColor = colorBlue.clone().lerp(colorPurple, i / particleCount);
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Texture Generation (Anti-aliased soft glowing circles)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const ctx = pCanvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
    }
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.32,
      vertexColors: true,
      map: pTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);

    // 5. Interactive Mouse-Over Tilting
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 1.8;
      targetY = (y / rect.height) * 1.8;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 6. Realistic Physics Animation Loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Butter-smooth interpolation (Lerp)
      mouseX += (targetX - mouseX) * 0.06;
      mouseY += (targetY - mouseY) * 0.06;

      // Base rotation + cursor tilting
      coreMesh.rotation.y = elapsedTime * 0.22 + mouseX;
      coreMesh.rotation.x = elapsedTime * 0.12 + mouseY;

      innerMesh.rotation.y = -elapsedTime * 0.35 - mouseX;
      innerMesh.rotation.x = -elapsedTime * 0.18 - mouseY;

      // Orbit particle ring gently
      particleSystem.rotation.y = elapsedTime * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Dynamic Resize Observation
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth || 240;
      const h = container.clientHeight || 240;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 8. Thorough Resource Cleanup on Unmount
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      coreGeometry.dispose();
      coreMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      pTexture.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-2 relative select-none w-full">
      {/* Background radial glows */}
      <div className="absolute w-44 h-44 rounded-full bg-blue-500/5 blur-[50px] animate-pulse pointer-events-none" />
      <div className="absolute w-36 h-36 rounded-full bg-purple-500/5 blur-[40px] animate-pulse delay-100 pointer-events-none" />

      {/* WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-56 h-56 md:w-60 md:h-60 cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center rounded-3xl bg-slate-950/20 border border-white/5 shadow-inner"
        style={{ touchAction: 'none' }}
      />

      {/* Active Hologram Badge */}
      <div className="flex items-center gap-1.5 mt-5">
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
        <p className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          🛰️ Holographic Core Active
        </p>
      </div>
    </div>
  );
}
