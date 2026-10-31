import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CameraMode, RaceStatus, WinnerResult } from '../types/game';
import {
  createChampionshipTrophy,
  createSportMotorcycle,
  type MotorcycleRig,
} from './models';
import {
  createAsphaltRoadTexture,
  createCheckeredLineTexture,
  createContactShadowTexture,
  createFinishBannerTexture,
  createKerbTexture,
  DigitalScoreboardBoard,
} from './textures';

export interface BikeFXEvent {
  seq: number;
  type: 'correct' | 'wrong';
}

interface RaceArenaCanvasProps {
  totalSteps: number;
  lamaccaSteps: number;
  toaccaSteps: number;
  lamaccaName: string;
  toaccaName: string;
  status: RaceStatus;
  raceConcluded: boolean;
  countdownValue: number | 'GO' | null;
  cameraMode: CameraMode;
  winner: WinnerResult;
  hudCollapsed: boolean;
  lamaccaFx: BikeFXEvent;
  toaccaFx: BikeFXEvent;
}

const BASE_CRUISE_SPEED = 4.2; // m/s continuous slow forward cruise when not answering
const STEP_ADVANCE = 10.5; // meters of high-speed turbo surge per correct answer
const SEGMENT_LEN = 256; // exact modular length for seamless infinite circuit leapfrogging
const LANE_X_LAMACCA = -2.35;
const LANE_X_TOACCA = 2.35;

// Pre-allocated math vectors (Zero GC inside render loop)
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 1.3, -8);

