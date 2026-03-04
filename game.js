const heroes = [
  {
    id: "kira",
    name: "Kira Shadowleaf",
    speed: 2.8,
    attack: 20,
    specialPower: 35,
    color: "#70d6ff",
    abilityName: "Shadow Dash",
    skills: ["⚔️ Sword Slash", "🌫️ Shadow Dash", "🫥 Stealth Mode"],
  },
  {
    id: "ryu",
    name: "Ryu Emberfang",
    speed: 2.4,
    attack: 24,
    specialPower: 40,
    color: "#ff8f5a",
    abilityName: "Dragon Fire Burst",
    skills: ["⚔️ Flame Katana", "🔥 Fire Arc", "⚡ Storm Strike"],
  },
];

const state = {
  selectedHero: null,
  hero: null,
  keys: new Set(),
  enemies: [],
  effects: [],
  mouse: { x: 0, y: 0 },
  wave: 1,
  score: 0,
  spawnTimer: 0,
  maxEnemies: 4,
  gameOver: false,
};

const ui = {
  characterScreen: document.getElementById("character-screen"),
  gameScreen: document.getElementById("game-screen"),
  characterGrid: document.getElementById("character-grid"),
  selectedSummary: document.getElementById("selected-summary"),
  startBtn: document.getElementById("start-btn"),
  heroName: document.getElementById("hero-name"),
  heroLevel: document.getElementById("hero-level"),
  wave: document.getElementById("wave"),
  hp: document.getElementById("hp"),
  maxHp: document.getElementById("max-hp"),
  xp: document.getElementById("xp"),
  xpNext: document.getElementById("xp-next"),
  abilityBtn: document.getElementById("ability-btn"),
  abilityName: document.getElementById("ability-name"),
  upgradePoints: document.getElementById("upgrade-points"),
  overlay: document.getElementById("overlay-message"),
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function createHero(template) {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 18,
    hp: 100,
    maxHp: 100,
    xp: 0,
    level: 1,
    xpToNext: 100,
    attackCooldown: 0,
    specialCooldown: 0,
    stealthTimer: 0,
    upgradePoints: 0,
    speed: template.speed,
    attack: template.attack,
    specialPower: template.specialPower,
    name: template.name,
    color: template.color,
    abilityName: template.abilityName,
  };
}

function renderCharacters() {
  ui.characterGrid.innerHTML = "";
  heroes.forEach((hero) => {
    const card = document.createElement("article");
    card.className = "hero-card";
    card.innerHTML = `
      <h3>${hero.name}</h3>
      <p>Style: Cute but fierce ninja with glowing energy.</p>
      <div class="skill-icons">
        ${hero.skills.map((skill) => `<span class="skill">${skill}</span>`).join("")}
      </div>
    `;
    card.addEventListener("click", () => {
      state.selectedHero = hero;
      document.querySelectorAll(".hero-card").forEach((el) => el.classList.remove("selected"));
      card.classList.add("selected");
      ui.selectedSummary.textContent = `${hero.name} selected • Ability: ${hero.abilityName}`;
      ui.startBtn.disabled = false;
    });
    ui.characterGrid.appendChild(card);
  });
}

function showOverlay(msg, duration = 1100) {
  ui.overlay.textContent = msg;
  ui.overlay.classList.remove("hidden");
  setTimeout(() => ui.overlay.classList.add("hidden"), duration);
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  const margin = 30;
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = -margin;
    y = Math.random() * canvas.height;
  } else if (side === 1) {
    x = canvas.width + margin;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    y = -margin;
    x = Math.random() * canvas.width;
  } else {
    y = canvas.height + margin;
    x = Math.random() * canvas.width;
  }

  const rival = Math.random() > 0.4;
  const scale = 1 + state.wave * 0.12;
  state.enemies.push({
    x,
    y,
    radius: rival ? 16 : 18,
    hp: (rival ? 45 : 60) * scale,
    speed: (rival ? 1.2 : 0.9) * scale,
    damage: rival ? 8 : 10,
    color: rival ? "#d77bff" : "#7ce38b",
    type: rival ? "Rival" : "Monster",
  });
}

