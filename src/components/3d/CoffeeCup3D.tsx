import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, RotateCcw } from 'lucide-react';

interface CoffeeCup3DProps {
  className?: string;
  theme?: 'black-gold' | 'cream-gold';
}

export const CoffeeCup3D: React.FC<CoffeeCup3DProps> = ({
  className = '',
  theme = 'black-gold',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeTheme, setActiveTheme] = useState<'black-gold' | 'cream-gold'>(theme);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 1.8, 5.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.9);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffecc7, 2.2);
    mainKeyLight.position.set(4, 6, 4);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    scene.add(mainKeyLight);

    // Warm golden rim light
    const goldRimLight = new THREE.PointLight(0xe5a93c, 3.5, 12);
    goldRimLight.position.set(-3, 3, -2);
    scene.add(goldRimLight);

    // Soft fill light
    const fillLight = new THREE.DirectionalLight(0xd97706, 1.0);
    fillLight.position.set(-3, -1, 3);
    scene.add(fillLight);

    // ROOT CUP GROUP
    const cupGroup = new THREE.Group();
    scene.add(cupGroup);

    // MATERIALS
    const isDark = activeTheme === 'black-gold';
    const cupBodyColor = isDark ? 0x141210 : 0xf7f2ea;
    const roughnessVal = isDark ? 0.35 : 0.2;

    const cupMaterial = new THREE.MeshStandardMaterial({
      color: cupBodyColor,
      roughness: roughnessVal,
      metalness: 0.15,
    });

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5a93c,
      metalness: 0.85,
      roughness: 0.22,
    });

    const coffeeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b1509,
      roughness: 0.15,
      metalness: 0.05,
    });

    const saucerMaterial = new THREE.MeshStandardMaterial({
      color: cupBodyColor,
      roughness: roughnessVal,
      metalness: 0.2,
    });

    // 1. CUP BODY (Lathe / Tapered Cylinder)
    const cupPoints: THREE.Vector2[] = [];
    cupPoints.push(new THREE.Vector2(0.85, 0));
    cupPoints.push(new THREE.Vector2(0.9, 0.2));
    cupPoints.push(new THREE.Vector2(1.15, 1.1));
    cupPoints.push(new THREE.Vector2(1.28, 1.6));
    cupPoints.push(new THREE.Vector2(1.3, 1.7));
    // Inner wall
    cupPoints.push(new THREE.Vector2(1.22, 1.7));
    cupPoints.push(new THREE.Vector2(1.18, 1.6));
    cupPoints.push(new THREE.Vector2(0.95, 0.4));
    cupPoints.push(new THREE.Vector2(0.75, 0.35));
    cupPoints.push(new THREE.Vector2(0, 0.35));

    const cupGeom = new THREE.LatheGeometry(cupPoints, 48);
    const cupMesh = new THREE.Mesh(cupGeom, cupMaterial);
    cupMesh.castShadow = true;
    cupMesh.receiveShadow = true;
    cupGroup.add(cupMesh);

    // 2. GOLDEN RIM EMBELLISHMENT
    const rimGeom = new THREE.TorusGeometry(1.28, 0.045, 16, 48);
    rimGeom.rotateX(Math.PI / 2);
    rimGeom.translate(0, 1.7, 0);
    const rimMesh = new THREE.Mesh(rimGeom, goldMaterial);
    cupGroup.add(rimMesh);

    // 3. GOLDEN TORA ACCENT RING ON BODY
    const ringGeom = new THREE.TorusGeometry(1.04, 0.025, 16, 48);
    ringGeom.rotateX(Math.PI / 2);
    ringGeom.translate(0, 0.7, 0);
    const ringMesh = new THREE.Mesh(ringGeom, goldMaterial);
    cupGroup.add(ringMesh);

    // 4. COFFEE SURFACE WITH CREMA ART
    const coffeeGeom = new THREE.CylinderGeometry(1.2, 1.15, 0.05, 48);
    const coffeeMesh = new THREE.Mesh(coffeeGeom, coffeeMaterial);
    coffeeMesh.position.y = 1.52;
    cupGroup.add(coffeeMesh);

    // Crema Foam Swirl
    const cremaCanvas = document.createElement('canvas');
    cremaCanvas.width = 256;
    cremaCanvas.height = 256;
    const ctx = cremaCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 120);
      grad.addColorStop(0, '#d19854');
      grad.addColorStop(0.3, '#3c1e0e');
      grad.addColorStop(0.65, '#996328');
      grad.addColorStop(1, '#271206');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Delicate latte art heart/rosetta
      ctx.strokeStyle = '#f5eedb';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 120, 35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(128, 70);
      ctx.lineTo(128, 175);
      ctx.strokeStyle = '#f5eedb';
      ctx.lineWidth = 8;
      ctx.stroke();
    }
    const cremaTexture = new THREE.CanvasTexture(cremaCanvas);
    const cremaMat = new THREE.MeshStandardMaterial({
      map: cremaTexture,
      roughness: 0.35,
    });
    const cremaMesh = new THREE.Mesh(new THREE.CircleGeometry(1.18, 36), cremaMat);
    cremaMesh.rotateX(-Math.PI / 2);
    cremaMesh.position.y = 1.55;
    cupGroup.add(cremaMesh);

    // 5. CUP HANDLE
    const handleCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(1.2, 1.45, 0),
      new THREE.Vector3(1.9, 1.5, 0),
      new THREE.Vector3(1.85, 0.45, 0),
      new THREE.Vector3(1.0, 0.5, 0)
    );
    const handleGeom = new THREE.TubeGeometry(handleCurve, 28, 0.08, 12, false);
    const handleMesh = new THREE.Mesh(handleGeom, cupMaterial);
    handleMesh.castShadow = true;
    cupGroup.add(handleMesh);

    // 6. LUXURY SAUCER
    const saucerPoints: THREE.Vector2[] = [];
    saucerPoints.push(new THREE.Vector2(0, -0.05));
    saucerPoints.push(new THREE.Vector2(1.2, -0.05));
    saucerPoints.push(new THREE.Vector2(1.8, 0.1));
    saucerPoints.push(new THREE.Vector2(2.1, 0.25));
    saucerPoints.push(new THREE.Vector2(2.15, 0.2));
    saucerPoints.push(new THREE.Vector2(1.7, 0.02));
    saucerPoints.push(new THREE.Vector2(0.9, -0.02));
    saucerPoints.push(new THREE.Vector2(0, -0.02));

    const saucerGeom = new THREE.LatheGeometry(saucerPoints, 48);
    const saucerMesh = new THREE.Mesh(saucerGeom, saucerMaterial);
    saucerMesh.position.y = -0.06;
    saucerMesh.receiveShadow = true;
    saucerMesh.castShadow = true;
    cupGroup.add(saucerMesh);

    // Gold trim on saucer edge
    const saucerGoldRim = new THREE.TorusGeometry(2.12, 0.03, 16, 48);
    saucerGoldRim.rotateX(Math.PI / 2);
    saucerGoldRim.translate(0, 0.18, 0);
    const saucerRimMesh = new THREE.Mesh(saucerGoldRim, goldMaterial);
    cupGroup.add(saucerRimMesh);

    // 7. ORBITING SPECIALTY COFFEE BEANS
    const beanGeom = new THREE.SphereGeometry(0.14, 16, 12);
    beanGeom.scale(1.2, 0.8, 0.65);
    const beanMat = new THREE.MeshStandardMaterial({
      color: 0x3d2011,
      roughness: 0.4,
      metalness: 0.1,
    });

    const beans: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; yOffset: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const bean = new THREE.Mesh(beanGeom, beanMat);
      bean.castShadow = true;
      const angle = (i / 7) * Math.PI * 2;
      const radius = 2.4 + Math.random() * 0.8;
      const yOffset = 0.4 + Math.random() * 1.5;
      const speed = (0.5 + Math.random() * 0.4) * (i % 2 === 0 ? 1 : -1);
      beans.push({ mesh: bean, angle, radius, speed, yOffset });
      scene.add(bean);
    }

    // 8. RISING STEAM PARTICLES
    const steamParticleCount = 28;
    const steamGeom = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamParticleCount * 3);
    const steamAlphas = new Float32Array(steamParticleCount);
    const steamSpeeds = new Float32Array(steamParticleCount);

    for (let i = 0; i < steamParticleCount; i++) {
      steamPositions[i * 3 + 0] = (Math.random() - 0.5) * 0.6;
      steamPositions[i * 3 + 1] = 1.6 + Math.random() * 1.5;
      steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      steamAlphas[i] = Math.random();
      steamSpeeds[i] = 0.008 + Math.random() * 0.012;
    }

    steamGeom.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));

    // Particle Material
    const steamMat = new THREE.PointsMaterial({
      color: 0xffedd5,
      size: 0.28,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const steamParticles = new THREE.Points(steamGeom, steamMat);
    cupGroup.add(steamParticles);

    // Initial orientation
    cupGroup.position.set(0, -0.5, 0);
    cupGroup.rotation.y = -0.4;
    cupGroup.rotation.x = 0.15;

    // INTERACTIVITY: DRAG & ROTATION
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let autoRotateSpeed = 0.006;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsInteracting(true);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      cupGroup.rotation.y += deltaX * 0.008;
      cupGroup.rotation.x = Math.max(-0.2, Math.min(0.5, cupGroup.rotation.x + deltaY * 0.005));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 2000);
    };

    // Touch Support for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        setIsInteracting(true);
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      cupGroup.rotation.y += deltaX * 0.01;
      cupGroup.rotation.x = Math.max(-0.2, Math.min(0.5, cupGroup.rotation.x + deltaY * 0.006));
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 2000);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // RESIZE LISTENER
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating levitation effect
      cupGroup.position.y = -0.5 + Math.sin(elapsedTime * 1.5) * 0.08;

      // Auto rotation when not user-dragged
      if (!isDragging) {
        cupGroup.rotation.y += autoRotateSpeed;
      }

      // Animate steam particles rising
      const posAttr = steamGeom.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < steamParticleCount; i++) {
        positions[i * 3 + 1] += steamSpeeds[i];
        positions[i * 3 + 0] += Math.sin(elapsedTime * 2 + i) * 0.003;

        // Reset if too high
        if (positions[i * 3 + 1] > 3.0) {
          positions[i * 3 + 1] = 1.6;
          positions[i * 3 + 0] = (Math.random() - 0.5) * 0.5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }
      }
      posAttr.needsUpdate = true;

      // Orbiting coffee beans
      beans.forEach((b, idx) => {
        const curAngle = b.angle + elapsedTime * b.speed * 0.4;
        b.mesh.position.x = Math.cos(curAngle) * b.radius;
        b.mesh.position.z = Math.sin(curAngle) * b.radius;
        b.mesh.position.y = b.yOffset + Math.sin(elapsedTime * 2 + idx) * 0.15;
        b.mesh.rotation.x += 0.015;
        b.mesh.rotation.y += 0.02;
      });

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (container && domElement) {
        container.removeChild(domElement);
      }
      renderer.dispose();
      cupGeom.dispose();
      rimGeom.dispose();
      ringGeom.dispose();
      coffeeGeom.dispose();
      saucerGeom.dispose();
      steamGeom.dispose();
    };
  }, [activeTheme]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="w-full h-full min-h-[360px] md:min-h-[460px] cursor-grab active:cursor-grabbing select-none"
      />

      {/* Floating Interactive Badge & Controls */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs shadow-gold-sm pointer-events-auto">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          <span className="font-medium">
            {isInteracting ? '360° Rotating...' : 'Interactive 3D • Drag to Spin'}
          </span>
        </div>

        {/* Theme switcher for 3D Cup */}
        <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-stone-800 rounded-full p-1 pointer-events-auto">
          <button
            onClick={() => setActiveTheme('black-gold')}
            title="Matte Obsidian & Gold"
            className={`w-6 h-6 rounded-full border transition-all ${
              activeTheme === 'black-gold'
                ? 'bg-stone-900 border-amber-400 scale-110 shadow-gold-sm'
                : 'bg-stone-800 border-stone-700 opacity-60'
            }`}
          />
          <button
            onClick={() => setActiveTheme('cream-gold')}
            title="Royal Cream & Gold"
            className={`w-6 h-6 rounded-full border transition-all ${
              activeTheme === 'cream-gold'
                ? 'bg-amber-100 border-amber-400 scale-110 shadow-gold-sm'
                : 'bg-stone-200 border-stone-400 opacity-60'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