export const RaceArenaCanvas: React.FC<RaceArenaCanvasProps> = (props) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const updateBoardRef = useRef<(() => void) | null>(null);
  const prevLamaccaFxSeq = useRef<number>(props.lamaccaFx.seq);
  const prevToaccaFxSeq = useRef<number>(props.toaccaFx.seq);

  const bikeAnimStateRef = useRef({
    cruiseZ: 0,
    lamaccaZ: 0,
    toaccaZ: 0,
    lockedFinishZ: null as number | null,
    lamaccaBoostTimer: 0,
    toaccaBoostTimer: 0,
    lamaccaWrongTimer: 0,
    toaccaWrongTimer: 0,
    viewOffsetRatio: 0.16,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070d19);
    scene.fog = new THREE.FogExp2(0x070d19, 0.0052);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.2,
      450,
    );
    camera.position.set(0, 3.6, 7.2);
    camera.lookAt(0, 1.3, -10);

    // Studio & Stadium Outdoor Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x0f172a, 0.9);
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);

    const keySun = new THREE.DirectionalLight(0xfffbeb, 1.9);
    keySun.position.set(16, 28, 14);
    keySun.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keySun.shadow.mapSize.set(1024, 1024);
      keySun.shadow.camera.near = 2;
      keySun.shadow.camera.far = 90;
      const d = 24;
      keySun.shadow.camera.left = -d;
      keySun.shadow.camera.right = d;
      keySun.shadow.camera.top = d;
      keySun.shadow.camera.bottom = -d;
      keySun.shadow.bias = -0.0005;
      keySun.shadow.normalBias = 0.02;
    }
    scene.add(keySun);
    scene.add(keySun.target);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-18, 12, -25);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const asphaltTex = createAsphaltRoadTexture(maxAniso);
    asphaltTex.repeat.set(1, 32); // 256m / 32 = exact 8.0m tile
    const kerbTex = createKerbTexture(maxAniso);
    kerbTex.repeat.set(1, 128); // 256m / 128 = exact 2.0m tile
    const checkeredTex = createCheckeredLineTexture(maxAniso);
    const finishBannerTex = createFinishBannerTexture(maxAniso);
    const contactShadowTex = createContactShadowTexture();
    const digitalBoard = new DigitalScoreboardBoard(maxAniso);

    // Create Hero Motorcycles (LAMACCA & TOACCA) scaled 1.16x for bold visibility
    const lamaccaBike: MotorcycleRig = createSportMotorcycle('lamacca', contactShadowTex, isSoftwareGl);
    lamaccaBike.root.scale.setScalar(1.16);
    lamaccaBike.root.position.set(LANE_X_LAMACCA, 0, 0);
    scene.add(lamaccaBike.root);

    const toaccaBike: MotorcycleRig = createSportMotorcycle('toacca', contactShadowTex, isSoftwareGl);
    toaccaBike.root.scale.setScalar(1.16);
    toaccaBike.root.position.set(LANE_X_TOACCA, 0, 0);
    scene.add(toaccaBike.root);

    // Shared Track Materials & Geometries
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.78,
      roughness: 0.28,
    });
    const boardMat = new THREE.MeshBasicMaterial({ map: digitalBoard.texture });

    // Start Gantry + 5 Starting Lights + Live Digital Scoreboard at Z = -1.5
    const startGantry = new THREE.Group();
    const pillarGeo = new THREE.CylinderGeometry(0.28, 0.34, 7.2, 16);
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-6.6, 3.6, -1.5);
    startGantry.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(6.6, 3.6, -1.5);
    startGantry.add(rightPillar);

    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.52, 0.65), pillarMat);
    crossBeam.position.set(0, 6.9, -1.5);
    startGantry.add(crossBeam);

    const startScoreboard = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 2.1), boardMat);
    startScoreboard.position.set(0, 8.3, -1.16);
    startGantry.add(startScoreboard);

    const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(8.9, 2.35, 0.28), pillarMat);
    boardFrame.position.set(0, 8.3, -1.32);
    startGantry.add(boardFrame);

    const startLightMats: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < 5; i++) {
      const podX = (i - 2) * 1.15;
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.98, 0.35), pillarMat);
      housing.position.set(podX, 6.08, -1.35);
      startGantry.add(housing);

      const lMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        emissive: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.2,
      });
      startLightMats.push(lMat);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), lMat);
      bulb.position.set(podX, 6.08, -1.14);
      startGantry.add(bulb);
    }

    const startStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(10.2, 1.3),
      new THREE.MeshStandardMaterial({
        map: checkeredTex,
        roughness: 0.55,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
    startStrip.rotation.x = -Math.PI / 2;
    startStrip.position.set(0, 0.025, -1.5);
    startGantry.add(startStrip);

    scene.add(startGantry);

    // =========================================================================
    // SEAMLESS INFINITE MODULAR STADIUM CIRCUIT (2 x 256m Leapfrog Segments)
    // Allows continuous slow cruising of arbitrary duration without running out of road!
    // =========================================================================
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x0b192c,
      roughness: 0.95,
      metalness: 0.02,
    });
    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.68,
      metalness: 0.12,
    });
    const kerbMat = new THREE.MeshStandardMaterial({
      map: kerbTex,
      roughness: 0.55,
    });
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.65,
      roughness: 0.38,
    });
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.35,
      metalness: 0.5,
      roughness: 0.3,
    });
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.3,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.6,
      roughness: 0.35,
    });
    const lightBulbMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
    const crowdMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.85,
    });

    const grassGeo = new THREE.PlaneGeometry(340, SEGMENT_LEN);
    const roadGeo = new THREE.PlaneGeometry(11.2, SEGMENT_LEN);
    const kerbGeo = new THREE.BoxGeometry(0.65, 0.06, SEGMENT_LEN);
    const barrierGeo = new THREE.BoxGeometry(0.42, 0.85, 3.4);
    const pylonGeo = new THREE.CylinderGeometry(0.11, 0.14, 2.3, 10);
    const crowdGeo = new THREE.CapsuleGeometry(0.18, 0.35, 4, 8);
    const foliageGeo = new THREE.ConeGeometry(1.8, 4.8, 7);
    const floodPoleGeo = new THREE.CylinderGeometry(0.18, 0.28, 15, 10);
    const lampBankGeo = new THREE.BoxGeometry(2.4, 1.1, 0.4);
    const roofGeo = new THREE.BoxGeometry(7.8, 0.28, 22.8);
    const tierGeos = [
      new THREE.BoxGeometry(2.2, 1.1, 22),
      new THREE.BoxGeometry(2.2, 2.1, 22),
      new THREE.BoxGeometry(2.2, 3.1, 22),
    ];

    const buildModularSegment = (): THREE.Group => {
      const seg = new THREE.Group();
      const _dummy = new THREE.Object3D();
      const _col = new THREE.Color();

      // 1. Turf
      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.rotation.x = -Math.PI / 2;
      grass.position.set(0, -0.04, 0);
      grass.receiveShadow = !isSoftwareGl;
      seg.add(grass);

      // 2. Asphalt Road
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0, 0);
      road.receiveShadow = !isSoftwareGl;
      seg.add(road);

      // 3. Red-White Kerbs
      const leftKerb = new THREE.Mesh(kerbGeo, kerbMat);
      leftKerb.position.set(-5.92, 0.02, 0);
      seg.add(leftKerb);

      const rightKerb = new THREE.Mesh(kerbGeo, kerbMat);
      rightKerb.position.set(5.92, 0.02, 0);
      seg.add(rightKerb);

      // 4. Safety Barriers (64 pairs @ exact 4.0m spacing across [-128, +128])
      const barrierPairs = 64;
      const barrierInst = new THREE.InstancedMesh(barrierGeo, barrierMat, barrierPairs * 2);
      let bIdx = 0;
      for (let i = 0; i < barrierPairs; i++) {
        const bz = 126 - i * 4.0;
        _dummy.position.set(-7.1, 0.425, bz);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        barrierInst.setMatrixAt(bIdx++, _dummy.matrix);

        _dummy.position.set(7.1, 0.425, bz);
        _dummy.updateMatrix();
        barrierInst.setMatrixAt(bIdx++, _dummy.matrix);
      }
      barrierInst.instanceMatrix.needsUpdate = true;
      barrierInst.computeBoundingSphere();
      seg.add(barrierInst);

      // 5. Trackside LED Pylons (32 pairs @ exact 8.0m spacing)
      const pylonPairs = 32;
      const pylonInst = new THREE.InstancedMesh(pylonGeo, pylonMat, pylonPairs * 2);
      let pIdx = 0;
      for (let s = 0; s < pylonPairs; s++) {
        const pz = 124 - s * 8.0;
        const isMajor = s % 4 === 0;
        _dummy.position.set(-6.45, isMajor ? 1.45 : 1.05, pz);
        _dummy.scale.set(1, isMajor ? 1.3 : 0.9, 1);
        _dummy.updateMatrix();
        pylonInst.setMatrixAt(pIdx, _dummy.matrix);
        _col.setHex(isMajor ? 0xfbbf24 : 0x38bdf8);
        pylonInst.setColorAt(pIdx++, _col);

        _dummy.position.set(6.45, isMajor ? 1.45 : 1.05, pz);
        _dummy.updateMatrix();
        pylonInst.setMatrixAt(pIdx, _dummy.matrix);
        _col.setHex(isMajor ? 0xfbbf24 : 0x34d399);
        pylonInst.setColorAt(pIdx++, _col);
      }
      pylonInst.instanceMatrix.needsUpdate = true;
      if (pylonInst.instanceColor) pylonInst.instanceColor.needsUpdate = true;
      pylonInst.computeBoundingSphere();
      seg.add(pylonInst);

      // 6. Grandstands + Spectators + Floodlights (8 pairs @ exact 32.0m spacing)
      const numStands = 8;
      const crowdTotal = numStands * 2 * 26;
      const crowdInst = new THREE.InstancedMesh(crowdGeo, crowdMat, crowdTotal);
      let cIdx = 0;

      for (let g = 0; g < numStands; g++) {
        const gz = 112 - g * 32.0;

        [-1, 1].forEach((side) => {
          const baseX = side * 13.5;
          for (let tier = 0; tier < 3; tier++) {
            const tierMesh = new THREE.Mesh(tierGeos[tier], standMat);
            tierMesh.position.set(baseX + side * tier * 2.1, (1.1 + tier * 1.0) / 2, gz);
            seg.add(tierMesh);
          }

          const roof = new THREE.Mesh(roofGeo, roofMat);
          roof.position.set(baseX + side * 2.0, 5.8, gz);
          roof.rotation.z = side * 0.14;
          seg.add(roof);

          for (let sp = 0; sp < 26; sp++) {
            const tier = sp % 3;
            const zOff = ((sp * 7.3) % 19) - 9.5;
            _dummy.position.set(
              baseX + side * (tier * 2.1 + (((sp * 3.7) % 1) - 0.5) * 0.55),
              1.35 + tier * 1.0,
              gz + zOff,
            );
            _dummy.scale.setScalar(0.9 + (sp % 3) * 0.08);
            _dummy.updateMatrix();
            crowdInst.setMatrixAt(cIdx, _dummy.matrix);
            _col.setHex(
              side < 0
                ? [0x38bdf8, 0x2563eb, 0xf8fafc, 0xfbbf24][sp % 4]
                : [0x34d399, 0x16a34a, 0xf8fafc, 0xfbbf24][sp % 4],
            );
            crowdInst.setColorAt(cIdx++, _col);
          }

          if (g % 2 === 0) {
            const pole = new THREE.Mesh(floodPoleGeo, pillarMat);
            pole.position.set(side * 10.2, 7.5, gz + 12);
            seg.add(pole);

            const lampBank = new THREE.Mesh(lampBankGeo, lightBulbMat);
            lampBank.position.set(side * 9.8, 15.2, gz + 12);
            lampBank.lookAt(0, 0, gz + 12);
            seg.add(lampBank);
          }
        });
      }
      crowdInst.instanceMatrix.needsUpdate = true;
      if (crowdInst.instanceColor) crowdInst.instanceColor.needsUpdate = true;
      crowdInst.computeBoundingSphere();
      seg.add(crowdInst);

      // 7. Perimeter Trees (16 pairs @ exact 16.0m spacing)
      const treePairs = 16;
      const treeInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treePairs * 2);
      let tIdx = 0;
      for (let t = 0; t < treePairs; t++) {
        const tz = 120 - t * 16.0;
        [-1, 1].forEach((side) => {
          _dummy.position.set(side * (23 + (t % 3) * 4.5), 2.4, tz);
          _dummy.scale.setScalar(0.85 + (t % 4) * 0.14);
          _dummy.updateMatrix();
          treeInst.setMatrixAt(tIdx, _dummy.matrix);
          _col.setHex(t % 2 === 0 ? 0x065f46 : 0x0f766e);
          treeInst.setColorAt(tIdx++, _col);
        });
      }
      treeInst.instanceMatrix.needsUpdate = true;
      if (treeInst.instanceColor) treeInst.instanceColor.needsUpdate = true;
      treeInst.computeBoundingSphere();
      seg.add(treeInst);

      return seg;
    };

    const segA = buildModularSegment();
    const segB = buildModularSegment();
    segA.position.z = -96;
    segB.position.z = -352;
    scene.add(segA);
    scene.add(segB);

    // =========================================================================
    // GRAND CHECKERED FINISH ARCHWAY & 3D GOLDEN TROPHY PODIUM
    // =========================================================================
    const finishArch = new THREE.Group();
    const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.85, 8.2, 0.85), pillarMat);
    fLeft.position.set(-6.5, 4.1, 0);
    finishArch.add(fLeft);

    const fRight = new THREE.Mesh(new THREE.BoxGeometry(0.85, 8.2, 0.85), pillarMat);
    fRight.position.set(6.5, 4.1, 0);
    finishArch.add(fRight);

    const fBannerMat = new THREE.MeshBasicMaterial({ map: finishBannerTex });
    const fBanner = new THREE.Mesh(new THREE.BoxGeometry(14.2, 2.5, 0.55), fBannerMat);
    fBanner.position.set(0, 7.2, 0);
    finishArch.add(fBanner);

    const finishScoreboard = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 1.95), boardMat);
    finishScoreboard.position.set(0, 9.65, 0.3);
    finishArch.add(finishScoreboard);

    const finishStripMat = new THREE.MeshStandardMaterial({
      map: checkeredTex,
      roughness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const finishStrip = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 2.0), finishStripMat);
    finishStrip.rotation.x = -Math.PI / 2;
    finishStrip.position.set(0, 0.03, 0);
    finishArch.add(finishStrip);
    finishArch.visible = false;
    scene.add(finishArch);

    const finishPodiumGroup = new THREE.Group();
    const trophyModel = createChampionshipTrophy(isSoftwareGl);
    trophyModel.position.set(0, 0.55, 0);
    finishPodiumGroup.add(trophyModel);

    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.45,
      roughness: 0.3,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.2,
    });
    const podiumDeck = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.55, 36), podiumMat);
    podiumDeck.position.set(0, 0.275, 0);
    finishPodiumGroup.add(podiumDeck);

    const podiumRing = new THREE.Mesh(new THREE.TorusGeometry(3.22, 0.06, 12, 48), goldTrimMat);
    podiumRing.rotation.x = Math.PI / 2;
    podiumRing.position.set(0, 0.55, 0);
    finishPodiumGroup.add(podiumRing);

    const trophySpot = new THREE.PointLight(0xfbbf24, 3.2, 18, 1.5);
    trophySpot.position.set(0, 6.2, 2.5);
    finishPodiumGroup.add(trophySpot);
    finishPodiumGroup.visible = false;
    scene.add(finishPodiumGroup);

    // 3D Confetti Particles around Finish Podium
    const CONFETTI_COUNT = 180;
    const confettiGeo = new THREE.PlaneGeometry(0.18, 0.1);
    const confettiMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const confettiMesh = new THREE.InstancedMesh(confettiGeo, confettiMat, CONFETTI_COUNT);
    confettiMesh.frustumCulled = false;
    const confettiData = Array.from({ length: CONFETTI_COUNT }, (_, idx) => ({
      x: (Math.random() - 0.5) * 12,
      y: Math.random() * 9 + 1,
      z: (Math.random() - 0.5) * 10,
      vy: 1.4 + Math.random() * 1.8,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 5,
      color: [0xfbbf24, 0x38bdf8, 0x34d399, 0xf8fafc, 0xf43f5e][idx % 5],
    }));
    const _cColor = new THREE.Color();
    confettiData.forEach((c, i) => {
      _cColor.setHex(c.color);
      confettiMesh.setColorAt(i, _cColor);
    });
    if (confettiMesh.instanceColor) confettiMesh.instanceColor.needsUpdate = true;
    finishPodiumGroup.add(confettiMesh);

    // Speed Wind Streak Particles
    const SPEED_STREAKS = 56;
    const streakGeo = new THREE.BoxGeometry(0.032, 0.032, 1.9);
    const streakMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.25,
    });
    const streakInstanced = new THREE.InstancedMesh(streakGeo, streakMat, SPEED_STREAKS);
    streakInstanced.frustumCulled = false;
    const streakSeeds = Array.from({ length: SPEED_STREAKS }, () => ({
      xOff: (Math.random() - 0.5) * 14,
      y: 0.4 + Math.random() * 3.5,
      zPhase: Math.random() * 45,
      speed: 14 + Math.random() * 14,
    }));
    scene.add(streakInstanced);

    const refreshDigitalBoard = () => {
      const p = propsRef.current;
      let statusLabel = 'BALAPAN BERLANGSUNG';
      if (p.status === 'preparing') statusLabel = 'SIAP DI GARIS START';
      else if (p.status === 'countdown') {
        statusLabel =
          p.countdownValue === 'GO' ? 'GO! GAS POLL!' : `BERSIAP: ${p.countdownValue ?? ''}`;
      } else if (p.status === 'finished' || p.raceConcluded) {
        if (p.winner === 'lamacca') statusLabel = 'JUARA: TIM LAMACCA!';
        else if (p.winner === 'toacca') statusLabel = 'JUARA: TIM TOACCA!';
        else statusLabel = 'HASIL SERI — JUARA BERSAMA!';
      }

      digitalBoard.update(
        p.lamaccaName,
        p.lamaccaSteps,
        p.toaccaName,
        p.toaccaSteps,
        p.totalSteps,
        statusLabel,
      );
    };

    refreshDigitalBoard();
    updateBoardRef.current = refreshDigitalBoard;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let unmounted = false;
    const _instObj = new THREE.Object3D();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (unmounted) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (unmounted) return;
      const rawDelta = clock.getDelta();
      const dt = Math.min(rawDelta, 0.1);
      const elapsed = clock.getElapsedTime();

      const p = propsRef.current;
      const anim = bikeAnimStateRef.current;

      // Reset circuit & bikes cleanly when on preparation or starting grid countdown
      if (p.status === 'preparing' || (p.status === 'countdown' && p.countdownValue !== 'GO')) {
        anim.cruiseZ = 0;
        anim.lamaccaZ = 0;
        anim.toaccaZ = 0;
        anim.lockedFinishZ = null;
        segA.position.z = -96;
        segB.position.z = -352;
        finishArch.visible = false;
        finishPodiumGroup.visible = false;
      }

      // 1. Update Start Gantry Countdown Lights
      startLightMats.forEach((mat, idx) => {
        if (p.status === 'countdown') {
          if (p.countdownValue === 'GO') {
            mat.color.setHex(0x22c55e);
            mat.emissive.setHex(0x22c55e);
            mat.emissiveIntensity = 2.6;
          } else if (typeof p.countdownValue === 'number') {
            const activeCount = p.countdownValue === 3 ? 2 : p.countdownValue === 2 ? 4 : 5;
            if (idx < activeCount) {
              mat.color.setHex(0xef4444);
              mat.emissive.setHex(0xef4444);
              mat.emissiveIntensity = 2.4;
            } else {
              mat.color.setHex(0x1f2937);
              mat.emissiveIntensity = 0;
            }
          }
        } else if (p.status === 'racing') {
          mat.color.setHex(0x22c55e);
          mat.emissive.setHex(0x22c55e);
          mat.emissiveIntensity = 1.2;
        } else {
          mat.color.setHex(0x334155);
          mat.emissiveIntensity = 0;
        }
      });

      // 2. Continuous Slow Cruise ("MELAJU LAMBAT") vs Correct Answer Turbo Surge ("MELAJU KENCANG")
      const isActivelyRolling =
        (p.status === 'countdown' && p.countdownValue === 'GO') ||
        (p.status === 'racing' && !p.raceConcluded);

      if (isActivelyRolling) {
        // Both motorcycles continuously cruise forward slowly down the circuit even when not answering
        anim.cruiseZ -= BASE_CRUISE_SPEED * dt;
      }

      // Anchor Finish Line Archway & 3D Trophy Podium the exact moment race concludes
      if ((p.raceConcluded || p.status === 'finished') && anim.lockedFinishZ === null) {
        let computedLeadTargetZ =
          anim.cruiseZ - Math.max(p.lamaccaSteps, p.toaccaSteps) * STEP_ADVANCE;
        const currentLeadZ = Math.min(anim.lamaccaZ, anim.toaccaZ);
        if (Math.abs(computedLeadTargetZ - currentLeadZ) < 4.0) {
          anim.cruiseZ -= 10.5;
          computedLeadTargetZ =
            anim.cruiseZ - Math.max(p.lamaccaSteps, p.toaccaSteps) * STEP_ADVANCE;
        }
        anim.lockedFinishZ = computedLeadTargetZ + 2.2;
        finishArch.position.set(0, 0, anim.lockedFinishZ);
        finishPodiumGroup.position.set(0, 0, anim.lockedFinishZ - 6.5);
        finishArch.visible = true;
        finishPodiumGroup.visible = true;
      }

      const targetLamaccaZ = anim.cruiseZ - p.lamaccaSteps * STEP_ADVANCE;
      const targetToaccaZ = anim.cruiseZ - p.toaccaSteps * STEP_ADVANCE;

      const prevLZ = anim.lamaccaZ;
      const prevTZ = anim.toaccaZ;

      const lDamp = anim.lamaccaBoostTimer > 0 ? 6.2 : 5.0;
      const tDamp = anim.toaccaBoostTimer > 0 ? 6.2 : 5.0;

      anim.lamaccaZ = THREE.MathUtils.damp(anim.lamaccaZ, targetLamaccaZ, lDamp, dt);
      anim.toaccaZ = THREE.MathUtils.damp(anim.toaccaZ, targetToaccaZ, tDamp, dt);

      const lSpeed = Math.abs(anim.lamaccaZ - prevLZ) / Math.max(0.001, dt);
      const tSpeed = Math.abs(anim.toaccaZ - prevTZ) / Math.max(0.001, dt);

      lamaccaBike.root.position.z = anim.lamaccaZ;
      toaccaBike.root.position.z = anim.toaccaZ;

      // Seamless modular leapfrogging of the two 256m track segments
      const rearReferenceZ = Math.max(anim.lamaccaZ, anim.toaccaZ, camera.position.z);
      [segA, segB].forEach((seg) => {
        // Front-most (-Z) edge of this segment is seg.position.z - 128
        if (rearReferenceZ < seg.position.z - SEGMENT_LEN / 2 - 32) {
          seg.position.z -= SEGMENT_LEN * 2;
        }
      });

      const idleVibL = Math.sin(elapsed * 42) * 0.008;
      const idleVibT = Math.cos(elapsed * 44) * 0.008;

      // Wheel rotation directly matches real world speed (slow spin on cruise, rapid blur on correct boost!)
      const wheelRadius = 0.48;
      lamaccaBike.frontWheel.rotation.x -= (lSpeed * dt) / wheelRadius;
      lamaccaBike.rearWheel.rotation.x -= (lSpeed * dt) / wheelRadius;
      toaccaBike.frontWheel.rotation.x -= (tSpeed * dt) / wheelRadius;
      toaccaBike.rearWheel.rotation.x -= (tSpeed * dt) / wheelRadius;

      // High-speed turbo boost FX (Wheelie + Dual Afterburner Flames) when answering correctly
      if (anim.lamaccaBoostTimer > 0) {
        anim.lamaccaBoostTimer = Math.max(0, anim.lamaccaBoostTimer - dt);
        const boostRatio = Math.sin((anim.lamaccaBoostTimer / 1.25) * Math.PI);
        lamaccaBike.chassisPivot.rotation.x = boostRatio * 0.17;
        (lamaccaBike.boostFlame.material as THREE.MeshBasicMaterial).opacity = boostRatio * 0.95;
        lamaccaBike.boostFlame.scale.set(1.15, 0.95 + Math.random() * 0.75, 1.15);
      } else {
        lamaccaBike.chassisPivot.rotation.x = THREE.MathUtils.damp(
          lamaccaBike.chassisPivot.rotation.x,
          0,
          8,
          dt,
        );
        (lamaccaBike.boostFlame.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      if (anim.toaccaBoostTimer > 0) {
        anim.toaccaBoostTimer = Math.max(0, anim.toaccaBoostTimer - dt);
        const boostRatio = Math.sin((anim.toaccaBoostTimer / 1.25) * Math.PI);
        toaccaBike.chassisPivot.rotation.x = boostRatio * 0.17;
        (toaccaBike.boostFlame.material as THREE.MeshBasicMaterial).opacity = boostRatio * 0.95;
        toaccaBike.boostFlame.scale.set(1.15, 0.95 + Math.random() * 0.75, 1.15);
      } else {
        toaccaBike.chassisPivot.rotation.x = THREE.MathUtils.damp(
          toaccaBike.chassisPivot.rotation.x,
          0,
          8,
          dt,
        );
        (toaccaBike.boostFlame.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // Wrong answer shudder + brake light flash (remains at slow cruise speed without boost)
      if (anim.lamaccaWrongTimer > 0) {
        anim.lamaccaWrongTimer = Math.max(0, anim.lamaccaWrongTimer - dt);
        lamaccaBike.chassisPivot.rotation.z =
          Math.sin(elapsed * 38) * 0.08 * anim.lamaccaWrongTimer;
        (lamaccaBike.wrongBeacon.material as THREE.MeshBasicMaterial).opacity =
          anim.lamaccaWrongTimer * 0.85;
        lamaccaBike.brakeLightMat.emissiveIntensity = 3.0;
      } else {
        lamaccaBike.chassisPivot.rotation.z = 0;
        (lamaccaBike.wrongBeacon.material as THREE.MeshBasicMaterial).opacity = 0;
        lamaccaBike.brakeLightMat.emissiveIntensity = 0.8;
      }

      if (anim.toaccaWrongTimer > 0) {
        anim.toaccaWrongTimer = Math.max(0, anim.toaccaWrongTimer - dt);
        toaccaBike.chassisPivot.rotation.z =
          Math.sin(elapsed * 38) * 0.08 * anim.toaccaWrongTimer;
        (toaccaBike.wrongBeacon.material as THREE.MeshBasicMaterial).opacity =
          anim.toaccaWrongTimer * 0.85;
        toaccaBike.brakeLightMat.emissiveIntensity = 3.0;
      } else {
        toaccaBike.chassisPivot.rotation.z = 0;
        (toaccaBike.wrongBeacon.material as THREE.MeshBasicMaterial).opacity = 0;
        toaccaBike.brakeLightMat.emissiveIntensity = 0.8;
      }

      lamaccaBike.chassisPivot.position.y = idleVibL;
      toaccaBike.chassisPivot.position.y = idleVibT;

      // 3. Directional Shadow Sun follows bikes
      const midZ = (anim.lamaccaZ + anim.toaccaZ) * 0.5;
      const leadZ = Math.min(anim.lamaccaZ, anim.toaccaZ);
      const trailingZ = Math.max(anim.lamaccaZ, anim.toaccaZ);
      keySun.position.set(16, 28, midZ + 14);
      keySun.target.position.set(0, 0, midZ - 4);
      keySun.target.updateMatrixWorld();

      // 4. Wind Speed Streak Particles (Subtle on slow cruise, intense rush on high-speed turbo boost!)
      const maxBikeSpeed = Math.max(lSpeed, tSpeed);
      const boostExcess = Math.max(0, maxBikeSpeed - BASE_CRUISE_SPEED);
      streakMat.opacity = THREE.MathUtils.clamp(0.06 + boostExcess * 0.025, 0.06, 0.58);
      for (let i = 0; i < SPEED_STREAKS; i++) {
        const st = streakSeeds[i];
        const localZ = ((elapsed * (st.speed + boostExcess * 1.9) + st.zPhase) % 45) - 30;
        _instObj.position.set(st.xOff, st.y, midZ + localZ);
        _instObj.scale.set(1, 1, 0.55 + boostExcess * 0.14);
        _instObj.updateMatrix();
        streakInstanced.setMatrixAt(i, _instObj.matrix);
      }
      streakInstanced.instanceMatrix.needsUpdate = true;

      // 5. Trophy Rotation & Confetti at Finish Line
      if (finishPodiumGroup.visible) {
        trophyModel.rotation.y = elapsed * 1.15;
        trophyModel.position.y = 0.55 + Math.sin(elapsed * 2.4) * 0.08;
      }

      confettiMesh.visible = p.status === 'finished';
      if (p.status === 'finished') {
        for (let i = 0; i < CONFETTI_COUNT; i++) {
          const c = confettiData[i];
          c.y -= c.vy * dt;
          if (c.y < 0.2) {
            c.y = 8.5 + Math.random() * 2.5;
          }
          c.rx += c.spin * dt;
          c.ry += c.spin * 0.8 * dt;
          _instObj.position.set(c.x, c.y, c.z);
          _instObj.rotation.set(c.rx, c.ry, 0);
          _instObj.updateMatrix();
          confettiMesh.setMatrixAt(i, _instObj.matrix);
        }
        confettiMesh.instanceMatrix.needsUpdate = true;
      }

      // 6. Optical View-Offset Framing:
      // Shifts the 3D optical center into the upper half of the screen so BOTH motorcycles and dual question boxes are clear
      let targetOffsetRatio = 0;
      if (p.status === 'racing' && !p.hudCollapsed) {
        targetOffsetRatio = 0.19;
      } else if (p.status === 'preparing') {
        targetOffsetRatio = 0.21;
      } else if (p.status === 'finished' && !p.hudCollapsed) {
        targetOffsetRatio = 0.16;
      }

      anim.viewOffsetRatio = THREE.MathUtils.damp(
        anim.viewOffsetRatio,
        targetOffsetRatio,
        6.0,
        dt,
      );

      const cw = Math.max(1, container?.clientWidth || window.innerWidth);
      const ch = Math.max(1, container?.clientHeight || window.innerHeight);

      let effectiveCamMode: CameraMode = p.cameraMode;
      if (p.status === 'preparing' || p.status === 'countdown') {
        effectiveCamMode = 'cinematic_start';
      } else if (p.status === 'finished') {
        effectiveCamMode = 'cinematic_finish';
      }

      if (effectiveCamMode === 'cinematic_start') {
        const orbitAngle = Math.sin(elapsed * 0.5) * 0.52;
        _camTargetPos.set(Math.sin(orbitAngle) * 6.8, 3.1, 6.6 + Math.cos(orbitAngle) * 1.1);
        _camLookTarget.set(0, 1.35, -3.5);
      } else if (effectiveCamMode === 'cinematic_finish') {
        const podiumZ = (anim.lockedFinishZ ?? leadZ) - 6.5;
        const angle = elapsed * 0.5;
        _camTargetPos.set(Math.sin(angle) * 8.2, 3.6, podiumZ + Math.cos(angle) * 8.2);
        _camLookTarget.set(0, 2.0, podiumZ);
      } else if (effectiveCamMode === 'side') {
        const focusZ = THREE.MathUtils.lerp(midZ, leadZ, 0.5);
        _camTargetPos.set(9.6, 3.3, focusZ + 2.6);
        _camLookTarget.set(0, 1.15, focusZ - 0.8);
      } else if (effectiveCamMode === 'track') {
        const focusZ = THREE.MathUtils.lerp(midZ, leadZ, 0.5);
        const spread = Math.min(18, Math.abs(anim.lamaccaZ - anim.toaccaZ) * 0.38);
        _camTargetPos.set(0, 8.8 + spread * 0.35, focusZ + 11.5 + spread * 0.45);
        _camLookTarget.set(0, 0.9, focusZ - 6.5);
      } else {
        // Default 'chase': Heroic view right behind the racing duel!
        const gap = Math.abs(anim.lamaccaZ - anim.toaccaZ);
        const anchorRearZ = gap > 36 ? leadZ + 36 : trailingZ;
        const spread = Math.min(13, gap * 0.28);
        _camTargetPos.set(0, 3.15 + spread * 0.12, anchorRearZ + 6.2 + spread * 0.3);
        _camLookTarget.set(0, 1.25, leadZ - 6.0);
      }

      const targetFov = THREE.MathUtils.clamp(49.5 + boostExcess * 0.55, 49.5, 62);
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 5.5, dt);

      if (anim.viewOffsetRatio > 0.002) {
        camera.setViewOffset(cw, ch, 0, Math.round(ch * anim.viewOffsetRatio), cw, ch);
      } else {
        camera.clearViewOffset();
      }
      camera.updateProjectionMatrix();

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, 5.2, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, 5.2, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, 5.8, dt);

      _currentLookAt.x = THREE.MathUtils.damp(_currentLookAt.x, _camLookTarget.x, 6.0, dt);
      _currentLookAt.y = THREE.MathUtils.damp(_currentLookAt.y, _camLookTarget.y, 6.0, dt);
      _currentLookAt.z = THREE.MathUtils.damp(_currentLookAt.z, _camLookTarget.z, 6.5, dt);
      camera.lookAt(_currentLookAt);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      unmounted = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      [
        grassGeo,
        roadGeo,
        kerbGeo,
        barrierGeo,
        pylonGeo,
        crowdGeo,
        foliageGeo,
        floodPoleGeo,
        lampBankGeo,
        roofGeo,
        ...tierGeos,
        pillarGeo,
        confettiGeo,
        streakGeo,
      ].forEach((g) => g.dispose());
      [
        grassMat,
        roadMat,
        kerbMat,
        barrierMat,
        pylonMat,
        standMat,
        roofMat,
        lightBulbMat,
        crowdMat,
        foliageMat,
        pillarMat,
        boardMat,
        fBannerMat,
        finishStripMat,
        podiumMat,
        goldTrimMat,
        confettiMat,
        streakMat,
        ...startLightMats,
      ].forEach((m) => m.dispose());
      asphaltTex.dispose();
      kerbTex.dispose();
      checkeredTex.dispose();
      finishBannerTex.dispose();
      contactShadowTex.dispose();
      digitalBoard.texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    updateBoardRef.current?.();
  }, [
    props.totalSteps,
    props.lamaccaSteps,
    props.toaccaSteps,
    props.lamaccaName,
    props.toaccaName,
    props.status,
    props.raceConcluded,
    props.countdownValue,
    props.winner,
  ]);

  useEffect(() => {
    if (props.lamaccaFx.seq !== prevLamaccaFxSeq.current) {
      prevLamaccaFxSeq.current = props.lamaccaFx.seq;
      if (props.lamaccaFx.type === 'correct') {
        bikeAnimStateRef.current.lamaccaBoostTimer = 1.25;
      } else {
        bikeAnimStateRef.current.lamaccaWrongTimer = 0.9;
      }
    }
  }, [props.lamaccaFx]);

  useEffect(() => {
    if (props.toaccaFx.seq !== prevToaccaFxSeq.current) {
      prevToaccaFxSeq.current = props.toaccaFx.seq;
      if (props.toaccaFx.type === 'correct') {
        bikeAnimStateRef.current.toaccaBoostTimer = 1.25;
      } else {
        bikeAnimStateRef.current.toaccaWrongTimer = 0.9;
      }
    }
  }, [props.toaccaFx]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-[#070D19]"
      aria-label="Arena Balap Motor 3D LAMACCA VS TOACCA"
    />
  );
};