function addEffect(x, y, color, text = "") {
  state.effects.push({ x, y, color, text, life: 30 });
}

function handleInput() {
  const hero = state.hero;
  let dx = 0;
  let dy = 0;

  if (state.keys.has("w") || state.keys.has("arrowup")) dy -= 1;
  if (state.keys.has("s") || state.keys.has("arrowdown")) dy += 1;
  if (state.keys.has("a") || state.keys.has("arrowleft")) dx -= 1;
  if (state.keys.has("d") || state.keys.has("arrowright")) dx += 1;

  const mag = Math.hypot(dx, dy) || 1;
  hero.x += (dx / mag) * hero.speed;
  hero.y += (dy / mag) * hero.speed;
  hero.x = Math.max(hero.radius, Math.min(canvas.width - hero.radius, hero.x));
  hero.y = Math.max(hero.radius, Math.min(canvas.height - hero.radius, hero.y));
}

function attack() {
  const hero = state.hero;
  if (hero.attackCooldown > 0) return;
  hero.attackCooldown = 18;

  state.enemies.forEach((enemy) => {
    const dist = Math.hypot(enemy.x - hero.x, enemy.y - hero.y);
    if (dist < 65) {
      enemy.hp -= hero.attack;
      addEffect(enemy.x, enemy.y, "#ffffff", "Slash");
    }
  });
}

function unleashAbility() {
  const hero = state.hero;
  if (hero.specialCooldown > 0) return;
  hero.specialCooldown = 180;

  if (state.selectedHero.id === "kira") {
    const angle = Math.atan2(state.mouse.y - hero.y, state.mouse.x - hero.x);
    hero.x += Math.cos(angle) * 140;
    hero.y += Math.sin(angle) * 140;
    hero.x = Math.max(hero.radius, Math.min(canvas.width - hero.radius, hero.x));
    hero.y = Math.max(hero.radius, Math.min(canvas.height - hero.radius, hero.y));
    state.enemies.forEach((enemy) => {
      if (Math.hypot(enemy.x - hero.x, enemy.y - hero.y) < 90) {
        enemy.hp -= hero.specialPower;
      }
    });
    addEffect(hero.x, hero.y, "#6ee7ff", "Shadow Dash");
  } else {
    state.enemies.forEach((enemy) => {
      enemy.hp -= hero.specialPower;
      addEffect(enemy.x, enemy.y, "#ff8f5a", "Fire");
    });
  }

  showOverlay("Unleash Abilities!");
}

function toggleStealth() {
  const hero = state.hero;
  hero.stealthTimer = hero.stealthTimer > 0 ? 0 : 180;
  showOverlay(hero.stealthTimer ? "Stealth On" : "Stealth Off", 700);
}

