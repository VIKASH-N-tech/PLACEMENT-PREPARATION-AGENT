import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Interactive3DBackgroundProps {
  theme: 'light' | 'dark';
}

export default function Interactive3DBackground({ theme }: Interactive3DBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Setup Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    
    // Smooth transition backing
    const getBgColor = (t: 'light' | 'dark') => {
      return t === 'light' ? 0xf8fafc : 0x020617; // slate-50 or slate-950
    };
    scene.background = new THREE.Color(getBgColor(theme));

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 175;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 2. Lights (Realistic diffuse lighting & interactive specular shine)
    const ambientLight = new THREE.AmbientLight(theme === 'dark' ? 0x0f172a : 0xe2e8f0, 2.5);
    scene.add(ambientLight);

    // Interactive spotlight tracking the cursor
    const pointLight = new THREE.PointLight(theme === 'dark' ? 0x3b82f6 : 0x2563eb, 15, 300);
    pointLight.position.set(0, 0, 100);
    scene.add(pointLight);

    const pointLightSec = new THREE.PointLight(theme === 'dark' ? 0xa855f7 : 0x7c3aed, 10, 300);
    pointLightSec.position.set(50, -50, 80);
    scene.add(pointLightSec);

    // 3. Realistic Particle Data (Positions, velocities, colors)
    const particleCount = 200;
    const maxDistance = 45; // Maximum distance to draw connecting plexus lines
    
    const particlesData: Array<{
      position: THREE.Vector3;
      velocity: THREE.Vector3;
    }> = [];

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(theme === 'dark' ? '#60a5fa' : '#3b82f6'); // bright sky blue
    const color2 = new THREE.Color(theme === 'dark' ? '#c084fc' : '#a855f7'); // neon purple

    for (let i = 0; i < particleCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 280,
        (Math.random() - 0.5) * 280,
        (Math.random() - 0.5) * 280
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      );

      particlesData.push({ position: pos, velocity: vel });

      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      // Color lerp
      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Glow texture for premium anti-aliased circular spheres (avoids ugly jagged square pixels)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const ctx = pCanvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(pCanvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: theme === 'dark' ? 3.5 : 2.5,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      depthWrite: false,
      blending: theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending,
      opacity: theme === 'dark' ? 0.9 : 0.7,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 4. Dynamic Line Connection Constellation System (The Plexus effect)
    const linePositions = new Float32Array(particleCount * particleCount * 6);
    const lineColors = new Float32Array(particleCount * particleCount * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: theme === 'dark' ? 0.4 : 0.25,
      blending: theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending,
      linewidth: 1,
    });

    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);

    // 5. Aesthetic Floating Futuristic Hologram Wireframe Meshes
    const meshes: THREE.Mesh[] = [];
    const wireGeometries = [
      new THREE.IcosahedronGeometry(18, 1),
      new THREE.OctahedronGeometry(14, 1),
      new THREE.TorusGeometry(12, 3, 8, 24),
    ];

    for (let k = 0; k < 6; k++) {
      const geo = wireGeometries[k % wireGeometries.length];
      const mat = new THREE.MeshPhongMaterial({
        color: theme === 'dark' ? 0x6366f1 : 0x4f46e5, // Indigo highlight
        wireframe: true,
        transparent: true,
        opacity: theme === 'dark' ? 0.12 : 0.08,
        shininess: 100,
        specular: 0xffffff,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 100
      );
      
      scene.add(mesh);
      meshes.push(mesh);
    }

    // 6. Interactive Mouse handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 60;
      mouseRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 60;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Realistic Physics Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Smooth camera interpolation (Lerp)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      camera.position.x = mouseRef.current.x * 1.2;
      camera.position.y = -mouseRef.current.y * 1.2;
      camera.lookAt(scene.position);

      // Spotlight tracking the cursor for realistic shininess on wireframes
      pointLight.position.x = mouseRef.current.x * 2.5;
      pointLight.position.y = -mouseRef.current.y * 2.5;

      // Gentle continuous drift & update positions of the points
      const posAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      
      for (let i = 0; i < particleCount; i++) {
        const pData = particlesData[i];
        
        // Update positions using realistic continuous velocities
        pData.position.addScaledVector(pData.velocity, 1.2);

        // Boundary bounce check to keep constellation cohesive
        if (pData.position.x < -140 || pData.position.x > 140) pData.velocity.x *= -1;
        if (pData.position.y < -140 || pData.position.y > 140) pData.velocity.y *= -1;
        if (pData.position.z < -140 || pData.position.z > 140) pData.velocity.z *= -1;

        posAttr.setXYZ(i, pData.position.x, pData.position.y, pData.position.z);
      }
      posAttr.needsUpdate = true;

      // Update Constellation Lines (Plexus effect with distance fading)
      let lineIndex = 0;
      const linePosAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute;
      const lineColorAttr = lineGeometry.getAttribute('color') as THREE.BufferAttribute;

      const baseLineColor = theme === 'dark' ? new THREE.Color(0x818cf8) : new THREE.Color(0x4f46e5);

      for (let i = 0; i < particleCount; i++) {
        const pA = particlesData[i].position;

        for (let j = i + 1; j < particleCount; j++) {
          const pB = particlesData[j].position;
          const dist = pA.distanceTo(pB);

          if (dist < maxDistance) {
            // Add connection segment
            linePosAttr.setXYZ(lineIndex, pA.x, pA.y, pA.z);
            linePosAttr.setXYZ(lineIndex + 1, pB.x, pB.y, pB.z);

            // Compute intensity proportional to distance (closer = brighter, farther = transparent)
            const alpha = 1.0 - dist / maxDistance;
            const segmentColor = baseLineColor.clone().multiplyScalar(alpha);

            lineColorAttr.setXYZ(lineIndex, segmentColor.r, segmentColor.g, segmentColor.b);
            lineColorAttr.setXYZ(lineIndex + 1, segmentColor.r, segmentColor.g, segmentColor.b);

            lineIndex += 2;
          }
        }
      }
      
      // Update geometry drawing range to only render active lines
      lineGeometry.setDrawRange(0, lineIndex);
      linePosAttr.needsUpdate = true;
      lineColorAttr.needsUpdate = true;

      // Rotate beautiful abstract wireframe models
      meshes.forEach((mesh, index) => {
        mesh.rotation.y += 0.003 * (index + 1);
        mesh.rotation.x += 0.002 * (index + 1);
        mesh.position.y += Math.sin(elapsedTime * 0.8 + index) * 0.08;
      });

      renderer.render(scene, camera);
    };

    animate();

    // 8. Dynamic Aspect Ratio Resizing
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // 9. Thorough resource disposal to avoid memory leaks
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      // Dipose Geometries
      particleGeometry.dispose();
      lineGeometry.dispose();
      
      // Dispose Materials
      particleMaterial.dispose();
      lineMaterial.dispose();
      particleTexture.dispose();
      
      meshes.forEach(m => {
        m.geometry.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach(mat => mat.dispose());
        } else {
          m.material.dispose();
        }
      });
    };
  }, [theme]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none overflow-hidden transition-all duration-300" 
    />
  );
}
