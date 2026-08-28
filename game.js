(() => {
  "use strict";

  const GAME_TEXT = Object.freeze({
    title: "Escuela de Aviación",
    intro: "Un vuelo nocturno alrededor del mundo.",
    endingLine1: "Vuelo completado.",
    endingLine2: "La tortuga llegó a su destino."
  });

  const CONFIG = Object.freeze({
    finalDistance: 14800,
    approachAt: 0.86,
    maxAltitude: 7600,
    minAltitude: 110,
    cruiseSpeed: 174,
    routeSpeedBoost: 36,
    arrivalDurations: Object.freeze({ approach: 3.5, landing: 4.5, taxi: 4, disembark: 5 }),
    obstacleGap: [540, 1250],
    obstacleSpeed: [18, 132],
    obstacleAmplitude: [12, 88],
    approachClearAt: 0.9,
    collisionFuelLoss: 11,
    invulnerabilitySeconds: 1.8
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const smoothstep = (edge0, edge1, value) => {
    const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  };
  const mixColor = (a, b, t) => a.map((value, index) => Math.round(lerp(value, b[index], t)));
  const rgba = (color, alpha = 1) => `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
  const getDifficulty = progress => {
    const level = smoothstep(.04, .88, clamp(progress, 0, 1));
    return {
      level,
      obstacleSpeed: lerp(CONFIG.obstacleSpeed[0], CONFIG.obstacleSpeed[1], level),
      spawnGap: lerp(CONFIG.obstacleGap[1], CONFIG.obstacleGap[0], level),
      movementAmplitude: lerp(CONFIG.obstacleAmplitude[0], CONFIG.obstacleAmplitude[1], level)
    };
  };

  class SeededRandom {
    constructor(seed = 123456) { this.seed = seed >>> 0; }
    next() {
      this.seed = (1664525 * this.seed + 1013904223) >>> 0;
      return this.seed / 4294967296;
    }
    range(min, max) { return min + (max - min) * this.next(); }
  }

  class InputManager {
    constructor(root) {
      this.root = root;
      this.keys = { up: false, down: false, left: false, right: false };
      this.onPause = null;
      this.onRestart = null;
      this.boundDown = event => this.handleKey(event, true);
      this.boundUp = event => this.handleKey(event, false);
      window.addEventListener("keydown", this.boundDown, { passive: false });
      window.addEventListener("keyup", this.boundUp, { passive: false });
      this.touchButtons = [...root.querySelectorAll("[data-key]")];
      this.touchHandlers = [];
      this.touchButtons.forEach(button => this.bindTouchButton(button));
    }

    handleKey(event, pressed) {
      const mapping = {
        KeyW: "up", ArrowUp: "up", KeyS: "down", ArrowDown: "down",
        KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right"
      };
      const action = mapping[event.code];
      if (action) {
        event.preventDefault();
        this.keys[action] = pressed;
      }
      if (!pressed || event.repeat) return;
      if (event.code === "KeyP" || event.code === "Escape") this.onPause?.();
      if (event.code === "KeyR") this.onRestart?.();
    }

    bindTouchButton(button) {
      const action = button.dataset.key;
      const press = event => {
        event.preventDefault();
        this.keys[action] = true;
        button.classList.add("is-active");
        button.setPointerCapture?.(event.pointerId);
      };
      const release = event => {
        event.preventDefault();
        this.keys[action] = false;
        button.classList.remove("is-active");
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      this.touchHandlers.push([button, press, release]);
    }

    clear() { Object.keys(this.keys).forEach(key => { this.keys[key] = false; }); }
    destroy() {
      window.removeEventListener("keydown", this.boundDown);
      window.removeEventListener("keyup", this.boundUp);
      this.touchHandlers.forEach(([button, press, release]) => {
        button.removeEventListener("pointerdown", press);
        button.removeEventListener("pointerup", release);
        button.removeEventListener("pointercancel", release);
      });
    }
  }

  class ParticleSystem {
    constructor() { this.particles = []; }
    emit(x, y, options = {}) {
      const count = options.count ?? 6;
      for (let i = 0; i < count; i += 1) {
        const angle = (options.angle ?? Math.PI) + (Math.random() - .5) * (options.spread ?? 1.2);
        const speed = (options.speed ?? 55) * (.45 + Math.random() * .8);
        this.particles.push({
          x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: options.life ?? .8, maxLife: options.life ?? .8,
          size: (options.size ?? 3) * (.55 + Math.random()), color: options.color ?? "190,220,255",
          drag: options.drag ?? .95
        });
      }
      if (this.particles.length > 180) this.particles.splice(0, this.particles.length - 180);
    }
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60);
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }
    render(ctx) {
      this.particles.forEach(p => {
        const alpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.fillStyle = `rgba(${p.color},${alpha * .7})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
      });
    }
    clear() { this.particles.length = 0; }
  }

  class Player {
    constructor() { this.reset(); }
    reset() {
      this.position = { x: 0, y: 500 };
      this.velocity = { x: CONFIG.cruiseSpeed, y: 0 };
      this.rotation = -.03;
      this.targetRotation = -.03;
      this.fuel = 100;
      this.invulnerability = 0;
      this.hitReaction = 0;
      this.blinkTimer = 2.2;
      this.blink = 0;
      this.gearProgress = 0;
      this.doorProgress = 0;
      this.turtleExitProgress = 0;
    }
    update(dt, input, progress, viewWidth, controlsEnabled = true) {
      const verticalInput = controlsEnabled ? Number(input.up) - Number(input.down) : 0;
      const horizontalInput = controlsEnabled ? Number(input.right) - Number(input.left) : 0;
      const routeFloor = 145 + Math.pow(progress, 1.62) * 6500;
      const gentleLift = this.position.y < routeFloor ? clamp((routeFloor - this.position.y) * .024, 0, 54) : 0;
      this.velocity.y += (verticalInput * 560 + gentleLift) * dt;
      this.velocity.y *= Math.pow(.975, dt * 60);
      this.velocity.y = clamp(this.velocity.y, -220, 240);
      const cruiseSpeed = CONFIG.cruiseSpeed + progress * CONFIG.routeSpeedBoost;
      const steeringSpeed = clamp(viewWidth * .32, 140, 420);
      const desiredSpeed = cruiseSpeed + horizontalInput * steeringSpeed;
      this.velocity.x = lerp(this.velocity.x, desiredSpeed, 1 - Math.pow(.9, dt * 60));
      this.velocity.x = clamp(this.velocity.x, cruiseSpeed - steeringSpeed, cruiseSpeed + steeringSpeed);
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      if (this.position.y < CONFIG.minAltitude) { this.position.y = CONFIG.minAltitude; this.velocity.y = Math.max(12, this.velocity.y); }
      if (this.position.y > CONFIG.maxAltitude) { this.position.y = CONFIG.maxAltitude; this.velocity.y = Math.min(-8, this.velocity.y); }
      this.targetRotation = clamp(-this.velocity.y / 245 - verticalInput * .08, -.48, .42);
      this.rotation = lerp(this.rotation, this.targetRotation, 1 - Math.pow(.9, dt * 60));
      this.invulnerability = Math.max(0, this.invulnerability - dt);
      this.hitReaction = Math.max(0, this.hitReaction - dt);
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) { this.blink = .14; this.blinkTimer = 2 + Math.random() * 3.5; }
      this.blink = Math.max(0, this.blink - dt);
      const intensive = Math.abs(verticalInput) + Math.abs(horizontalInput) * .5;
      this.fuel = Math.max(0, this.fuel - dt * (.5 + intensive * .025));
    }
    collide() {
      if (this.invulnerability > 0) return false;
      this.invulnerability = CONFIG.invulnerabilitySeconds;
      this.hitReaction = .65;
      this.fuel = Math.max(0, this.fuel - CONFIG.collisionFuelLoss);
      this.velocity.x *= .67;
      this.velocity.y -= 45;
      return true;
    }
  }

  class Camera {
    constructor() { this.reset(); }
    reset() { this.x = 0; this.speed = CONFIG.cruiseSpeed; this.altitude = 500; this.shake = 0; }
    update(dt, player, progress, trackCruise = true) {
      if (trackCruise) {
        const targetSpeed = CONFIG.cruiseSpeed + progress * CONFIG.routeSpeedBoost;
        this.speed = lerp(this.speed, targetSpeed, 1 - Math.pow(.94, dt * 60));
      } else {
        this.speed = player.velocity.x;
      }
      this.x += this.speed * dt;
      this.altitude = lerp(this.altitude, player.position.y, 1 - Math.pow(.995, dt * 60));
      this.shake = Math.max(0, this.shake - dt * 1.8);
    }
    hit(amount = .7) { this.shake = Math.max(this.shake, amount); }
    offset(reducedMotion) {
      if (reducedMotion || this.shake <= 0) return { x: 0, y: 0 };
      return { x: (Math.random() - .5) * 12 * this.shake, y: (Math.random() - .5) * 10 * this.shake };
    }
  }

  const OBSTACLE_INFO = {
    bird: { radius: 28, color: "#25213c" },
    flock: { radius: 48, color: "#26213c" },
    balloon: { radius: 39, color: "#d8867a" },
    storm: { radius: 70, color: "#56617c" },
    weather: { radius: 34, color: "#e8bf72" },
    meteor: { radius: 24, color: "#d9a681" },
    satellite: { radius: 38, color: "#b9c8d8" }
  };

  class ObstacleManager {
    constructor() { this.reset(); }
    reset() { this.items = []; this.nextSpawnX = 900; this.random = new SeededRandom(9031); }
    chooseType(progress) {
      const roll = this.random.next();
      if (progress < .2) return roll < .56 ? "bird" : roll < .82 ? "balloon" : "flock";
      if (progress < .45) return roll < .34 ? "bird" : roll < .63 ? "flock" : roll < .84 ? "balloon" : "weather";
      if (progress < .7) return roll < .38 ? "flock" : roll < .7 ? "weather" : "storm";
      return roll < .38 ? "meteor" : roll < .63 ? "satellite" : roll < .82 ? "storm" : "weather";
    }
    update(dt, player, progress, onHit) {
      if (progress >= CONFIG.approachClearAt) {
        this.items.length = 0;
        return;
      }
      const difficulty = getDifficulty(progress);
      while (this.nextSpawnX < player.position.x + 1550 && progress < CONFIG.approachClearAt - .02) {
        const type = this.chooseType(progress);
        const altitudeSpread = progress < .2 ? 430 : progress < .65 ? 700 : 900;
        const y = clamp(player.position.y + this.random.range(-altitudeSpread, altitudeSpread), CONFIG.minAltitude + 60, CONFIG.maxAltitude - 100);
        const speedFactor = { bird: 1, flock: .82, balloon: .12, storm: .18, weather: .24, meteor: 1.35, satellite: .72 }[type];
        const amplitudeFactor = { bird: .52, flock: .7, balloon: .65, storm: .2, weather: .55, meteor: .25, satellite: .42 }[type];
        const verticalDirection = type === "bird" || type === "flock" || type === "meteor"
          ? (this.random.next() < .5 ? -1 : 1)
          : 0;
        this.items.push({
          x: this.nextSpawnX,
          y,
          baseY: y,
          type,
          phase: this.random.range(0, Math.PI * 2),
          vx: -difficulty.obstacleSpeed * speedFactor * this.random.range(.82, 1.18),
          vy: verticalDirection * difficulty.obstacleSpeed * this.random.range(.08, .22),
          amplitude: difficulty.movementAmplitude * amplitudeFactor,
          frequency: type === "bird" || type === "flock" ? this.random.range(2.2, 3.2) : this.random.range(.55, 1.05),
          passed: false
        });
        this.nextSpawnX += difficulty.spawnGap * this.random.range(.88, 1.18);
      }
      this.items.forEach(item => {
        item.x += item.vx * dt;
        item.baseY += item.vy * dt;
        if (item.baseY < CONFIG.minAltitude + 80 || item.baseY > CONFIG.maxAltitude - 120) item.vy *= -1;
        item.baseY = clamp(item.baseY, CONFIG.minAltitude + 80, CONFIG.maxAltitude - 120);
        item.phase += dt * item.frequency;
        item.y = clamp(item.baseY + Math.sin(item.phase) * item.amplitude, CONFIG.minAltitude + 60, CONFIG.maxAltitude - 100);
      });
      this.items = this.items.filter(item => item.x > player.position.x - 900);
      for (const item of this.items) {
        const dx = item.x - player.position.x;
        const dy = (item.y - player.position.y) * .38;
        const radius = OBSTACLE_INFO[item.type].radius + 26;
        if (dx * dx + dy * dy < radius * radius && player.collide()) { onHit(item); break; }
      }
    }
  }

  class WorldRenderer {
    constructor() {
      const random = new SeededRandom(48291);
      this.stars = Array.from({ length: 220 }, () => ({
        x: random.next(), y: random.range(.02, .78), size: random.range(.45, 2.1), phase: random.range(0, Math.PI * 2), depth: random.range(.3, 1)
      }));
      this.clouds = Array.from({ length: 26 }, (_, index) => ({
        x: random.range(0, 1), y: random.range(.14, .78), scale: random.range(.55, 1.7), depth: index % 3, alpha: random.range(.13, .34)
      }));
      this.landmarks = [
        { at: .055, name: "La ciudad despierta", type: "city" },
        { at: .13, name: "París · Torre Eiffel", type: "eiffel" },
        { at: .205, name: "Egipto · Pirámides", type: "pyramids" },
        { at: .285, name: "Nueva York · La gran bahía", type: "liberty" },
        { at: .365, name: "Río · Cristo Redentor", type: "christ" },
        { at: .445, name: "Japón · Monte Fuji", type: "fuji" },
        { at: .525, name: "Sobre el último mar", type: "coast" }
      ];
    }

    render(ctx, view, game) {
      const { width: w, height: h } = view;
      const progress = game.progress;
      const arrival = game.arrivalSceneProgress;
      const sceneProgress = lerp(progress, .16, arrival);
      const altitudeRatio = lerp(clamp(game.player.position.y / CONFIG.maxAltitude, 0, 1), .08, arrival);
      this.drawSky(ctx, w, h, sceneProgress, altitudeRatio);
      this.drawStars(ctx, w, h, sceneProgress, altitudeRatio, game.time, game.camera.x);
      this.drawMoon(ctx, w, h, sceneProgress, game.time);
      this.drawAtmosphere(ctx, w, h, sceneProgress, altitudeRatio);
      this.drawCloudLayer(ctx, w, h, sceneProgress, game.camera, game.time, 0);
      this.drawTerrain(ctx, w, h, sceneProgress, game.time);
      if (arrival < .04) this.drawLandmarks(ctx, w, h, progress, game.camera.x);
      this.drawCloudLayer(ctx, w, h, sceneProgress, game.camera, game.time, 1);
      if (arrival > .02) this.drawAirport(ctx, w, h, arrival, game.arrivalTimer, game.state, game.reducedMotion);
    }

    drawSky(ctx, w, h, progress, altitudeRatio) {
      const space = smoothstep(.52, .94, Math.max(progress, altitudeRatio));
      const top = mixColor([7, 15, 43], [1, 3, 13], space);
      const bottom = mixColor([27, 38, 82], [7, 10, 29], space);
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, rgba(top));
      gradient.addColorStop(.68, rgba(bottom));
      gradient.addColorStop(1, rgba(mixColor(bottom, [53, 35, 83], 1 - space), 1));
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w * .7, h * .58, 0, w * .7, h * .58, w * .7);
      glow.addColorStop(0, `rgba(100,91,173,${(1 - space) * .17})`); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    }

    drawStars(ctx, w, h, progress, altitudeRatio, time, cameraX) {
      const visibility = .24 + smoothstep(.08, .75, Math.max(progress, altitudeRatio)) * .76;
      const count = Math.floor(70 + visibility * 150);
      for (let i = 0; i < count; i += 1) {
        const star = this.stars[i];
        const x = ((star.x * w - cameraX * star.depth * .012) % (w + 30) + (w + 30)) % (w + 30) - 15;
        const twinkle = .68 + Math.sin(time * (.45 + star.depth * .35) + star.phase) * .18;
        ctx.fillStyle = `rgba(220,232,255,${visibility * twinkle})`;
        ctx.beginPath(); ctx.arc(x, star.y * h, star.size, 0, Math.PI * 2); ctx.fill();
      }
    }

    drawMoon(ctx, w, h, progress, time) {
      const finalGrowth = smoothstep(.68, 1, progress);
      const radius = 34 + Math.min(w, h) * (.025 + finalGrowth * .29);
      const x = w * lerp(.83, .72, finalGrowth);
      const y = h * lerp(.20, .31, finalGrowth);
      const aura = ctx.createRadialGradient(x, y, radius * .6, x, y, radius * 1.65);
      aura.addColorStop(0, `rgba(255,249,211,${.2 + finalGrowth * .12})`); aura.addColorStop(1, "rgba(180,193,255,0)");
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(x, y, radius * 1.65, 0, Math.PI * 2); ctx.fill();
      const moon = ctx.createRadialGradient(x - radius * .28, y - radius * .3, radius * .12, x, y, radius);
      moon.addColorStop(0, "#fffce9"); moon.addColorStop(.72, "#e7e3ce"); moon.addColorStop(1, "#b9bdd2");
      ctx.fillStyle = moon; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.globalAlpha = .11 + finalGrowth * .08; ctx.fillStyle = "#727a96";
      [[-.28,-.13,.16],[.2,-.28,.1],[.3,.2,.17],[-.18,.3,.08],[.04,.08,.07]].forEach(([ox, oy, size]) => {
        ctx.beginPath(); ctx.ellipse(x + ox * radius, y + oy * radius, radius * size, radius * size * .72, .3, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      if (progress > .87) {
        ctx.fillStyle = `rgba(255,255,240,${.03 + Math.sin(time * .7) * .008})`;
        ctx.fillRect(0, 0, w, h);
      }
    }

    drawAtmosphere(ctx, w, h, progress, altitudeRatio) {
      const band = smoothstep(.45, .86, Math.max(progress, altitudeRatio)) * (1 - smoothstep(.88, 1, progress));
      if (band <= .01) return;
      const gradient = ctx.createLinearGradient(0, h * .65, 0, h);
      gradient.addColorStop(0, "rgba(40,84,160,0)");
      gradient.addColorStop(.7, `rgba(72,90,196,${band * .16})`);
      gradient.addColorStop(1, `rgba(226,117,150,${band * .12})`);
      ctx.fillStyle = gradient; ctx.fillRect(0, h * .48, w, h * .52);
    }

    drawTerrain(ctx, w, h, progress, time) {
      const visibility = 1 - smoothstep(.46, .63, progress);
      if (visibility <= 0) return;
      const base = lerp(h * .78, h * 1.18, smoothstep(.25, .6, progress));
      ctx.save(); ctx.globalAlpha = visibility;
      ctx.fillStyle = "#111b37"; ctx.beginPath(); ctx.moveTo(0, base);
      for (let x = 0; x <= w + 80; x += 80) ctx.lineTo(x, base - 55 - Math.sin(x * .011 + time * .03) * 35 - Math.sin(x * .027) * 18);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      const cityVisibility = 1 - smoothstep(.17, .33, progress);
      ctx.globalAlpha *= cityVisibility;
      for (let x = -20; x < w + 40; x += 34) {
        const bh = 28 + ((x * 19) % 77 + 77) % 77;
        ctx.fillStyle = x % 68 === 0 ? "#141a34" : "#0d1630";
        ctx.fillRect(x, base - bh, 30, bh + 8);
        ctx.fillStyle = "rgba(255,207,112,.62)";
        for (let wy = base - bh + 10; wy < base - 8; wy += 15) for (let wx = x + 7; wx < x + 26; wx += 11) if ((wx + wy) % 3 < 2) ctx.fillRect(wx, wy, 3, 4);
      }
      ctx.restore();
    }

    drawLandmarks(ctx, w, h, progress) {
      const ground = lerp(h * .8, h * 1.05, smoothstep(.38, .58, progress));
      this.landmarks.forEach(landmark => {
        const delta = landmark.at - progress;
        const x = w * .5 + delta * w * 5.2;
        if (x < -180 || x > w + 180 || progress > .62) return;
        const alpha = clamp(1 - Math.abs(delta) * 5.5, 0, 1) * (1 - smoothstep(.52, .63, progress));
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, ground); ctx.fillStyle = "#17213d"; ctx.strokeStyle = "#28345b"; ctx.lineWidth = 4;
        this.drawLandmarkShape(ctx, landmark.type);
        ctx.restore();
      });
    }

    drawLandmarkShape(ctx, type) {
      if (type === "eiffel") {
        ctx.beginPath(); ctx.moveTo(-48,0); ctx.lineTo(-12,-165); ctx.lineTo(12,-165); ctx.lineTo(48,0); ctx.lineTo(24,0); ctx.lineTo(14,-66); ctx.lineTo(-14,-66); ctx.lineTo(-24,0); ctx.closePath(); ctx.fill();
        ctx.fillRect(-28,-82,56,7); ctx.fillRect(-18,-125,36,5);
      } else if (type === "pyramids") {
        ctx.fillStyle = "#4c3d51"; ctx.beginPath(); ctx.moveTo(-110,0); ctx.lineTo(-30,-105); ctx.lineTo(48,0); ctx.fill();
        ctx.fillStyle = "#342c46"; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(72,-75); ctx.lineTo(135,0); ctx.fill();
      } else if (type === "liberty") {
        ctx.fillRect(-25,-92,50,92); ctx.fillRect(-15,-153,30,64); ctx.beginPath(); ctx.arc(0,-166,18,0,Math.PI*2); ctx.fill();
        ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(10,-144); ctx.lineTo(42,-200); ctx.stroke(); ctx.fillStyle = "#f4c46b"; ctx.beginPath(); ctx.arc(44,-205,7,0,Math.PI*2); ctx.fill();
      } else if (type === "christ") {
        ctx.beginPath(); ctx.moveTo(-20,0); ctx.lineTo(-12,-96); ctx.lineTo(-75,-78); ctx.lineTo(-78,-94); ctx.lineTo(-16,-117); ctx.arc(0,-142,16,Math.PI,0); ctx.lineTo(16,-117); ctx.lineTo(78,-94); ctx.lineTo(75,-78); ctx.lineTo(12,-96); ctx.lineTo(20,0); ctx.fill();
      } else if (type === "fuji") {
        ctx.fillStyle = "#263553"; ctx.beginPath(); ctx.moveTo(-145,0); ctx.lineTo(0,-142); ctx.lineTo(150,0); ctx.fill();
        ctx.fillStyle = "#d9d8e3"; ctx.beginPath(); ctx.moveTo(-35,-108); ctx.lineTo(0,-142); ctx.lineTo(39,-105); ctx.lineTo(18,-111); ctx.lineTo(4,-98); ctx.lineTo(-12,-112); ctx.fill();
      } else if (type === "coast") {
        ctx.fillStyle = "rgba(80,120,160,.32)"; ctx.fillRect(-150,-8,300,8);
        ctx.fillStyle = "#1b2845"; for (let x=-120;x<120;x+=30) ctx.fillRect(x,-25-(x%50),24,25+(x%50));
      } else {
        for (let x=-120;x<120;x+=28) { const bh=35+Math.abs((x*7)%90); ctx.fillRect(x,-bh,23,bh); }
      }
    }

    drawCloudLayer(ctx, w, h, progress, camera, time, layer) {
      const cloudVisibility = 1 - smoothstep(.64, .79, progress);
      if (cloudVisibility <= 0) return;
      this.clouds.filter(cloud => (cloud.depth === 2 ? 1 : 0) === layer).forEach(cloud => {
        const depth = .018 + cloud.depth * .012;
        const x = ((cloud.x * (w + 500) - camera.x * depth + time * (cloud.depth + 1) * 2) % (w + 500) + (w + 500)) % (w + 500) - 250;
        const y = cloud.y * h + (progress - .25) * h * .2;
        this.drawCloud(ctx, x, y, 70 * cloud.scale, cloud.alpha * cloudVisibility * (layer ? 1.2 : .8));
      });
    }

    drawCloud(ctx, x, y, size, alpha) {
      const gradient = ctx.createLinearGradient(x, y - size, x, y + size * .4);
      gradient.addColorStop(0, `rgba(207,215,244,${alpha})`); gradient.addColorStop(1, `rgba(76,86,137,${alpha * .35})`);
      ctx.fillStyle = gradient; ctx.beginPath();
      ctx.ellipse(x - size * .52, y, size * .55, size * .25, 0, 0, Math.PI * 2);
      ctx.ellipse(x, y - size * .18, size * .68, size * .42, 0, 0, Math.PI * 2);
      ctx.ellipse(x + size * .55, y, size * .58, size * .28, 0, 0, Math.PI * 2); ctx.fill();
    }

    drawAirport(ctx, w, h, arrival, time, state, reducedMotion) {
      const visibility = smoothstep(.08, .55, arrival);
      const runwayReveal = smoothstep(.18, .78, arrival);
      const horizon = lerp(h * .82, h * .53, runwayReveal);
      const vanishingX = w * .66;
      ctx.save();
      ctx.globalAlpha = visibility;

      ctx.fillStyle = "#0b1327";
      ctx.fillRect(0, horizon - h * .055, w, h * .09);
      ctx.fillStyle = "rgba(244,201,105,.65)";
      for (let x = 18; x < w; x += 47) ctx.fillRect(x, horizon - 18 - (x % 3) * 5, 3, 3);

      const terminalX = w * .1;
      const terminalY = horizon - h * .11;
      ctx.fillStyle = "#18243a";
      ctx.fillRect(terminalX, terminalY, w * .34, h * .11);
      ctx.fillStyle = "#253652";
      ctx.fillRect(terminalX + w * .02, terminalY + h * .025, w * .3, h * .055);
      ctx.fillStyle = "rgba(255,210,121,.72)";
      for (let x = terminalX + 20; x < terminalX + w * .31; x += 28) ctx.fillRect(x, terminalY + 26, 12, 7);

      ctx.fillStyle = "#121d31";
      ctx.fillRect(w * .78, horizon - h * .095, w * .14, h * .095);
      ctx.fillRect(w * .87, horizon - h * .22, 12, h * .13);
      ctx.fillStyle = "#31415d";
      ctx.beginPath(); ctx.moveTo(w * .85, horizon - h * .22); ctx.lineTo(w * .9, horizon - h * .22); ctx.lineTo(w * .89, horizon - h * .17); ctx.lineTo(w * .86, horizon - h * .17); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(151,215,244,.72)"; ctx.fillRect(w * .862, horizon - h * .208, w * .026, 5);

      ctx.fillStyle = "#202735";
      ctx.beginPath();
      ctx.moveTo(vanishingX - w * .035, horizon);
      ctx.lineTo(vanishingX + w * .035, horizon);
      ctx.lineTo(w * 1.12, h);
      ctx.lineTo(-w * .12, h);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(235,239,244,.55)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(vanishingX, horizon); ctx.lineTo(vanishingX - w * .02, h); ctx.stroke();

      const pulse = reducedMotion ? .8 : .65 + Math.sin(time * 6) * .2;
      for (let i = 1; i <= 12; i += 1) {
        const t = i / 12;
        const eased = t * t;
        const y = lerp(horizon, h * 1.01, eased);
        const half = lerp(w * .045, w * .61, eased);
        const size = lerp(1.5, 5.5, eased);
        ctx.fillStyle = `rgba(225,241,255,${.45 + pulse * .45})`;
        ctx.beginPath(); ctx.arc(vanishingX - half, y, size, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(vanishingX + half, y, size, 0, Math.PI * 2); ctx.fill();
        if (i % 2 === 0) {
          ctx.fillStyle = "rgba(244,232,190,.7)";
          ctx.fillRect(vanishingX - size * .4, y, size * .8, size * 3);
        }
      }

      if (state === "TAXI" || state === "ARRIVED") {
        ctx.strokeStyle = "rgba(245,205,89,.75)"; ctx.lineWidth = 3; ctx.setLineDash([14, 12]);
        ctx.beginPath(); ctx.moveTo(w * .34, h * .76); ctx.quadraticCurveTo(w * .52, h * .66, w * .67, h * .6); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }

  class PlaneRenderer {
    render(ctx, x, y, player, time, arriving, reducedMotion, viewWidth) {
      const hitFlash = player.hitReaction > 0 && Math.floor(player.hitReaction * 16) % 2 === 0;
      // La silueta crece solo de forma visual: la hitbox de Player permanece
      // deliberadamente más pequeña para conservar las colisiones justas.
      const scale = clamp(viewWidth / 480, .9, 1.08);
      const visualPitch = clamp(player.rotation, -.22, .2);
      ctx.save(); ctx.translate(x, y); ctx.rotate(visualPitch); ctx.scale(scale, scale);
      if (player.invulnerability > 0 && Math.floor(player.invulnerability * 12) % 2 === 0) ctx.globalAlpha = .48;

      this.drawEngineTrail(ctx, -2, 25, time, arriving, .45);
      this.drawEngineTrail(ctx, 27, 32, time, arriving, 1);
      ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 15; ctx.shadowOffsetY = 10;

      ctx.fillStyle = hitFlash ? "#fff" : "#aab9c7";
      ctx.beginPath(); ctx.moveTo(-65,-8); ctx.lineTo(-79,-44); ctx.lineTo(-64,-43); ctx.lineTo(-42,-7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = hitFlash ? "#fff" : "#b7c5d0";
      ctx.beginPath(); ctx.moveTo(-61,5); ctx.lineTo(-82,21); ctx.lineTo(-52,18); ctx.lineTo(-28,6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = hitFlash ? "#fff" : "#91a6b8";
      ctx.beginPath(); ctx.moveTo(-12,-6); ctx.lineTo(22,-43); ctx.lineTo(43,-42); ctx.lineTo(20,-3); ctx.closePath(); ctx.fill();
      this.drawLandingGear(ctx, player.gearProgress);

      const body = ctx.createLinearGradient(0,-20,0,22);
      body.addColorStop(0, hitFlash ? "#fff" : "#f4f8fa");
      body.addColorStop(.58, hitFlash ? "#fff" : "#dce6ec");
      body.addColorStop(1, hitFlash ? "#fff" : "#9fb2c1");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(-82,-8); ctx.quadraticCurveTo(-52,-21,47,-18);
      ctx.quadraticCurveTo(79,-17,94,-4); ctx.quadraticCurveTo(99,1,91,7);
      ctx.quadraticCurveTo(70,21,-48,18); ctx.lineTo(-82,7); ctx.closePath(); ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = hitFlash ? "#fff" : "#b9c8d3";
      ctx.beginPath(); ctx.moveTo(-18,7); ctx.lineTo(32,47); ctx.lineTo(61,43); ctx.lineTo(17,5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.36)"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-70,-7); ctx.quadraticCurveTo(2,-17,80,-8); ctx.stroke();

      this.drawEngine(ctx, -1, 25, time, arriving, true);
      this.drawEngine(ctx, 28, 32, time, arriving, false);
      this.drawPassengerWindows(ctx, player, time, arriving);
      this.drawCockpit(ctx, player, time);
      this.drawDoor(ctx, player.doorProgress);
      this.drawNavigationLights(ctx, time, false);
      ctx.restore();
    }

    drawLandingGear(ctx, progress) {
      if (progress <= .01) return;
      const p = smoothstep(0, 1, progress);
      ctx.save(); ctx.globalAlpha *= p; ctx.strokeStyle = "#657686"; ctx.fillStyle = "#202833"; ctx.lineWidth = 3;
      [[-35, 11, -37, 29], [43, 9, 46, 27]].forEach(([x1, y1, x2, y2]) => {
        const wheelY = lerp(y1, y2, p);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, p), wheelY); ctx.stroke();
        ctx.beginPath(); ctx.arc(lerp(x1, x2, p), wheelY + 3, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#9aa9b5"; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = "#657686"; ctx.lineWidth = 3;
      });
      ctx.restore();
    }

    drawDoor(ctx, progress) {
      const x = 49, y = -5, width = 10, height = 20;
      ctx.save(); ctx.strokeStyle = "rgba(80,105,124,.8)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(x, y, width, height, 2); ctx.stroke();
      if (progress > .01) {
        ctx.fillStyle = "#263746"; ctx.beginPath(); ctx.roundRect(x, y, width * progress, height, 2); ctx.fill();
        ctx.fillStyle = "rgba(255,215,136,.75)"; ctx.fillRect(x + 1, y + 2, 2.2 * progress, height - 4);
      }
      ctx.restore();
    }

    drawEngineTrail(ctx, x, y, time, ending, alpha) {
      const pulse = .55 + Math.sin(time * 10 + x) * .12;
      const trail = ctx.createLinearGradient(x - 48,y,x - 8,y);
      trail.addColorStop(0,"rgba(107,183,222,0)");
      trail.addColorStop(1,`rgba(136,210,238,${(ending ? .06 : .15) * pulse * alpha})`);
      ctx.fillStyle=trail; ctx.beginPath(); ctx.moveTo(x-48,y-3);ctx.lineTo(x-8,y-5);ctx.lineTo(x-8,y+5);ctx.lineTo(x-48,y+3);ctx.fill();
    }

    drawEngine(ctx, x, y, time, ending, far) {
      ctx.save(); ctx.translate(x,y); if (far) ctx.globalAlpha *= .66;
      const nacelle=ctx.createLinearGradient(0,-10,0,10);
      nacelle.addColorStop(0,"#dce6ec");nacelle.addColorStop(1,"#8399ab");
      ctx.fillStyle=nacelle;ctx.beginPath();ctx.ellipse(0,0,20,10,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#30495d";ctx.beginPath();ctx.ellipse(13,0,6.5,7.5,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=`rgba(176,224,245,${ending ? .18 : .42})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(13,0,4.2,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=`rgba(119,199,232,${.2+Math.sin(time*15+x)*.08})`;ctx.beginPath();ctx.ellipse(-15,0,4,6,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }

    drawPassengerWindows(ctx, player, time, ending) {
      const positions=[-49,-35,-21,-7,7,21,35,47];
      positions.forEach((windowX,index)=>{
        const turtleWindow=index===3;
        const width=turtleWindow?15:9.5, height=turtleWindow?12.5:8;
        ctx.save();ctx.beginPath();ctx.roundRect(windowX-width/2,-9-height/2,width,height,3);ctx.clip();
        const cabinLight=ctx.createLinearGradient(windowX,-9-height/2,windowX,-9+height/2);
        cabinLight.addColorStop(0,turtleWindow?"#fff1b9":"#ffe3a0");
        cabinLight.addColorStop(.45,turtleWindow?"#eebc63":"#dca650");
        cabinLight.addColorStop(1,"#29485b");
        ctx.fillStyle=cabinLight;ctx.fillRect(windowX-width/2,-9-height/2,width,height);
        ctx.fillStyle="rgba(255,255,231,.52)";ctx.fillRect(windowX-width/2+1,-9-height/2+1,width-2,1.6);
        if (turtleWindow && player.turtleExitProgress < .08) this.drawPassengerTurtle(ctx,windowX,-9,player,time,ending);
        ctx.restore();
        ctx.strokeStyle=turtleWindow?"rgba(255,236,169,.96)":"rgba(45,69,88,.9)";ctx.lineWidth=turtleWindow?1.35:1.1;
        ctx.beginPath();ctx.roundRect(windowX-width/2,-9-height/2,width,height,3);ctx.stroke();
      });
    }

    drawPassengerTurtle(ctx, x, y, player, time, ending) {
      const reaction=player.hitReaction>0?Math.sin(time*28)*1.2:0;
      const lookUp=ending?-1.1:0;
      ctx.save();ctx.translate(x+reaction,y+Math.sin(time*1.8)*.35);
      ctx.fillStyle="#547c59";ctx.beginPath();ctx.ellipse(-2.2,1.7,5.3,4.2,-.08,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#6ea06b";ctx.beginPath();ctx.ellipse(-2.3,1.3,3.6,2.8,-.08,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#36533d";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-5,1.1);ctx.quadraticCurveTo(-2,-1.4,1.2,1.3);ctx.moveTo(-4.8,2.8);ctx.quadraticCurveTo(-2.1,.7,.8,3);ctx.stroke();
      ctx.fillStyle="#9ac982";ctx.beginPath();ctx.arc(3.7,-.45+lookUp,3.35,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#24352e";
      if(player.blink>0)ctx.fillRect(3.8,-.65+lookUp,2.3,.7);
      else{ctx.beginPath();ctx.arc(4.8,-.85+lookUp,.72,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle="rgba(255,244,190,.68)";ctx.beginPath();ctx.arc(5.05,-1.1+lookUp,.22,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }

    drawCockpit(ctx, player, time) {
      ctx.save();ctx.beginPath();ctx.moveTo(51,-15.5);ctx.quadraticCurveTo(75,-16,89,-5);ctx.lineTo(62,1.5);ctx.closePath();ctx.clip();
      const cockpitGlow=ctx.createLinearGradient(55,-17,82,1);
      cockpitGlow.addColorStop(0,"#4f7b91");cockpitGlow.addColorStop(.55,"#294c62");cockpitGlow.addColorStop(1,"#152e41");
      ctx.fillStyle=cockpitGlow;ctx.fillRect(49,-19,43,22);
      const reaction=player.hitReaction>0?Math.sin(time*30)*1.1:0;
      ctx.translate(reaction,0);

      // Versión simplificada de la capitana de portada: cabello negro lacio,
      // gorra y uniforme comercial legibles incluso a escala de juego.
      ctx.fillStyle="#0b1522";ctx.beginPath();ctx.roundRect(62.5,-14,10.5,13.8,3.8);ctx.fill();
      const pilotSkin=ctx.createLinearGradient(65,-13,73,-5);
      pilotSkin.addColorStop(0,"#e7a188");pilotSkin.addColorStop(1,"#b96f60");
      ctx.fillStyle=pilotSkin;ctx.beginPath();ctx.ellipse(69,-9,4.15,4.9,-.06,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#0b1522";ctx.beginPath();ctx.arc(67.1,-10.8,3.2,Math.PI,Math.PI*2);ctx.lineTo(64,-4.4);ctx.quadraticCurveTo(66,-5.2,67,-7);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(72,-12.6);ctx.quadraticCurveTo(74,-8,72.4,-3.7);ctx.lineTo(70.7,-4.4);ctx.lineTo(70.8,-12.7);ctx.closePath();ctx.fill();

      ctx.fillStyle="#17283c";ctx.beginPath();ctx.moveTo(61.5,-3.8);ctx.quadraticCurveTo(69,-6,76.5,-3.5);ctx.lineTo(80,3);ctx.lineTo(59,3);ctx.closePath();ctx.fill();
      ctx.fillStyle="#f4f7f5";ctx.beginPath();ctx.moveTo(65,-4.2);ctx.lineTo(69,-.2);ctx.lineTo(69.2,-4.8);ctx.fill();
      ctx.beginPath();ctx.moveTo(69.2,-4.8);ctx.lineTo(69,-.2);ctx.lineTo(73.1,-4.1);ctx.fill();
      ctx.fillStyle="#2a9ca2";ctx.beginPath();ctx.moveTo(68.5,-3.9);ctx.lineTo(70,-3.9);ctx.lineTo(70.5,.6);ctx.lineTo(69.2,2);ctx.lineTo(68.2,.5);ctx.closePath();ctx.fill();
      ctx.fillStyle="#d6ad55";ctx.fillRect(68.35,-.45,2.1,.45);
      ctx.fillStyle="#183149";ctx.beginPath();ctx.moveTo(62,-15.3);ctx.quadraticCurveTo(68.5,-17.4,75,-15.1);ctx.lineTo(75.8,-12.5);ctx.lineTo(61.3,-12.5);ctx.closePath();ctx.fill();
      ctx.fillStyle="#d6ad55";ctx.fillRect(62.2,-13.1,12.7,.8);
      ctx.beginPath();ctx.ellipse(68.6,-14.4,1.1,.7,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#d6ad55";ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(66.3,-14.4);ctx.lineTo(67.7,-14.4);ctx.moveTo(69.5,-14.4);ctx.lineTo(71,-14.4);ctx.stroke();
      ctx.fillStyle="#23313a";ctx.beginPath();ctx.arc(70.5,-9.2,.42,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.88)";ctx.beginPath();ctx.arc(70.65,-9.35,.13,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.16)";ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(64,-12.1);ctx.quadraticCurveTo(66,-13.8,68,-13.2);ctx.stroke();
      ctx.strokeStyle="rgba(88,46,44,.7)";ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(69.5,-6.8);ctx.quadraticCurveTo(70.5,-6.2,71.4,-6.8);ctx.stroke();
      ctx.strokeStyle="#c9836f";ctx.lineWidth=1.35;ctx.beginPath();ctx.moveTo(75,-2.8);ctx.lineTo(82,-.3);ctx.stroke();
      ctx.restore();
      ctx.strokeStyle="rgba(183,221,239,.88)";ctx.lineWidth=1.35;ctx.beginPath();ctx.moveTo(51,-15.5);ctx.quadraticCurveTo(75,-16,89,-5);ctx.lineTo(62,1.5);ctx.closePath();ctx.stroke();
      ctx.strokeStyle="rgba(222,242,250,.46)";ctx.beginPath();ctx.moveTo(76,-14);ctx.lineTo(71,-4.5);ctx.stroke();
    }

    drawNavigationLights(ctx, time, ending) {
      const blink=Math.sin(time*5.5)>.35;
      ctx.save();ctx.shadowBlur=blink?12:5;
      ctx.shadowColor="#ef6b72";ctx.fillStyle="#ef6b72";ctx.beginPath();ctx.arc(-75,-15,2.6,0,Math.PI*2);ctx.fill();
      ctx.shadowColor="#62e4c5";ctx.fillStyle="#62e4c5";ctx.beginPath();ctx.arc(57,42,2.8,0,Math.PI*2);ctx.fill();
      if(blink&&!ending){ctx.shadowColor="#eef8ff";ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(4,-18,2.4,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
  }

  class UIManager {
    constructor(root) {
      this.root = root;
      this.startScreen = root.querySelector("#start-screen");
      this.pauseScreen = root.querySelector("#pause-screen");
      this.endingScreen = root.querySelector("#ending-screen");
      this.hud = root.querySelector("#hud");
      this.altitude = root.querySelector("#altitude-value");
      this.distance = root.querySelector("#distance-value");
      this.fuel = root.querySelector("#fuel-value");
      this.fuelFill = root.querySelector("#fuel-fill");
      this.fuelTrack = root.querySelector(".fuel-track");
      this.region = root.querySelector("#region-label");
      this.message = root.querySelector("#flight-message");
      root.querySelector("#ending-line-1").textContent = GAME_TEXT.endingLine1;
      root.querySelector("#ending-line-2").textContent = GAME_TEXT.endingLine2;
      this.regionTimer = 0;
      this.messageTimer = 0;
    }
    showScreen(screen, visible) {
      screen.hidden = false;
      requestAnimationFrame(() => screen.classList.toggle("screen--visible", visible));
      if (!visible) setTimeout(() => { if (!screen.classList.contains("screen--visible")) screen.hidden = true; }, 560);
    }
    enterGame() {
      this.showScreen(this.startScreen, false); this.showScreen(this.pauseScreen, false); this.showScreen(this.endingScreen, false);
      this.hud.hidden = false; requestAnimationFrame(() => this.hud.classList.add("hud--visible"));
    }
    showPause(visible) { this.showScreen(this.pauseScreen, visible); }
    showEnding() { this.showScreen(this.endingScreen, true); }
    update(player, dt) {
      this.altitude.textContent = `${Math.round(player.position.y * 18).toLocaleString("es-ES")} m`;
      this.distance.textContent = `${(player.position.x / 85).toFixed(0)} km`;
      const fuel = clamp(player.fuel, 0, 100);
      this.fuel.textContent = `${Math.ceil(fuel)}%`;
      this.fuelFill.style.width = `${fuel}%`;
      this.fuelFill.style.background = fuel < 20 ? "linear-gradient(90deg,#e46f73,#ffc47d)" : "linear-gradient(90deg,#70e0d4,#fff0a6)";
      this.fuelTrack.setAttribute("aria-valuenow", String(Math.round(fuel)));
      this.regionTimer -= dt; this.messageTimer -= dt;
      if (this.regionTimer <= 0) this.region.classList.remove("region-label--visible");
      if (this.messageTimer <= 0) this.message.classList.remove("flight-message--visible");
    }
    announceRegion(text) { this.region.textContent = text; this.regionTimer = 4; this.region.classList.add("region-label--visible"); }
    announceMessage(text, duration = 3) { this.message.textContent = text; this.messageTimer = duration; this.message.classList.add("flight-message--visible"); }
    reset() { this.region.classList.remove("region-label--visible"); this.message.classList.remove("flight-message--visible"); }
  }

  class Game {
    constructor(root) {
      this.root = root;
      this.canvas = root.querySelector("#game-canvas");
      this.ctx = this.canvas.getContext("2d", { alpha: false });
      this.input = new InputManager(root);
      this.ui = new UIManager(root);
      this.player = new Player();
      this.camera = new Camera();
      this.obstacles = new ObstacleManager();
      this.particles = new ParticleSystem();
      this.world = new WorldRenderer();
      this.planeRenderer = new PlaneRenderer();
      this.state = "MENU";
      this.progress = 0;
      this.time = 0;
      this.lastTimestamp = 0;
      this.phaseTimer = 0;
      this.arrivalTimer = 0;
      this.arrivalSceneProgress = 0;
      this.arrivalFuel = 100;
      this.approachStartAltitude = 500;
      this.touchdownDone = false;
      this.finalShown = false;
      this.pausedFromState = "PLAYING";
      this.nextLandmark = 0;
      this.raf = 0;
      this.running = false;
      this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(root);
      this.bindUI();
      this.resize();
      this.startLoop();
    }

    bindUI() {
      this.root.querySelector("#start-button").addEventListener("click", () => this.start());
      this.root.querySelector("#resume-button").addEventListener("click", () => this.togglePause());
      this.root.querySelector("#pause-button").addEventListener("click", () => this.togglePause());
      this.root.querySelector("#restart-button").addEventListener("click", () => this.reset(true));
      const reduceMotion = this.root.querySelector("#reduce-motion");
      reduceMotion.checked = this.reducedMotion;
      reduceMotion.addEventListener("change", event => {
        this.reducedMotion = event.target.checked;
        this.root.classList.toggle("menu-reduce-motion", this.reducedMotion);
      });
      this.bindMenuPanel();
      this.input.onPause = () => this.togglePause();
      this.input.onRestart = () => { if (this.state === "ARRIVED" && this.finalShown) this.reset(true); };
      this.boundVisibility = () => { if (document.hidden && this.isActiveFlightState()) this.togglePause(); };
      document.addEventListener("visibilitychange", this.boundVisibility);
    }

    bindMenuPanel() {
      const panel = this.root.querySelector("#menu-panel");
      const board = panel.querySelector(".maintenance-board");
      const closeButton = panel.querySelector(".menu-panel__close");
      const panelButtons = [...this.root.querySelectorAll("[data-menu-panel]")];
      const menuButtons = [this.root.querySelector("#start-button"), ...panelButtons];
      const views = [...panel.querySelectorAll("[data-menu-view]")];
      const soundRange = panel.querySelector("#sound-range");
      const soundStatus = panel.querySelector("#sound-status");
      let opener = null;

      const clearSelection = () => panelButtons.forEach(button => button.setAttribute("aria-pressed", "false"));
      this.closeMenuPanel = (restoreFocus = true) => {
        if (!panel.open) return;
        panel.close();
        clearSelection();
        if (restoreFocus) opener?.focus();
        opener = null;
      };

      const openPanel = (name, button) => {
        views.forEach(view => { view.hidden = view.dataset.menuView !== name; });
        clearSelection();
        button.setAttribute("aria-pressed", "true");
        panel.setAttribute("aria-labelledby", `menu-${name}-title`);
        opener = button;
        panel.showModal();
        closeButton.focus();
      };

      panelButtons.forEach(button => button.addEventListener("click", () => openPanel(button.dataset.menuPanel, button)));
      closeButton.addEventListener("click", () => this.closeMenuPanel());
      panel.addEventListener("cancel", event => { event.preventDefault(); this.closeMenuPanel(); });
      panel.addEventListener("click", event => {
        const bounds = board.getBoundingClientRect();
        const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (outside) this.closeMenuPanel();
      });

      this.root.querySelector(".world-menu").addEventListener("keydown", event => {
        const current = menuButtons.indexOf(document.activeElement);
        if (current < 0) return;
        let next = current;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (current + 1) % menuButtons.length;
        else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (current - 1 + menuButtons.length) % menuButtons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = menuButtons.length - 1;
        else return;
        event.preventDefault();
        menuButtons[next].focus();
      });

      soundRange.addEventListener("input", () => { soundStatus.textContent = `Preparado · ${soundRange.value}%`; });
      this.root.classList.toggle("menu-reduce-motion", this.reducedMotion);
    }

    resize() {
      const rect = this.root.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.view = { width: Math.max(1, rect.width), height: Math.max(1, rect.height), dpr };
      this.canvas.width = Math.round(this.view.width * dpr);
      this.canvas.height = Math.round(this.view.height * dpr);
    }

    startLoop() {
      if (this.running) return;
      this.running = true;
      const frame = timestamp => {
        if (!this.running) return;
        const dt = this.lastTimestamp ? clamp((timestamp - this.lastTimestamp) / 1000, 0, .034) : 0;
        this.lastTimestamp = timestamp;
        this.update(dt);
        this.render();
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    }

    start() {
      this.closeMenuPanel?.(false);
      if (this.state === "MENU") this.reset(false);
      this.state = "PLAYING";
      this.ui.enterGame();
      this.ui.announceRegion("La ciudad despierta");
      if (new URLSearchParams(location.search).get("preview") === "ending") {
        this.player.position.x = CONFIG.finalDistance * CONFIG.approachAt;
        this.player.position.y = 6500;
        this.camera.x = this.player.position.x;
        this.camera.altitude = this.player.position.y;
        this.progress = CONFIG.approachAt;
        this.obstacles.nextSpawnX = this.player.position.x + 1800;
        this.beginApproach();
      }
    }

    stop() {
      if (this.isActiveFlightState()) this.togglePause();
    }

    reset(playImmediately = false) {
      this.player.reset(); this.camera.reset(); this.obstacles.reset(); this.particles.clear(); this.ui.reset();
      this.progress = 0; this.phaseTimer = 0; this.arrivalTimer = 0; this.arrivalSceneProgress = 0;
      this.arrivalFuel = 100; this.approachStartAltitude = 500; this.touchdownDone = false; this.finalShown = false; this.nextLandmark = 1; this.input.clear();
      this.state = playImmediately ? "PLAYING" : "MENU";
      if (playImmediately) { this.ui.enterGame(); this.ui.announceRegion("La ciudad despierta"); }
    }

    isActiveFlightState() {
      return ["PLAYING", "APPROACH", "LANDING", "TAXI", "ARRIVED"].includes(this.state) && !this.finalShown;
    }

    togglePause() {
      if (this.isActiveFlightState()) {
        this.pausedFromState = this.state; this.state = "PAUSED"; this.input.clear(); this.ui.showPause(true);
      } else if (this.state === "PAUSED") {
        this.state = this.pausedFromState; this.ui.showPause(false); this.lastTimestamp = performance.now();
      }
    }

    update(dt) {
      this.time += dt;
      if (this.state === "MENU" || this.state === "PAUSED" || (this.state === "ARRIVED" && this.finalShown)) return;
      if (this.state === "PLAYING") {
        this.progress = clamp(this.camera.x / CONFIG.finalDistance, 0, 1);
        this.player.update(dt, this.input.keys, this.progress, this.view.width, true);
        this.camera.update(dt, this.player, this.progress, true);
        this.constrainPlayerToView();
        this.obstacles.update(dt, this.player, this.progress, () => this.handleCollision());
        this.updateLandmarks();
        if (this.progress >= CONFIG.approachAt) this.beginApproach();
      } else if (this.state === "APPROACH") {
        this.updateApproach(dt);
      } else if (this.state === "LANDING") {
        this.updateLanding(dt);
      } else if (this.state === "TAXI") {
        this.updateTaxi(dt);
      } else if (this.state === "ARRIVED") {
        this.updateArrived(dt);
      }
      this.particles.update(dt);
      this.ui.update(this.player, dt);
    }

    updateLandmarks() {
      const landmark = this.world.landmarks[this.nextLandmark];
      if (landmark && this.progress >= landmark.at - .018) { this.ui.announceRegion(landmark.name); this.nextLandmark += 1; }
    }

    handleCollision() {
      this.camera.hit();
      const point = this.getPlayerScreenPosition();
      this.particles.emit(point.x, point.y, { count: 16, color: "255,204,128", speed: 95, life: .75, size: 4 });
      this.ui.announceMessage("¡Uy! El cielo también tiene baches.", 2.2);
    }

    beginApproach() {
      this.state = "APPROACH"; this.phaseTimer = 0; this.arrivalTimer = 0; this.arrivalFuel = this.player.fuel;
      this.approachStartAltitude = this.player.position.y;
      this.obstacles.items.length = 0;
      this.ui.announceMessage("Llegando al destino…", 3.2);
    }

    updateApproach(dt) {
      this.phaseTimer += dt; this.arrivalTimer += dt;
      const phase = clamp(this.phaseTimer / CONFIG.arrivalDurations.approach, 0, 1);
      this.player.update(dt, this.input.keys, this.progress, this.view.width, true);
      this.player.fuel = this.arrivalFuel;
      const descentTarget = lerp(this.approachStartAltitude, 1800, smoothstep(.12, 1, phase));
      this.player.position.y = lerp(this.player.position.y, descentTarget, 1 - Math.pow(.94, dt * 60));
      this.player.gearProgress = smoothstep(.18, .88, phase);
      this.camera.update(dt, this.player, this.progress, true);
      this.arrivalSceneProgress = smoothstep(0, 1, phase) * .48;
      this.progress = lerp(CONFIG.approachAt, .91, phase);
      if (this.phaseTimer >= CONFIG.arrivalDurations.approach) {
        this.state = "LANDING"; this.phaseTimer = 0; this.input.clear();
        this.ui.announceMessage("Preparando aterrizaje…", 2.8);
      }
    }

    updateLanding(dt) {
      this.phaseTimer += dt; this.arrivalTimer += dt;
      const phase = clamp(this.phaseTimer / CONFIG.arrivalDurations.landing, 0, 1);
      this.player.gearProgress = 1;
      this.player.position.y = lerp(1800, CONFIG.minAltitude, smoothstep(.08, .82, phase));
      this.player.velocity.x = lerp(this.player.velocity.x, 92, 1 - Math.pow(.965, dt * 60));
      this.player.position.x += this.player.velocity.x * dt;
      const targetPitch = phase < .68 ? -.11 : lerp(-.11, 0, smoothstep(.68, 1, phase));
      this.player.rotation = lerp(this.player.rotation, targetPitch, 1 - Math.pow(.94, dt * 60));
      this.camera.x += this.player.velocity.x * dt;
      this.arrivalSceneProgress = lerp(.48, .9, smoothstep(0, 1, phase));
      this.progress = lerp(.91, .97, phase);
      if (!this.touchdownDone && phase >= .68) {
        this.touchdownDone = true;
        const point = this.getPlayerScreenPosition();
        this.particles.emit(point.x - 30, point.y + 26, { count: this.reducedMotion ? 4 : 13, color: "205,214,220", speed: 48, life: .9, size: 5 });
        this.ui.announceMessage("Aterrizaje suave.", 2.2);
      }
      if (this.phaseTimer >= CONFIG.arrivalDurations.landing) {
        this.state = "TAXI"; this.phaseTimer = 0; this.player.rotation = 0;
      }
    }

    updateTaxi(dt) {
      this.phaseTimer += dt; this.arrivalTimer += dt;
      const phase = clamp(this.phaseTimer / CONFIG.arrivalDurations.taxi, 0, 1);
      this.player.velocity.x = lerp(78, 0, smoothstep(.08, 1, phase));
      this.player.position.y = CONFIG.minAltitude;
      this.player.position.x += this.player.velocity.x * dt;
      this.camera.x += this.player.velocity.x * dt * .55;
      this.player.rotation = lerp(this.player.rotation, 0, 1 - Math.pow(.9, dt * 60));
      this.arrivalSceneProgress = lerp(.9, 1, phase);
      this.progress = lerp(.97, 1, phase);
      if (this.phaseTimer >= CONFIG.arrivalDurations.taxi) {
        this.state = "ARRIVED"; this.phaseTimer = 0; this.player.velocity.x = 0;
        this.ui.announceRegion("Aeropuerto · Destino final");
      }
    }

    updateArrived(dt) {
      this.phaseTimer += dt; this.arrivalTimer += dt;
      this.player.velocity.x = 0; this.player.velocity.y = 0; this.player.rotation = 0;
      this.player.position.y = CONFIG.minAltitude;
      this.player.doorProgress = smoothstep(.08, .32, this.phaseTimer / CONFIG.arrivalDurations.disembark);
      this.player.turtleExitProgress = smoothstep(.22, .92, this.phaseTimer / CONFIG.arrivalDurations.disembark);
      this.arrivalSceneProgress = 1; this.progress = 1;
      if (!this.finalShown && this.phaseTimer >= CONFIG.arrivalDurations.disembark) {
        this.finalShown = true; this.ui.showEnding();
      }
    }

    getPlayerScreenPosition() {
      const normal = {
        x: this.view.width * .4 + (this.player.position.x - this.camera.x),
        y: this.view.height * .53 - (this.player.position.y - this.camera.altitude) * .38
      };
      if (this.state === "APPROACH") {
        const phase = smoothstep(0, 1, this.phaseTimer / CONFIG.arrivalDurations.approach);
        return { x: lerp(normal.x, this.view.width * .45, phase), y: lerp(normal.y, this.view.height * .38, phase * .72) };
      }
      if (this.state === "LANDING") {
        const phase = smoothstep(0, 1, this.phaseTimer / CONFIG.arrivalDurations.landing);
        return { x: lerp(this.view.width * .45, this.view.width * .48, phase), y: lerp(this.view.height * .38, this.view.height * .68, phase) };
      }
      if (this.state === "TAXI") {
        const phase = smoothstep(0, 1, this.phaseTimer / CONFIG.arrivalDurations.taxi);
        return { x: lerp(this.view.width * .48, this.view.width * .63, phase), y: this.view.height * .68 };
      }
      if (this.state === "ARRIVED") return { x: this.view.width * .63, y: this.view.height * .68 };
      return normal;
    }

    constrainPlayerToView() {
      const horizontalAnchor = this.view.width * .4;
      const minX = this.camera.x + this.view.width * .15 - horizontalAnchor;
      const maxX = this.camera.x + this.view.width * .7 - horizontalAnchor;
      if (this.player.position.x < minX) {
        this.player.position.x = minX;
        this.player.velocity.x = Math.max(this.camera.speed, this.player.velocity.x);
      } else if (this.player.position.x > maxX) {
        this.player.position.x = maxX;
        this.player.velocity.x = Math.min(this.camera.speed, this.player.velocity.x);
      }

      const verticalAnchor = this.view.height * .53;
      const minY = Math.max(CONFIG.minAltitude, this.camera.altitude + (verticalAnchor - this.view.height * .82) / .38);
      const maxY = Math.min(CONFIG.maxAltitude, this.camera.altitude + (verticalAnchor - this.view.height * .15) / .38);
      if (this.player.position.y < minY) {
        this.player.position.y = minY;
        this.player.velocity.y = Math.max(0, this.player.velocity.y);
      } else if (this.player.position.y > maxY) {
        this.player.position.y = maxY;
        this.player.velocity.y = Math.min(0, this.player.velocity.y);
      }
    }

    render() {
      if (!this.view) return;
      const { width: w, height: h, dpr } = this.view;
      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const menuProgress = this.state === "MENU" ? .02 : this.progress;
      const actualProgress = this.progress;
      if (this.state === "MENU") this.progress = menuProgress;
      const shake = this.camera.offset(this.reducedMotion);
      ctx.save(); ctx.translate(shake.x, shake.y);
      this.world.render(ctx, this.view, this);
      if (this.state === "PLAYING") this.renderObstacles(ctx);
      const point = this.state === "MENU" ? { x: w * .24, y: h * .67 + Math.sin(this.time * 1.4) * 5 } : this.getPlayerScreenPosition();
      this.renderSpeedLines(ctx, point);
      const arriving = ["APPROACH", "LANDING", "TAXI", "ARRIVED"].includes(this.state);
      this.planeRenderer.render(ctx, point.x, point.y, this.player, this.time, arriving, this.reducedMotion, this.view.width);
      if (this.state === "ARRIVED") this.renderDisembarkation(ctx, point);
      this.particles.render(ctx);
      this.renderVignette(ctx, w, h);
      ctx.restore();
      this.progress = actualProgress;
    }

    renderSpeedLines(ctx, point) {
      if (this.reducedMotion || this.state !== "PLAYING" || this.player.velocity.x < 145) return;
      const intensity = clamp((this.player.velocity.x - 130) / 95, 0, 1);
      ctx.strokeStyle = `rgba(190,218,255,${intensity * .12})`; ctx.lineWidth = 1;
      for (let i=0;i<8;i+=1) {
        const y = ((i * 97 + this.time * (55 + i * 4)) % this.view.height);
        const x = (i * 181 + this.time * -180) % (this.view.width + 200);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 35 - intensity * 45, y); ctx.stroke();
      }
    }

    renderObstacles(ctx) {
      const playerPoint = this.getPlayerScreenPosition();
      for (const item of this.obstacles.items) {
        const x = playerPoint.x + (item.x - this.player.position.x);
        const y = this.view.height * .53 - (item.y - this.camera.altitude) * .38;
        if (x < -140 || x > this.view.width + 140 || y < -140 || y > this.view.height + 140) continue;
        this.drawObstacle(ctx, item, x, y);
      }
    }

    drawObstacle(ctx, item, x, y) {
      ctx.save(); ctx.translate(x, y);
      const bob = Math.sin(item.phase) * 5;
      if (item.type === "bird" || item.type === "flock") {
        ctx.strokeStyle = "#25213c"; ctx.lineWidth = 5; ctx.lineCap = "round";
        const count = item.type === "flock" ? 4 : 1;
        for (let i=0;i<count;i+=1) { const ox=(i%2)*32-(i>1?18:0), oy=Math.floor(i/2)*25; const flap=Math.sin(item.phase+i)*7; ctx.beginPath(); ctx.moveTo(ox-13,oy+bob); ctx.quadraticCurveTo(ox-5,oy-8-flap,ox,oy); ctx.quadraticCurveTo(ox+7,oy-8+flap,ox+15,oy+bob); ctx.stroke(); }
      } else if (item.type === "balloon" || item.type === "weather") {
        ctx.fillStyle = item.type === "weather" ? "#e6c47b" : "#d67c78"; ctx.beginPath(); ctx.ellipse(0,bob-10,24,31,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(-4,bob-16,13,2.2,4.9); ctx.stroke();
        ctx.strokeStyle = "#9b836a"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-10,bob+17);ctx.lineTo(-6,bob+37);ctx.moveTo(10,bob+17);ctx.lineTo(6,bob+37);ctx.stroke(); ctx.fillStyle="#8a654c";ctx.fillRect(-8,bob+35,16,10);
      } else if (item.type === "storm") {
        this.world.drawCloud(ctx, 0, bob, 62, .8); ctx.fillStyle="#d9d68a";ctx.beginPath();ctx.moveTo(4,bob+18);ctx.lineTo(-8,bob+46);ctx.lineTo(5,bob+42);ctx.lineTo(-3,bob+67);ctx.lineTo(22,bob+34);ctx.lineTo(8,bob+36);ctx.closePath();ctx.fill();
      } else if (item.type === "meteor") {
        const tail=ctx.createLinearGradient(-80,0,15,0);tail.addColorStop(0,"rgba(235,132,100,0)");tail.addColorStop(1,"rgba(255,191,126,.55)");ctx.fillStyle=tail;ctx.beginPath();ctx.moveTo(-90,-13);ctx.lineTo(10,-18);ctx.lineTo(12,17);ctx.lineTo(-90,8);ctx.fill(); ctx.fillStyle="#8f766d";ctx.beginPath();ctx.arc(12,0,18,0,Math.PI*2);ctx.fill();
      } else {
        ctx.rotate(.22); ctx.fillStyle="#b8c7d6";ctx.fillRect(-23,-10,46,20);ctx.fillStyle="#5377a7";ctx.fillRect(-61,-18,34,36);ctx.fillRect(27,-18,34,36);ctx.fillStyle="#f3cc78";ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }

    renderDisembarkation(ctx, planePoint) {
      const door = { x: planePoint.x + 50, y: planePoint.y - 5 };
      const scale = clamp(this.view.width / 520, .82, 1);
      const groundY = planePoint.y + 72 * scale;
      const exit = this.player.turtleExitProgress;
      if (this.player.doorProgress > .08) {
        ctx.save(); ctx.strokeStyle = "rgba(214,224,231,.8)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(door.x, door.y + 12); ctx.lineTo(door.x + 70 * scale, groundY); ctx.stroke();
        ctx.lineWidth = 1.5;
        for (let i = 1; i < 6; i += 1) {
          const t = i / 6, x = lerp(door.x, door.x + 70 * scale, t), y = lerp(door.y + 12, groundY, t);
          ctx.beginPath(); ctx.moveTo(x - 9, y + 3); ctx.lineTo(x + 10, y + 3); ctx.stroke();
        }
        ctx.restore();
      }
      if (exit <= .01) return;
      const descend = smoothstep(0, .68, exit);
      const walk = smoothstep(.68, 1, exit);
      const x = lerp(door.x + 2, door.x + 70 * scale, descend) + walk * 55 * scale;
      const y = lerp(door.y + 5, groundY - 5, descend);
      const step = this.reducedMotion ? 0 : Math.sin(this.time * 10) * (1 - walk * .45);
      ctx.save(); ctx.translate(x, y + step); ctx.scale(scale * 1.18, scale * 1.18);
      ctx.fillStyle = "#527b58"; ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, -.12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#304d39"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 7, .2, 5.9); ctx.stroke();
      ctx.fillStyle = "#8fbb78"; ctx.beginPath(); ctx.arc(11, -4, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#24352e"; ctx.beginPath(); ctx.arc(13, -5, 1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#759b68"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-9 + step * .25, 11); ctx.moveTo(5, 6); ctx.lineTo(8 - step * .25, 11); ctx.stroke();
      if (walk > .7) { ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(13, -7 - Math.sin(this.time * 4) * 2); ctx.stroke(); }
      ctx.restore();
    }

    renderVignette(ctx, w, h) {
      const vignette = ctx.createRadialGradient(w*.5,h*.48,Math.min(w,h)*.25,w*.5,h*.5,Math.max(w,h)*.78);
      vignette.addColorStop(0,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(0,2,12,.38)");ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
      if (this.player.hitReaction > 0) { ctx.fillStyle=`rgba(255,190,152,${this.player.hitReaction*.12})`;ctx.fillRect(0,0,w,h); }
    }

    destroy() {
      this.running = false; cancelAnimationFrame(this.raf); this.input.destroy(); this.resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", this.boundVisibility);
    }
  }

  let instance = null;
  const api = {
    create(root = document.querySelector("#turtle-flight-game")) {
      if (!root) throw new Error("No se encontró el contenedor #turtle-flight-game");
      instance?.destroy(); instance = new Game(root); return instance;
    },
    startGame() { instance?.start(); },
    stopGame() { instance?.stop(); },
    resetGame() { instance?.reset(true); },
    destroyGame() { instance?.destroy(); instance = null; },
    getInstance() { return instance; },
    GAME_TEXT,
    CONFIG
  };

  Object.defineProperty(window, "HastaLaLuna", { value: api, configurable: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => api.create(), { once: true });
  else api.create();
})();