function updateCombat() {
  const hero = state.hero;
  if (hero.attackCooldown > 0) hero.attackCooldown -= 1;
  if (hero.specialCooldown > 0) hero.specialCooldown -= 1;
  if (hero.stealthTimer > 0) hero.stealthTimer -= 1;

  state.enemies.forEach((enemy) => {
    const angle = Math.atan2(hero.y - enemy.y, hero.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed;
    enemy.y += Math.sin(angle) * enemy.speed;

    const dist = Math.hypot(enemy.x - hero.x, enemy.y - hero.y);
    if (dist < enemy.radius + hero.radius && hero.stealthTimer <= 0) {
      hero.hp -= enemy.damage * 0.02;
    }
  });

  const before = state.enemies.length;
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  const defeated = before - state.enemies.length;
  if (defeated > 0) {
    hero.xp += defeated * 28;
    state.score += defeated;
  }

  while (hero.xp >= hero.xpToNext) {
    hero.xp -= hero.xpToNext;
    hero.level += 1;
    hero.upgradePoints += 1;
    hero.xpToNext = Math.floor(hero.xpToNext * 1.24);
    state.wave += 1;
    state.maxEnemies = Math.min(20, state.maxEnemies + 1);
    showOverlay(`Level Up! Wave ${state.wave}`);
  }

  if (hero.hp <= 0) {
    state.gameOver = true;
    showOverlay(`Defeated! Waves survived: ${state.wave}`, 100000);
  }
}

function updateSpawns() {
  state.spawnTimer += 1;
  const interval = Math.max(30, 90 - state.wave * 4);
  if (state.enemies.length < state.maxEnemies && state.spawnTimer >= interval) {
    state.spawnTimer = 0;
    spawnEnemy();
  }
}

function drawHero() {
  const hero = state.hero;
  const alpha = hero.stealthTimer > 0 ? 0.38 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = hero.color;
  ctx.beginPath();
  ctx.arc(hero.x, hero.y, hero.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#101017";
  ctx.fillRect(hero.x - 12, hero.y - 5, 24, 10);
  ctx.fillStyle = "#fff";
  ctx.fillRect(hero.x - 8, hero.y - 3, 5, 2);
  ctx.fillRect(hero.x + 3, hero.y - 3, 5, 2);

  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hero.x, hero.y, hero.radius + 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawEnemies() {
  state.enemies.forEach((enemy) => {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0e0e18";
    ctx.fillRect(enemy.x - 9, enemy.y - 3, 18, 6);
  });
}

function drawEffects() {
  state.effects.forEach((fx) => {
    fx.life -= 1;
    ctx.globalAlpha = fx.life / 30;
    ctx.fillStyle = fx.color;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, 12 + (30 - fx.life) * 0.5, 0, Math.PI * 2);
    ctx.fill();
    if (fx.text) {
      ctx.fillStyle = "#fff";
      ctx.fillText(fx.text, fx.x + 8, fx.y - 8);
    }
    ctx.globalAlpha = 1;
  });
  state.effects = state.effects.filter((fx) => fx.life > 0);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1f213d");
  gradient.addColorStop(1, "#0b0c1a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawEffects();
  drawHero();
  drawEnemies();
}

function syncHud() {
  const h = state.hero;
  ui.heroName.textContent = h.name;
  ui.heroLevel.textContent = h.level;
  ui.wave.textContent = state.wave;
  ui.hp.textContent = Math.max(0, Math.floor(h.hp));
  ui.maxHp.textContent = h.maxHp;
  ui.xp.textContent = Math.floor(h.xp);
  ui.xpNext.textContent = h.xpToNext;
  ui.abilityName.textContent = `Ability: ${h.abilityName}${h.specialCooldown > 0 ? ` (${Math.ceil(h.specialCooldown / 60)}s)` : ""}`;
  ui.upgradePoints.textContent = `Points: ${h.upgradePoints}`;
}

function gameLoop() {
  if (state.gameOver) {
    render();
    syncHud();
    return;
  }

  handleInput();
  updateCombat();
  updateSpawns();
  render();
  syncHud();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  state.hero = createHero(state.selectedHero);
  state.enemies = [];
  state.effects = [];
  state.wave = 1;
  state.maxEnemies = 4;
  state.spawnTimer = 0;
  state.gameOver = false;
  ui.characterScreen.classList.remove("active");
  ui.gameScreen.classList.add("active");
  gameLoop();
}

function setupEvents() {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    state.keys.add(key);
    if (key === "j") attack();
    if (key === " " || key === "k") {
      e.preventDefault();
      unleashAbility();
    }
    if (key === "l") toggleStealth();
  });

  window.addEventListener("keyup", (e) => {
    state.keys.delete(e.key.toLowerCase());
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    state.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  });

  canvas.addEventListener("click", attack);
  ui.abilityBtn.addEventListener("click", unleashAbility);

  document.querySelectorAll(".upgrade").forEach((btn) => {
    btn.addEventListener("click", () => {
      const hero = state.hero;
      if (!hero || hero.upgradePoints <= 0) return;
      const type = btn.dataset.upgrade;
      if (type === "speed") hero.speed *= 1.1;
      if (type === "attack") hero.attack *= 1.15;
      if (type === "special") hero.specialPower *= 1.2;
      hero.upgradePoints -= 1;
      showOverlay(`${type.toUpperCase()} upgraded!`, 700);
    });
  });

  ui.startBtn.addEventListener("click", startGame);
}

renderCharacters();
setupEvents();
