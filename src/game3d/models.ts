import * as THREE from 'three';
import type { TeamId } from '../types/game';

export interface MotorcycleRig {
  root: THREE.Group;
  chassisPivot: THREE.Group;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  boostFlame: THREE.Mesh;
  wrongBeacon: THREE.Mesh;
  brakeLightMat: THREE.MeshStandardMaterial;
}

export function createSportMotorcycle(
  team: TeamId,
  contactShadowTex: THREE.Texture,
  isSoftwareGl: boolean,
): MotorcycleRig {
  const root = new THREE.Group();

  // Contact shadow grounded at Y = 0.02
  const shadowGeo = new THREE.PlaneGeometry(1.7, 3.3);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.62,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.02, 0);
  root.add(shadowMesh);

  // Chassis pivot allows wheelie pitch & wrong-answer shake
  const chassisPivot = new THREE.Group();
  root.add(chassisPivot);

  const primaryHex = team === 'lamacca' ? 0x2563eb : 0x16a34a;
  const accentHex = team === 'lamacca' ? 0x38bdf8 : 0x34d399;
  const suitHex = team === 'lamacca' ? 0x1e3a8a : 0x14532d;

  // PBR Materials (varied roughness & metalness across adjacent parts)
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: primaryHex,
    metalness: 0.65,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.12,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 0.35,
    metalness: 0.4,
    roughness: 0.3,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.25,
    roughness: 0.62,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    metalness: 0.92,
    roughness: 0.16,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.08,
    roughness: 0.88,
  });

  const visorMat = new THREE.MeshPhysicalMaterial({
    color: accentHex,
    metalness: 0.15,
    roughness: 0.08,
    transmission: isSoftwareGl ? 0 : 0.72,
    transparent: true,
    opacity: isSoftwareGl ? 0.55 : 0.92,
    clearcoat: 1.0,
  });

  // Helper to build detailed wheel assembly (Tire + Rim + Brake Rotor + Spokes)
  const buildWheel = (): THREE.Group => {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.12, 16, 28), tireMat);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = !isSoftwareGl;
    wg.add(tire);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 10, 24), accentMat);
    rim.rotation.y = Math.PI / 2;
    wg.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 14), chromeMat);
    hub.rotation.z = Math.PI / 2;
    wg.add(hub);

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.015, 20), chromeMat);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = 0.08;
    wg.add(disc);

    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.46, 0.035), carbonMat);
      spoke.rotation.x = (i * Math.PI) / 5;
      wg.add(spoke);
    }
    return wg;
  };

  // Motorcycle faces -Z (forward down the circuit!)
  const frontWheel = buildWheel();
  frontWheel.position.set(0, 0.48, -0.92);
  chassisPivot.add(frontWheel);

  const rearWheel = buildWheel();
  rearWheel.position.set(0, 0.48, 0.88);
  chassisPivot.add(rearWheel);

  // 1. Primary Silhouette: Sculpted Aerodynamic Body / Fairing (ExtrudeGeometry)
  const fairingShape = new THREE.Shape();
  fairingShape.moveTo(-0.95, 0.42);
  fairingShape.lineTo(-1.26, 0.66);
  fairingShape.lineTo(-0.82, 1.02);
  fairingShape.lineTo(-0.22, 1.06);
  fairingShape.lineTo(0.38, 0.86);
  fairingShape.lineTo(0.95, 1.04);
  fairingShape.lineTo(1.12, 0.92);
  fairingShape.lineTo(0.55, 0.56);
  fairingShape.lineTo(-0.35, 0.36);
  fairingShape.closePath();

  const fairingGeo = new THREE.ExtrudeGeometry(fairingShape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 3,
  });
  // Extrude is in XY plane extruded along Z; rotate so X is width and Z is length!
  fairingGeo.center();
  const bodyMesh = new THREE.Mesh(fairingGeo, paintMat);
  bodyMesh.rotation.y = -Math.PI / 2;
  bodyMesh.position.set(0, 0.78, -0.05);
  bodyMesh.castShadow = !isSoftwareGl;
  chassisPivot.add(bodyMesh);

  // 2. Engine block & lower belly pan
  const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.65), carbonMat);
  engineBlock.position.set(0, 0.52, -0.02);
  chassisPivot.add(engineBlock);

  // Racing side stripes
  const leftStripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.95), accentMat);
  leftStripe.position.set(-0.27, 0.82, -0.15);
  leftStripe.rotation.x = 0.12;
  chassisPivot.add(leftStripe);

  const rightStripe = leftStripe.clone();
  rightStripe.position.x = 0.27;
  chassisPivot.add(rightStripe);

  // 3. Telescopic Front Forks
  const forkGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.76, 12);
  const leftFork = new THREE.Mesh(forkGeo, chromeMat);
  leftFork.position.set(-0.14, 0.72, -0.76);
  leftFork.rotation.x = 0.38;
  chassisPivot.add(leftFork);

  const rightFork = leftFork.clone();
  rightFork.position.x = 0.14;
  chassisPivot.add(rightFork);

  // Rear Swingarm
  const swingarm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.72), carbonMat);
  swingarm.position.set(0, 0.5, 0.52);
  swingarm.rotation.x = -0.08;
  chassisPivot.add(swingarm);

  // 4. Tinted Aerodynamic Windshield Bubble
  const windshield = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI, 0, Math.PI * 0.55),
    visorMat,
  );
  windshield.scale.set(0.85, 0.85, 1.45);
  windshield.rotation.x = -0.45;
  windshield.position.set(0, 1.04, -0.72);
  chassisPivot.add(windshield);

  // 5. Dual Exhaust Pipes + Glowing Nitro Flame
  const exhaustGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.68, 14);
  const rightExhaust = new THREE.Mesh(exhaustGeo, chromeMat);
  rightExhaust.rotation.x = Math.PI / 2 - 0.32;
  rightExhaust.position.set(0.22, 0.64, 0.72);
  chassisPivot.add(rightExhaust);

  const leftExhaust = rightExhaust.clone();
  leftExhaust.position.x = -0.22;
  chassisPivot.add(leftExhaust);

  const flameMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    transparent: true,
    opacity: 0.0,
  });
  const boostFlame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.95, 14), flameMat);
  boostFlame.rotation.x = Math.PI / 2;
  boostFlame.position.set(0, 0.72, 1.42);
  chassisPivot.add(boostFlame);

  // 6. Headlight & Brake Taillight
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f2fe,
    emissiveIntensity: 1.8,
  });
  const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), headlightMat);
  headlight.position.set(0, 0.82, -1.16);
  chassisPivot.add(headlight);

  const brakeLightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.8,
  });
  const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.05), brakeLightMat);
  taillight.position.set(0, 1.02, 1.02);
  chassisPivot.add(taillight);

  // Wrong answer visual ring around bike
  const wrongBeaconMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const wrongBeacon = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.18, 32), wrongBeaconMat);
  wrongBeacon.rotation.x = -Math.PI / 2;
  wrongBeacon.position.set(0, 0.06, 0);
  root.add(wrongBeacon);

  // 7. Articulated 3D MotoGP Rider in Aerodynamic Tuck!
  const riderGroup = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({
    color: suitHex,
    roughness: 0.48,
    metalness: 0.18,
  });
  const leatherDarkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.55,
    metalness: 0.15,
  });

  // Torso leaning forward
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 8, 14), suitMat);
  torso.rotation.x = -0.92;
  torso.position.set(0, 1.24, 0.08);
  torso.castShadow = !isSoftwareGl;
  riderGroup.add(torso);

  // Aero hump on rider's back
  const aeroHump = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.34), accentMat);
  aeroHump.rotation.x = -0.88;
  aeroHump.position.set(0, 1.35, 0.14);
  riderGroup.add(aeroHump);

  // Helmet + Reflective Visor
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.185, 20, 18), paintMat);
  helmet.scale.set(0.95, 1.0, 1.18);
  helmet.position.set(0, 1.46, -0.34);
  helmet.castShadow = !isSoftwareGl;
  riderGroup.add(helmet);

  const helmetVisor = new THREE.Mesh(
    new THREE.SphereGeometry(0.188, 16, 12, -Math.PI * 0.85, Math.PI * 0.7, Math.PI * 0.25, Math.PI * 0.35),
    chromeMat,
  );
  helmetVisor.rotation.y = Math.PI;
  helmetVisor.position.set(0, 1.46, -0.36);
  riderGroup.add(helmetVisor);

  // Rider Arms gripping clip-on handlebars
  const armGeo = new THREE.CapsuleGeometry(0.065, 0.38, 6, 10);
  const leftArm = new THREE.Mesh(armGeo, suitMat);
  leftArm.position.set(-0.21, 1.16, -0.36);
  leftArm.rotation.set(-0.75, 0, -0.22);
  riderGroup.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.21;
  rightArm.rotation.z = 0.22;
  riderGroup.add(rightArm);

  // Rider Legs tucked against tank
  const thighGeo = new THREE.CapsuleGeometry(0.085, 0.36, 6, 10);
  const leftLeg = new THREE.Mesh(thighGeo, leatherDarkMat);
  leftLeg.position.set(-0.23, 0.88, 0.22);
  leftLeg.rotation.set(0.68, 0, 0.12);
  riderGroup.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.23;
  rightLeg.rotation.z = -0.12;
  riderGroup.add(rightLeg);

  chassisPivot.add(riderGroup);

  return {
    root,
    chassisPivot,
    frontWheel,
    rearWheel,
    boostFlame,
    wrongBeacon,
    brakeLightMat,
  };
}

