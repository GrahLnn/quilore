import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface ParticleTextEffectProps {
  className?: string;
  text?: string;
}

const ParticleTextEffect: React.FC<ParticleTextEffectProps> = ({ 
  className,
  text = "hello world" 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    material: THREE.ShaderMaterial;
    positions: Float32Array;
    colors: Float32Array;
    sizes: Float32Array;
    originalPositions: Float32Array;
    alphas: Float32Array;
    textTargetPoints: THREE.Vector3[];
    clock: THREE.Clock;
    isFormingText: boolean;
    transitionProgress: number;
    transitionDuration: number;
    mouse: THREE.Vector2;
    interactionRadius: number;
    textCanvas: HTMLCanvasElement;
    textCtx: CanvasRenderingContext2D;
    particleCount: number;
    canvasWidth: number;
    canvasHeight: number;
    animationFrameId?: number;
  }>(null);

  // 顶点着色器
  const vertexShader = `
    attribute float size;
    attribute vec3 customColor;
    attribute float particleAlpha;
    uniform float u_time; // 时间统一变量用于脉动效果

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = customColor;
      vAlpha = particleAlpha;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      // 基于时间和粒子原始位置的脉动大小（使用位置作为代理）
      float timeFactor = u_time * 1.5;
      // 使用位置组件进行变化以避免统一脉动
      float pulse = sin(timeFactor + position.x * 0.05 + position.y * 0.03) * 0.25 + 0.85; // 动态脉动（0.6到1.1）

      gl_PointSize = size * 1.5 * pulse; // 将脉动应用于基本大小
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  // 片段着色器
  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    uniform float u_time; // 时间统一变量用于闪烁效果

    void main() {
      // 发光效果：更亮的中心，使用幂曲线的柔和边缘
      float edgeDist = length(gl_PointCoord - vec2(0.5)); // 0.0中心，0.5边缘
      // 发光的幂曲线：更高的幂 = 更锐利的衰减
      float glow = pow(max(0.0, 1.0 - edgeDist * 1.8), 3.0); // 确保基数非负

      // 基于时间、基本颜色和片段坐标的闪烁颜色
      float shimmer = sin(u_time * 2.5 + vColor.r * 10.0 + gl_PointCoord.x * 6.0) * 0.15; // 稍快的闪烁
      // 将闪烁添加到基本颜色
      vec3 shimmeringColor = vColor + vec3(shimmer, shimmer * 0.8, shimmer * 1.2);

      // 最终alpha结合发光形状和整体粒子alpha
      float finalAlpha = clamp(glow, 0.0, 1.0) * vAlpha;

      // 如果几乎完全透明，则丢弃片段
      if (finalAlpha < 0.01) discard;

      // 最终颜色结合闪烁颜色和发光强度提升
      // 使中心明显更亮
      gl_FragColor = vec4(shimmeringColor * (0.7 + glow * 0.6), finalAlpha); // 调整基本亮度和发光提升
    }
  `;

  // 更新文本目标点
  const updateTextTargets = (
    text: string, 
    textCtx: CanvasRenderingContext2D, 
    textTargetPoints: THREE.Vector3[],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    textTargetPoints.length = 0;
    textCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    textCtx.font = 'bold 120px Arial';
    textCtx.fillStyle = 'white';
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    const imageData = textCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    const samplingStep = 4;

    for (let y = 0; y < canvasHeight; y += samplingStep) {
      for (let x = 0; x < canvasWidth; x += samplingStep) {
        const index = (y * canvasWidth + x) * 4;
        if (data[index + 3] > 128) {
          const worldX = (x - canvasWidth / 2) * 2.5;
          const worldY = -(y - canvasHeight / 2) * 2.5;
          const worldZ = (Math.random() - 0.5) * 50;
          textTargetPoints.push(new THREE.Vector3(worldX, worldY, worldZ));
        }
      }
    }
    shuffleArray(textTargetPoints);
    console.log("采样点数:", textTargetPoints.length);
  };

  // 洗牌数组
  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  // 缓动函数
  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  };

  // 窗口大小调整
  const onWindowResize = () => {
    if (!sceneRef.current) return;
    
    const { camera, renderer } = sceneRef.current;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // 鼠标移动
  const onMouseMove = (event: MouseEvent) => {
    if (!sceneRef.current) return;
    
    const { mouse } = sceneRef.current;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  // 动画函数
  const animate = () => {
    if (!sceneRef.current) return;
    
    const {
      scene,
      camera,
      renderer,
      particles,
      material,
      originalPositions,
      textTargetPoints,
      clock,
      mouse,
      interactionRadius,
      isFormingText,
      transitionProgress,
      transitionDuration,
      particleCount
    } = sceneRef.current;

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    const positionsAttribute = particles.geometry.attributes.position;
    const alphasAttribute = particles.geometry.attributes.particleAlpha;

    // 更新着色器时间统一变量
    material.uniforms.u_time.value = elapsedTime;

    // 更新过渡进度
    let updatedTransitionProgress = transitionProgress;
    if (transitionProgress < 1.0) {
      updatedTransitionProgress += delta / transitionDuration;
      updatedTransitionProgress = Math.min(updatedTransitionProgress, 1.0);
      sceneRef.current.transitionProgress = updatedTransitionProgress;
    }
    const easedProgress = easeInOutCubic(updatedTransitionProgress);

    // 鼠标世界位置计算
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const mouseWorldPos = camera.position.clone().add(dir.multiplyScalar(distance));

    // 更新粒子
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const ox = originalPositions[i3];
      const oy = originalPositions[i3 + 1];
      const oz = originalPositions[i3 + 2];

      // 鼠标排斥（仅在随机状态下）
      let repelX = 0, repelY = 0, repelZ = 0;
      if (!isFormingText) {
        const dx = ox - mouseWorldPos.x; const dy = oy - mouseWorldPos.y; const dz = oz - mouseWorldPos.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const maxDistSq = interactionRadius * interactionRadius * 2;
        if (distSq < maxDistSq) {
          const force = (1.0 - distSq / maxDistSq) * 30;
          const invDist = force / Math.sqrt(distSq + 0.001);
          repelX = dx * invDist; repelY = dy * invDist; repelZ = dz * invDist;
        }
      }
      const nonTextX = ox + repelX; const nonTextY = oy + repelY; const nonTextZ = oz + repelZ;

      // 确定目标位置和alpha
      let actualTargetX, actualTargetY, actualTargetZ;
      let targetAlpha;
      if (isFormingText) {
        if (i < textTargetPoints.length) {
          const targetIndex = i % textTargetPoints.length;
          actualTargetX = textTargetPoints[targetIndex].x; actualTargetY = textTargetPoints[targetIndex].y; actualTargetZ = textTargetPoints[targetIndex].z;
          targetAlpha = 1.0;
        } else {
          actualTargetX = ox; actualTargetY = oy; actualTargetZ = oz;
          targetAlpha = 0.0;
        }
      } else {
        actualTargetX = nonTextX; actualTargetY = nonTextY; actualTargetZ = nonTextZ;
        targetAlpha = 1.0;
      }

      // 插值位置
      const currentX = positionsAttribute.array[i3]; const currentY = positionsAttribute.array[i3 + 1]; const currentZ = positionsAttribute.array[i3 + 2];
      let finalX = currentX + (actualTargetX - currentX) * easedProgress;
      let finalY = currentY + (actualTargetY - currentY) * easedProgress;
      let finalZ = currentZ + (actualTargetZ - currentZ) * easedProgress;

      // 插值alpha
      const currentAlpha = alphasAttribute.array[i];
      let finalAlpha = currentAlpha + (targetAlpha - currentAlpha) * easedProgress;
      alphasAttribute.array[i] = finalAlpha;

      // 微妙的运动（如果形成文本且粒子是文本的一部分）
      // 略微增加强度
      if (isFormingText && i < textTargetPoints.length) {
        const movementIntensity = 0.5; // 略微增加强度
        const movementSpeed = 0.6;
        const variation = i * 0.05 + ox * 0.01;
        finalX += Math.sin(elapsedTime * movementSpeed + variation) * movementIntensity;
        finalY += Math.cos(elapsedTime * movementSpeed * 0.8 + variation * 1.1) * movementIntensity;
        finalZ += Math.sin(elapsedTime * movementSpeed * 0.7 + variation * 1.2) * movementIntensity;
      }

      // 更新位置缓冲区
      positionsAttribute.array[i3] = finalX; positionsAttribute.array[i3 + 1] = finalY; positionsAttribute.array[i3 + 2] = finalZ;
    }

    // 更新属性
    positionsAttribute.needsUpdate = true;
    alphasAttribute.needsUpdate = true;

    renderer.render(scene, camera);
    sceneRef.current.animationFrameId = requestAnimationFrame(animate);
  };

  // 初始化Three.js场景
  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    const particleCount = 50000;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // 创建文本画布
    const textCanvas = document.createElement('canvas');
    const textCtx = textCanvas.getContext('2d', { willReadFrequently: true });
    if (!textCtx) return;
    
    const canvasWidth = 1024;
    const canvasHeight = 256;
    textCanvas.width = canvasWidth;
    textCanvas.height = canvasHeight;

    // 初始化粒子几何体
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const originalPositions = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);

    const textTargetPoints: THREE.Vector3[] = [];
    updateTextTargets(text, textCtx, textTargetPoints, canvasWidth, canvasHeight);

    const color = new THREE.Color();
    const initialSpread = 1500;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const ox = THREE.MathUtils.randFloatSpread(initialSpread);
      const oy = THREE.MathUtils.randFloatSpread(initialSpread);
      const oz = THREE.MathUtils.randFloatSpread(initialSpread);
      originalPositions[i3] = ox; originalPositions[i3 + 1] = oy; originalPositions[i3 + 2] = oz;

      if (i < textTargetPoints.length) {
        const targetIndex = i % textTargetPoints.length;
        positions[i3] = textTargetPoints[targetIndex].x;
        positions[i3 + 1] = textTargetPoints[targetIndex].y;
        positions[i3 + 2] = textTargetPoints[targetIndex].z;
        alphas[i] = 1.0;
      } else {
        positions[i3] = ox; positions[i3 + 1] = oy; positions[i3 + 2] = oz;
        alphas[i] = 0.0;
      }

      color.setHSL(THREE.MathUtils.randFloat(0.55, 0.7), THREE.MathUtils.randFloat(0.7, 0.9), THREE.MathUtils.randFloat(0.5, 0.8));
      colors[i3] = color.r; colors[i3 + 1] = color.g; colors[i3 + 2] = color.b;
      sizes[i] = THREE.MathUtils.randFloat(5, 15);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('particleAlpha', new THREE.BufferAttribute(alphas, 1));

    // 带有时间统一变量的材质
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0.0 } // 添加时间统一变量
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const clock = new THREE.Clock();
    const mouse = new THREE.Vector2(-100, -100);
    const interactionRadius = 80;

    // 保存场景引用
    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles,
      material,
      positions,
      colors,
      sizes,
      originalPositions,
      alphas,
      textTargetPoints,
      clock,
      isFormingText: true,
      transitionProgress: 1.0,
      transitionDuration: 2.0,
      mouse,
      interactionRadius,
      textCanvas,
      textCtx,
      particleCount,
      canvasWidth,
      canvasHeight
    };

    // 添加事件监听器
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener('mousemove', onMouseMove);
      if (sceneRef.current?.animationFrameId) {
        cancelAnimationFrame(sceneRef.current.animationFrameId);
      }
      if (sceneRef.current?.renderer) {
        sceneRef.current.renderer.dispose();
      }
      if (sceneRef.current?.material) {
        sceneRef.current.material.dispose();
      }
      if (mountRef.current && sceneRef.current?.renderer) {
        mountRef.current.removeChild(sceneRef.current.renderer.domElement);
      }
    };
  }, [text]);

  // 初始化和清理
  useEffect(() => {
    const cleanup = initScene();
    
    // 开始动画循环
    if (sceneRef.current) {
      animate();
    }
    
    return cleanup;
  }, [initScene]);

  return (
    <div className={cn("relative w-full h-full", className)}>
      <div
        ref={mountRef}
        className="w-full h-full absolute top-0 left-0"
      />
    </div>
  );
};

export default ParticleTextEffect;
