import * as THREE from 'three';

export function createAsphaltRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base dark asphalt
  ctx.fillStyle = '#171E2E';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt grain
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = 20 + Math.floor(Math.random() * 22);
    ctx.fillStyle = `rgb(${shade}, ${shade + 5}, ${shade + 14})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Left lane subtle Denim/Electric Blue racing tint (LAMACCA)
  ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
  ctx.fillRect(42, 0, 200, 512);

  // Right lane subtle Soft Green/Neon Mint racing tint (TOACCA)
  ctx.fillStyle = 'rgba(22, 163, 74, 0.08)';
  ctx.fillRect(270, 0, 200, 512);

  // Outer white track boundary lines
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(28, 0, 10, 512);
  ctx.fillRect(474, 0, 10, 512);

  // Team accent inner strips
  ctx.fillStyle = '#0EA5E9';
  ctx.fillRect(42, 0, 5, 512);

  ctx.fillStyle = '#22C55E';
  ctx.fillRect(465, 0, 5, 512);

  // Center lane divider (dashed white/gold)
  ctx.fillStyle = '#F8FAFC';
  for (let y = 24; y < 512; y += 128) {
    ctx.fillRect(252, y, 8, 72);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createKerbTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(0, 128, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCheckeredLineTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const sq = 32;
  for (let y = 0; y < 128; y += sq) {
    for (let x = 0; x < 512; x += sq) {
      const even = ((x / sq) + (y / sq)) % 2 === 0;
      ctx.fillStyle = even ? '#F8FAFC' : '#0F172A';
      ctx.fillRect(x, y, sq, sq);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFinishBannerTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark navy carbon background
  ctx.fillStyle = '#070D19';
  ctx.fillRect(0, 0, 1024, 256);

  // Gold top & bottom trim
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(0, 0, 1024, 14);
  ctx.fillRect(0, 242, 1024, 14);

  // Left & right checkered wings
  const sq = 28;
  for (let y = 20; y < 236; y += sq) {
    for (let x = 16; x < 184; x += sq) {
      ctx.fillStyle = ((x / sq + y / sq) % 2 === 0) ? '#F8FAFC' : '#1E293B';
      ctx.fillRect(x, y, sq, sq);
    }
    for (let x = 840; x < 1008; x += sq) {
      ctx.fillStyle = ((x / sq + y / sq) % 2 === 0) ? '#F8FAFC' : '#1E293B';
      ctx.fillRect(x, y, sq, sq);
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FBBF24';
  ctx.font = 'bold 74px sans-serif';
  ctx.fillText('GARIS FINIS', 512, 128);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('LAMACCA VS TOACCA · 3D EDU RACING', 512, 192);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 128, 10, 64, 128, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.save();
  ctx.scale(1, 2);
  const g2 = ctx.createRadialGradient(64, 64, 6, 64, 64, 58);
  g2.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  g2.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
  g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, 128, 128);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export class DigitalScoreboardBoard {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public texture: THREE.CanvasTexture;

  constructor(maxAnisotropy: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 256;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = maxAnisotropy;
    this.update('LAMACCA', 0, 'TOACCA', 0, 100, 'PERSIAPAN BALAPAN');
  }

  public update(
    lamaccaName: string,
    lamaccaSteps: number,
    toaccaName: string,
    toaccaSteps: number,
    totalSteps: number,
    statusText: string,
  ): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#050B16';
    ctx.fillRect(0, 0, 1024, 256);

    // Subtle LED scanlines Border
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 1008, 240);

    // Left block: LAMACCA
    ctx.fillStyle = 'rgba(66, 106, 155, 0.35)';
    ctx.fillRect(20, 20, 380, 216);
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TIM LAMACCA', 42, 72);
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '24px sans-serif';
    ctx.fillText(lamaccaName.slice(0, 18), 42, 110);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px monospace';
    ctx.fillText(`${lamaccaSteps}/${totalSteps}`, 42, 198);

    // Center block: Status
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('PAPAN SKOR DIGITAL', 512, 82);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(statusText, 512, 155);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px sans-serif';
    ctx.fillText('3D EDU RACING CIRCUIT', 512, 208);

    // Right block: TOACCA
    ctx.fillStyle = 'rgba(22, 163, 74, 0.35)';
    ctx.fillRect(624, 20, 380, 216);
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('TIM TOACCA', 982, 72);
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '24px sans-serif';
    ctx.fillText(toaccaName.slice(0, 18), 982, 110);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px monospace';
    ctx.fillText(`${toaccaSteps}/${totalSteps}`, 982, 198);

    this.texture.needsUpdate = true;
  }
}