export function createChampionshipTrophy(isSoftwareGl: boolean): THREE.Group {
  const group = new THREE.Group();

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    metalness: 0.94,
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  });

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.35,
    roughness: 0.25,
  });

  const plaqueMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.35,
    metalness: 0.85,
    roughness: 0.2,
  });

  // 1. Stepped Obsidian Pedestal Base
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.08, 0.28, 32), obsidianMat);
  base1.position.y = 0.14;
  base1.castShadow = !isSoftwareGl;
  group.add(base1);

  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.86, 0.36, 32), obsidianMat);
  base2.position.y = 0.46;
  group.add(base2);

  // Gold Championship Plaque Ring
  const plaqueRing = new THREE.Mesh(new THREE.CylinderGeometry(0.79, 0.79, 0.16, 32), plaqueMat);
  plaqueRing.position.y = 0.46;
  group.add(plaqueRing);

  // 2. Sculpted Lathe Chalice Stem & Cup
  const lathePoints = [
    new THREE.Vector2(0.0, 0.64),
    new THREE.Vector2(0.48, 0.64),
    new THREE.Vector2(0.22, 0.85),
    new THREE.Vector2(0.16, 1.25),
    new THREE.Vector2(0.28, 1.48),
    new THREE.Vector2(0.68, 2.05),
    new THREE.Vector2(0.78, 2.55),
    new THREE.Vector2(0.84, 2.72),
    new THREE.Vector2(0.74, 2.72),
    new THREE.Vector2(0.56, 2.02),
    new THREE.Vector2(0.0, 1.62),
  ];
  const cupGeo = new THREE.LatheGeometry(lathePoints, 36);
  const cupMesh = new THREE.Mesh(cupGeo, goldMat);
  cupMesh.castShadow = !isSoftwareGl;
  group.add(cupMesh);

  // 3. Twin Ornate Handles
  const handleGeo = new THREE.TorusGeometry(0.42, 0.065, 14, 32, Math.PI * 1.15);
  const leftHandle = new THREE.Mesh(handleGeo, goldMat);
  leftHandle.position.set(-0.62, 2.16, 0);
  leftHandle.rotation.z = Math.PI * 0.48;
  group.add(leftHandle);

  const rightHandle = new THREE.Mesh(handleGeo, goldMat);
  rightHandle.position.set(0.62, 2.16, 0);
  rightHandle.rotation.z = -Math.PI * 0.48;
  rightHandle.rotation.y = Math.PI;
  group.add(rightHandle);

  // 4. Floating Crown Star Emblem at Apex
  const starCrown = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), plaqueMat);
  starCrown.position.set(0, 3.12, 0);
  group.add(starCrown);

  const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.03, 12, 32), plaqueMat);
  haloRing.position.set(0, 3.12, 0);
  group.add(haloRing);

  return group;
}
