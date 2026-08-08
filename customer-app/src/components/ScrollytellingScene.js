import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Box, Sphere } from '@react-three/drei/native';
import * as THREE from 'three';

import { sceneColors } from '../theme/colors';

/** Placeholder geometry positions. Swapped for real GLB models later. */
export const SHIRT_POSITION = [0, 0, 0]; // black men's shirt
export const DRESS_POSITION = [0, -10, 0]; // red dress

const TAU = Math.PI * 2;

/** Cubic ease, used to give the descent a weighted, camera-operator feel. */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * DroneCamera
 *
 * Reads the Reanimated shared value every frame (`.value` is readable from the
 * JS thread) and derives the whole camera path from a single 0..1 progress
 * number:
 *
 *   progress 0.0 -> 0.5 : a full 360 deg orbit around the shirt at y ~ 0
 *   progress 0.5 -> 1.0 : descend along -Y while continuing to orbit, landing
 *                         in a second 360 deg orbit around the dress at y = -10
 *
 * Positions are damped toward the derived target rather than snapped, so a
 * flung scroll still reads as a smooth drone move instead of a teleport.
 */
function DroneCamera({ scrollY, scrollRange }) {
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));
  const desired = useRef(new THREE.Vector3(0, 2.5, 7));
  const desiredLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ camera }, delta) => {
    const offset = scrollY?.value ?? 0;
    const progress = clamp01(scrollRange > 0 ? offset / scrollRange : 0);

    let angle;
    let radius;
    let camY;
    let targetY;

    if (progress < 0.5) {
      // Chapter 1 — orbit the shirt.
      const a = progress / 0.5;
      angle = a * TAU;
      radius = lerp(7, 5.5, a); // spiral gently inward
      camY = lerp(2.5, 1.2, a); // drop from the establishing height
      targetY = SHIRT_POSITION[1];
    } else {
      // Chapter 2 — descend to the dress and orbit it.
      const b = (progress - 0.5) / 0.5;
      const eased = easeInOutCubic(b);
      angle = TAU + b * TAU; // keep spinning through the descent
      radius = lerp(5.5, 6.5, eased);
      camY = lerp(1.2, DRESS_POSITION[1] + 1.6, eased);
      targetY = lerp(SHIRT_POSITION[1], DRESS_POSITION[1], eased);
    }

    desired.current.set(Math.sin(angle) * radius, camY, Math.cos(angle) * radius);
    desiredLookAt.current.set(0, targetY, 0);

    // Frame-rate independent damping.
    const k = 1 - Math.exp(-6 * delta);
    camera.position.lerp(desired.current, k);
    lookAt.current.lerp(desiredLookAt.current, k);
    camera.lookAt(lookAt.current);
    camera.updateProjectionMatrix();
  });

  return null;
}

function Shirt() {
  const ref = useRef(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15;
  });

  return (
    <Box ref={ref} args={[1.6, 2.2, 0.6]} position={SHIRT_POSITION} castShadow>
      <meshStandardMaterial color={sceneColors.shirt} roughness={0.65} metalness={0.15} />
    </Box>
  );
}

function Dress() {
  const ref = useRef(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.12;
  });

  return (
    <Sphere ref={ref} args={[1.4, 48, 48]} position={DRESS_POSITION} castShadow>
      <meshStandardMaterial color={sceneColors.dress} roughness={0.35} metalness={0.25} />
    </Sphere>
  );
}

/**
 * ScrollytellingScene
 *
 * Props:
 *  - scrollY:     Reanimated shared value holding the ScrollView offset in px
 *  - scrollRange: px of scroll that maps to the full 0..1 camera path
 *                 (i.e. contentHeight - viewportHeight)
 */
export default function ScrollytellingScene({ scrollY, scrollRange = 1 }) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Canvas
        camera={{ position: [0, 2.5, 7], fov: 55, near: 0.1, far: 120 }}
        gl={{ antialias: true }}
        onCreated={(state) => {
          state.gl.setClearColor(sceneColors.background);
        }}
      >
        <color attach="background" args={[sceneColors.background]} />
        <fog attach="fog" args={[sceneColors.fog, 9, 34]} />

        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} color={sceneColors.keyLight} />
        <pointLight position={[-4, -9, 3]} intensity={12} distance={20} color={sceneColors.rimLight} />

        <Shirt />
        <Dress />

        <DroneCamera scrollY={scrollY} scrollRange={scrollRange} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: sceneColors.background,
  },
});
