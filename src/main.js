import * as THREE from "three";
import "./style.css";

console.log("이기운 키우기 starting...");

const STORAGE_KEY = "kiun-mini-raising-game-v1";

const canvas = document.getElementById("three-canvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d1714);
scene.fog = new THREE.Fog(0x1d1714, 12, 30);

const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 3.1, 8.2);
camera.lookAt(0, 1.2, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const ui = {
  loader: document.getElementById("loading-screen"),
  level: document.getElementById("level-value"),
  exp: document.getElementById("exp-value"),
  coins: document.getElementById("coin-value"),
  expBar: document.getElementById("exp-bar"),
  energy: document.getElementById("energy-value"),
  mood: document.getElementById("mood-value"),
  focus: document.getElementById("focus-value"),
  coding: document.getElementById("coding-value"),
  social: document.getElementById("social-value"),
  energyBar: document.getElementById("energy-bar"),
  moodBar: document.getElementById("mood-bar"),
  focusBar: document.getElementById("focus-bar"),
  codingBar: document.getElementById("coding-bar"),
  socialBar: document.getElementById("social-bar"),
  daily: document.getElementById("daily-message"),
  bubble: document.getElementById("reaction-bubble"),
  bubbleText: document.getElementById("reaction-text"),
  achievementList: document.getElementById("achievement-list"),
  galleryMain: document.getElementById("gallery-main"),
  galleryTitle: document.getElementById("gallery-title"),
  galleryCaption: document.getElementById("gallery-caption"),
  galleryThumbs: document.getElementById("gallery-thumbs"),
  toast: document.getElementById("toast"),
};

const defaultState = {
  level: 1,
  exp: 0,
  expToNext: 100,
  coins: 30,
  energy: 72,
  mood: 70,
  focus: 68,
  coding: 55,
  social: 42,
  bond: 35,
  day: 1,
  actions: 0,
  petCount: 0,
  lastAction: "idle",
  achievements: [],
  dailyMessage: "천천히 해도 괜찮아. 꾸준히 가는 게 중요해.",
};

let state = loadState();
let currentPose = "idle";
let isDraggingCharacter = false;
let lastPetAt = 0;
let time = 0;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function addStat(key, amount) {
  state[key] = clamp((state[key] ?? 0) + amount);
}

function addExp(amount) {
  state.exp += amount;

  while (state.exp >= state.expToNext) {
    state.exp -= state.expToNext;
    state.level += 1;
    state.expToNext = Math.floor(100 + state.level * 35);
    state.coins += 20 + state.level * 5;
    showReaction(`Lv.${state.level}! 한 뼘 성장했다 ✨`);
    showToast(`레벨업! Lv.${state.level}`);
    spawnSparkles(kiun.position, 28, 0xffd36a);
  }
}

function setDailyMessage(text) {
  state.dailyMessage = text;
}

function unlockAchievement(id, label) {
  if (state.achievements.includes(id)) return;
  state.achievements.push(id);
  showToast(`업적 달성: ${label}`);
}

function checkAchievements() {
  if (state.actions >= 1) unlockAchievement("first-step", "첫 루틴 시작");
  if (state.coding >= 80) unlockAchievement("coding-flow", "몰입 개발자");
  if (state.focus >= 85) unlockAchievement("focus-master", "집중의 달인");
  if (state.energy >= 90) unlockAchievement("fully-charged", "에너지 충전 완료");
  if (state.social >= 65) unlockAchievement("soft-social", "부드러운 외출");
  if (state.petCount >= 5) unlockAchievement("bond-up", "유대감 형성");
  if (state.level >= 3) unlockAchievement("level-three", "루틴 정착");
}

const achievementLabels = {
  "first-step": "첫 루틴 시작",
  "coding-flow": "몰입 개발자",
  "focus-master": "집중의 달인",
  "fully-charged": "에너지 충전 완료",
  "soft-social": "부드러운 외출",
  "bond-up": "유대감 형성",
  "level-three": "루틴 정착",
};

function updateUI() {
  ui.level.textContent = state.level;
  ui.exp.textContent = `${state.exp}/${state.expToNext}`;
  ui.coins.textContent = state.coins.toLocaleString();

  ui.expBar.style.width = `${clamp((state.exp / state.expToNext) * 100)}%`;

  ui.energy.textContent = state.energy;
  ui.mood.textContent = state.mood;
  ui.focus.textContent = state.focus;
  ui.coding.textContent = state.coding;
  ui.social.textContent = state.social;

  ui.energyBar.style.width = `${state.energy}%`;
  ui.moodBar.style.width = `${state.mood}%`;
  ui.focusBar.style.width = `${state.focus}%`;
  ui.codingBar.style.width = `${state.coding}%`;
  ui.socialBar.style.width = `${state.social}%`;

  ui.daily.textContent = state.dailyMessage;

  ui.achievementList.innerHTML = "";
  if (state.achievements.length === 0) {
    const li = document.createElement("li");
    li.textContent = "아직 업적 없음";
    li.className = "muted-achievement";
    ui.achievementList.appendChild(li);
  } else {
    state.achievements.forEach((id) => {
      const li = document.createElement("li");
      li.textContent = `🏆 ${achievementLabels[id] ?? id}`;
      ui.achievementList.appendChild(li);
    });
  }

  saveState();
}

function showReaction(text) {
  ui.bubbleText.textContent = text;
  ui.bubble.classList.remove("hidden");
  ui.bubble.classList.add("visible");

  clearTimeout(ui.bubble._timer);
  ui.bubble._timer = setTimeout(() => {
    ui.bubble.classList.remove("visible");
    ui.bubble.classList.add("hidden");
  }, 2200);
}

function showToast(text) {
  ui.toast.textContent = text;
  ui.toast.classList.remove("hidden");
  ui.toast.classList.add("visible");

  clearTimeout(ui.toast._timer);
  ui.toast._timer = setTimeout(() => {
    ui.toast.classList.remove("visible");
    ui.toast.classList.add("hidden");
  }, 1800);
}

const galleryItems = [
  {
    id: "room-ui",
    label: "room-ui",
    caption: "메인 게임 UI 무드보드",
    src: "/assets/kiun/room-ui.png",
  },
  {
    id: "emotion-sheet",
    label: "emotion-sheet",
    caption: "감정표와 표정 톤 참고",
    src: "/assets/kiun/emotion-sheet.png",
  },
  {
    id: "pixel-sprite",
    label: "pixel-sprite",
    caption: "도트 스프라이트 / 애니메이션 참고",
    src: "/assets/kiun/pixel-sprite.png",
  },
  {
    id: "real-1",
    label: "real-1",
    caption: "컷아웃 프로필 A",
    src: "/assets/kiun/real-1.jpg",
  },
  {
    id: "real-2",
    label: "real-2",
    caption: "컷아웃 프로필 B",
    src: "/assets/kiun/real-2.jpg",
  },
  {
    id: "real-3",
    label: "real-3",
    caption: "컷아웃 프로필 C",
    src: "/assets/kiun/real-3.jpg",
  },
  {
    id: "real-4",
    label: "real-4",
    caption: "컷아웃 프로필 D",
    src: "/assets/kiun/real-4.jpg",
  },
  {
    id: "real-5",
    label: "real-5",
    caption: "컷아웃 프로필 E",
    src: "/assets/kiun/real-5.jpg",
  },
];

let selectedGalleryId = "room-ui";

function selectGalleryItem(id, silent = false) {
  const item = galleryItems.find((entry) => entry.id === id);
  if (!item) return;

  selectedGalleryId = id;
  if (ui.galleryMain) {
    ui.galleryMain.src = item.src;
    ui.galleryMain.alt = item.label;
  }
  if (ui.galleryTitle) ui.galleryTitle.textContent = item.label;
  if (ui.galleryCaption) ui.galleryCaption.textContent = item.caption;

  ui.galleryThumbs?.querySelectorAll(".gallery-thumb").forEach((button) => {
    button.classList.toggle("active", button.dataset.galleryId === id);
  });

  if (!silent) showToast(`${item.label} 선택`);
}

function renderGallery() {
  if (!ui.galleryThumbs) return;
  ui.galleryThumbs.innerHTML = "";

  galleryItems.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-thumb";
    button.dataset.galleryId = item.id;
    button.setAttribute("aria-label", item.label);
    button.innerHTML = `<img src="${item.src}" alt="${item.label}" />`;
    button.addEventListener("click", () => selectGalleryItem(item.id));
    ui.galleryThumbs.appendChild(button);
  });

  selectGalleryItem(selectedGalleryId, true);
}

const actions = {
  coding: {
    label: "코딩하기",
    mesh: "laptop",
    pose: "coding",
    cost: 12,
    exp: 22,
    coin: 18,
    changes: { energy: -12, focus: 8, coding: 10, mood: 1 },
    reactions: [
      "코드가 잘 풀리는 날이다 💻",
      "오... 이건 좀 우아하게 짰다.",
      "몰입 들어간다. 말 걸면 안 됨.",
    ],
    daily: "오늘은 코딩 감각이 꽤 좋다. 작게라도 완성하면 충분해.",
  },
  coffee: {
    label: "커피 마시기",
    mesh: "coffee",
    pose: "coffee",
    cost: 0,
    exp: 6,
    coin: -4,
    changes: { energy: 10, focus: 4, mood: 6 },
    reactions: [
      "아메리카노 수혈 완료 ☕",
      "이제야 눈이 좀 떠진다.",
      "커피는 작은 회복 포션이다.",
    ],
    daily: "커피 한 잔의 힘으로 오늘의 리듬이 살아났다.",
  },
  reading: {
    label: "독서하기",
    mesh: "book",
    pose: "reading",
    cost: 5,
    exp: 12,
    coin: 0,
    changes: { energy: -5, focus: 5, mood: 4, coding: 1 },
    reactions: [
      "좋은 문장을 발견했다 📚",
      "조용한 시간이 꽤 좋다.",
      "생각이 조금 정리되는 기분.",
    ],
    daily: "책을 읽으면 속도가 느려져서 오히려 생각이 깊어진다.",
  },
  music: {
    label: "음악 듣기",
    mesh: "music",
    pose: "music",
    cost: 1,
    exp: 8,
    coin: 0,
    changes: { energy: 2, mood: 8, focus: 2 },
    reactions: [
      "플레이리스트가 오늘을 살렸다 🎧",
      "이 노래 지금 분위기랑 너무 맞는다.",
      "조금 더 부드러운 사람이 된 기분.",
    ],
    daily: "좋은 음악은 하루의 결을 바꾼다.",
  },
  exercise: {
    label: "운동하기",
    mesh: "dumbbell",
    pose: "exercise",
    cost: 14,
    exp: 18,
    coin: 0,
    changes: { energy: -14, mood: 7, social: 2, focus: 1 },
    reactions: [
      "운동 완료! 생각보다 개운하다 🏃",
      "숨은 차지만 기분은 좋아졌다.",
      "체력은 미래의 집중력이다.",
    ],
    daily: "몸을 움직이니 머리도 조금 맑아졌다.",
  },
  meal: {
    label: "밥 먹기",
    mesh: "meal",
    pose: "meal",
    cost: 0,
    exp: 8,
    coin: -8,
    changes: { energy: 16, mood: 4, focus: 1 },
    reactions: [
      "든든하게 먹었다 🍚",
      "밥 먹으니까 세상이 조금 친절해졌다.",
      "먹는 것도 중요한 루틴이다.",
    ],
    daily: "일단 밥을 먹으면 많은 문제가 덜 심각해진다.",
  },
  rest: {
    label: "쉬기",
    mesh: "pillow",
    pose: "rest",
    cost: 0,
    exp: 6,
    coin: 0,
    changes: { energy: 14, mood: 7, focus: -1 },
    reactions: [
      "잠깐 쉬는 것도 전략이다 🛋️",
      "조금 느슨해져도 괜찮다.",
      "회복 중... 방해 금지.",
    ],
    daily: "쉬어야 다시 집중할 수 있다. 이건 게으름이 아니라 관리다.",
  },
  goout: {
    label: "외출하기",
    mesh: "shoe",
    pose: "goout",
    cost: 10,
    exp: 16,
    coin: -6,
    changes: { energy: -10, mood: 6, social: 10, focus: -1 },
    reactions: [
      "바깥 공기가 나쁘지 않았다 🚶",
      "사람을 조금 만나고 왔다.",
      "외출했더니 표정이 부드러워졌다.",
    ],
    daily: "가끔은 방 밖에서도 좋은 일이 생긴다.",
  },
  tidy: {
    label: "방 정리하기",
    mesh: "broom",
    pose: "tidy",
    cost: 6,
    exp: 10,
    coin: 2,
    changes: { energy: -6, focus: 4, mood: 5 },
    reactions: [
      "공간이 정리되니 마음도 정리됐다 🧹",
      "생각보다 개운하다.",
      "이제 다시 집중할 수 있을 것 같다.",
    ],
    daily: "정돈된 공간은 조용한 버프를 준다.",
  },
};

function performAction(actionId) {
  if (actionId === "reset") {
    localStorage.removeItem(STORAGE_KEY);
    state = { ...defaultState };
    updateUI();
    currentPose = "idle";
    showReaction("처음부터 다시 키워보자 🌱");
    spawnSparkles(kiun.position, 18, 0xffffff);
    return;
  }

  const action = actions[actionId];
  if (!action) return;

  if (state.energy < action.cost) {
    showReaction("에너지가 부족해... 잠깐 쉬자 😴");
    setDailyMessage("무리하면 오래 못 간다. 지금은 회복이 먼저다.");
    currentPose = "tired";
    updateUI();
    return;
  }

  throwItem(action.mesh, () => {
    const reaction = action.reactions[Math.floor(Math.random() * action.reactions.length)];
    showReaction(reaction);
    setDailyMessage(action.daily);

    Object.entries(action.changes).forEach(([key, amount]) => {
      addStat(key, amount);
    });

    state.coins = Math.max(0, state.coins + action.coin);
    state.actions += 1;
    state.lastAction = actionId;
    currentPose = action.pose;
    addExp(action.exp);

    maybeSpecialEvent(actionId);
    checkAchievements();
    updateUI();
  });
}

function maybeSpecialEvent(actionId) {
  const seed = (state.actions * 17 + state.level * 13 + state.energy + state.mood) % 100;

  if (actionId === "coding" && seed < 28) {
    addStat("coding", 6);
    addStat("focus", 4);
    state.coins += 10;
    showToast("이벤트: 버그를 우아하게 해결했다");
  }

  if (actionId === "coffee" && seed < 30) {
    addStat("mood", 5);
    addStat("focus", 3);
    showToast("이벤트: 오늘 커피가 유독 맛있다");
  }

  if (actionId === "goout" && seed < 26) {
    addStat("social", 6);
    addStat("mood", 4);
    showToast("이벤트: 좋은 대화를 나눴다");
  }

  if (state.energy < 18 && actionId !== "rest") {
    addStat("mood", -4);
    showToast("주의: 피곤함이 쌓이는 중");
  }
}

const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0x2b2521, roughness: 0.9 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x6d4f35, roughness: 0.75 }),
  rug: new THREE.MeshStandardMaterial({ color: 0x473143, roughness: 0.92 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8a6241, roughness: 0.65 }),
  black: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.55 }),
  jacket: new THREE.MeshStandardMaterial({ color: 0x171615, roughness: 0.35, metalness: 0.12 }),
  fur: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.95 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0xf0eadf, roughness: 0.8 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xf5c9a7, roughness: 0.55 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x080706, roughness: 0.9 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x15100e, roughness: 0.2 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf7f3eb, roughness: 0.7 }),
  coffee: new THREE.MeshStandardMaterial({ color: 0xb7824c, roughness: 0.5 }),
  laptop: new THREE.MeshStandardMaterial({ color: 0x3b424b, roughness: 0.35, metalness: 0.25 }),
  plant: new THREE.MeshStandardMaterial({ color: 0x5aa35e, roughness: 0.8 }),
  plantDark: new THREE.MeshStandardMaterial({ color: 0x2f6636, roughness: 0.8 }),
  book: new THREE.MeshStandardMaterial({ color: 0x405d8f, roughness: 0.7 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xffd36a, roughness: 0.35 }),
};

const ambientLight = new THREE.AmbientLight(0xfff0df, 0.52);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffddb2, 2.1);
keyLight.position.set(4, 7, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 24;
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -5;
scene.add(keyLight);

const blueFill = new THREE.PointLight(0x8cc8ff, 0.7, 18);
blueFill.position.set(-4, 4, 2);
scene.add(blueFill);

const warmLamp = new THREE.PointLight(0xffaa65, 1.2, 8);
warmLamp.position.set(-3.2, 2.3, 0.7);
scene.add(warmLamp);

function createRoom() {
  const group = new THREE.Group();

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), materials.wall);
  backWall.position.set(0, 3, -4);
  backWall.receiveShadow = true;
  group.add(backWall);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  group.add(floor);

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3), materials.rug);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, -0.48, 2.2);
  rug.receiveShadow = true;
  group.add(rug);

  const desk = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 1.35), materials.wood);
  desk.position.set(-1.6, 0.72, -1.6);
  desk.castShadow = true;
  desk.receiveShadow = true;
  group.add(desk);

  for (let x of [-3.5, 0.3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.2, 0.14), materials.wood);
    leg.position.set(x, 0.1, -1.1);
    leg.castShadow = true;
    group.add(leg);
  }

  const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.62), materials.laptop);
  laptopBase.position.set(-1.8, 0.86, -1.6);
  laptopBase.rotation.y = -0.1;
  laptopBase.castShadow = true;
  group.add(laptopBase);

  const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 0.06), materials.laptop);
  laptopScreen.position.set(-1.82, 1.17, -1.88);
  laptopScreen.rotation.x = -0.25;
  laptopScreen.rotation.y = -0.1;
  laptopScreen.castShadow = true;
  group.add(laptopScreen);

  const screenGlow = new THREE.PointLight(0x89c7ff, 0.8, 4);
  screenGlow.position.set(-1.8, 1.25, -1.5);
  group.add(screenGlow);

  const coffee = createCoffeeCup();
  coffee.position.set(-0.55, 0.91, -1.42);
  coffee.scale.setScalar(0.9);
  group.add(coffee);

  const bookStack = createBookStack();
  bookStack.position.set(-3.0, 0.91, -1.55);
  group.add(bookStack);

  const lampStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 12), materials.black);
  lampStand.position.set(-3.55, 1.25, -1.4);
  lampStand.rotation.z = -0.35;
  group.add(lampStand);

  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.32, 18), materials.gold);
  lampHead.position.set(-3.2, 1.8, -1.35);
  lampHead.rotation.z = 0.25;
  lampHead.castShadow = true;
  group.add(lampHead);

  const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x4c4038, roughness: 0.55 });
  const windowGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.2),
    new THREE.MeshStandardMaterial({
      color: 0x6f8fb8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.35,
    })
  );
  windowGlass.position.set(2.4, 3.4, -3.95);
  group.add(windowGlass);

  const bars = [
    [3.6, 0.08, 0.08, 2.4, 4.54, -3.9],
    [3.6, 0.08, 0.08, 2.4, 2.26, -3.9],
    [0.08, 2.3, 0.08, 0.6, 3.4, -3.9],
    [0.08, 2.3, 0.08, 4.2, 3.4, -3.9],
    [0.08, 2.3, 0.08, 2.4, 3.4, -3.88],
  ];
  bars.forEach(([w, h, d, x, y, z]) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), windowFrameMat);
    bar.position.set(x, y, z);
    group.add(bar);
  });

  group.add(createPlant(-4.4, -0.5, -1.5, 1.6));
  group.add(createPlant(4.7, -0.5, -0.8, 1.5));
  group.add(createPlant(3.6, 0.85, -1.95, 0.8));

  const wallMemo = createWallMemo("CODE · REST · GROW");
  wallMemo.position.set(-3.4, 3.3, -3.92);
  group.add(wallMemo);

  return group;
}

function createWallMemo(text) {
  const group = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 1.05, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xd4b58b, roughness: 0.8 })
  );
  group.add(board);

  const lines = text.split(" · ");
  lines.forEach((line, index) => {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.06, 0.045),
      new THREE.MeshBasicMaterial({ color: index === 0 ? 0x2c2c2c : 0x654b38 })
    );
    strip.position.set(0, 0.28 - index * 0.26, 0.04);
    group.add(strip);
  });

  return group;
}

function createBookStack() {
  const group = new THREE.Group();
  const colors = [0x344c7a, 0x7a4434, 0x2f6d4a];
  colors.forEach((color, index) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.09, 0.42),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
    );
    book.position.y = index * 0.095;
    book.rotation.y = (index - 1) * 0.08;
    book.castShadow = true;
    group.add(book);
  });
  return group;
}

function createCoffeeCup() {
  const group = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.32, 24), materials.white);
  cup.castShadow = true;
  group.add(cup);

  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.12, 0.09, 24),
    materials.coffee
  );
  sleeve.position.y = -0.02;
  group.add(sleeve);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 24), materials.black);
  lid.position.y = 0.18;
  group.add(lid);

  return group;
}

function createPlant(x, y, z, scale = 1) {
  const group = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.2, 0.38, 18),
    new THREE.MeshStandardMaterial({ color: 0xb37a4d, roughness: 0.7 })
  );
  pot.position.y = 0.2;
  pot.castShadow = true;
  group.add(pot);

  for (let i = 0; i < 7; i += 1) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 8),
      i % 2 === 0 ? materials.plant : materials.plantDark
    );
    const angle = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.18, 0.55 + Math.random() * 0.28, Math.sin(angle) * 0.18);
    leaf.scale.set(0.65, 1.35, 0.45);
    leaf.rotation.z = angle;
    leaf.castShadow = true;
    group.add(leaf);
  }

  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  return group;
}

function createKiun() {
  const group = new THREE.Group();
  group.userData.character = true;

  const legs = [];
  for (let side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.68, 12), materials.black);
    leg.position.set(side * 0.18, -0.28, 0);
    leg.castShadow = true;
    leg.userData.character = true;
    group.add(leg);
    legs.push(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.38), materials.white);
    shoe.position.set(side * 0.18, -0.66, 0.08);
    shoe.castShadow = true;
    shoe.userData.character = true;
    group.add(shoe);
  }

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.05, 0.42), materials.jacket);
  body.position.y = 0.35;
  body.castShadow = true;
  body.userData.character = true;
  group.add(body);

  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.86, 0.44), materials.shirt);
  shirt.position.set(0, 0.34, 0.025);
  shirt.castShadow = true;
  shirt.userData.character = true;
  group.add(shirt);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.105, 12, 32), materials.fur);
  collar.position.set(0, 0.9, 0.03);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1.05, 0.5, 0.4);
  collar.castShadow = true;
  collar.userData.character = true;
  group.add(collar);

  const arms = [];
  for (let side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.82, 14), materials.jacket);
    arm.position.set(side * 0.55, 0.28, 0.02);
    arm.rotation.z = side * 0.22;
    arm.castShadow = true;
    arm.userData.character = true;
    group.add(arm);
    arms.push(arm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), materials.skin);
    hand.position.set(side * 0.66, -0.12, 0.06);
    hand.castShadow = true;
    hand.userData.character = true;
    group.add(hand);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.18, 18), materials.skin);
  neck.position.y = 0.96;
  neck.castShadow = true;
  neck.userData.character = true;
  group.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.27;
  headGroup.userData.character = true;
  group.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 28, 20), materials.skin);
  head.scale.set(0.9, 1.08, 0.86);
  head.castShadow = true;
  head.userData.character = true;
  headGroup.add(head);

  const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.405, 24, 16), materials.hair);
  hairBase.position.set(0, 0.11, -0.015);
  hairBase.scale.set(1, 0.72, 0.92);
  hairBase.castShadow = true;
  hairBase.userData.character = true;
  headGroup.add(hairBase);

  const bangPositions = [
    [-0.22, -0.05, 0.29, 0.16],
    [-0.07, -0.08, 0.32, 0.18],
    [0.1, -0.07, 0.31, 0.16],
    [0.25, -0.02, 0.24, 0.13],
  ];
  bangPositions.forEach(([x, y, z, s]) => {
    const bang = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 8), materials.hair);
    bang.position.set(x, y, z);
    bang.scale.set(0.8, 1.25, 0.6);
    bang.castShadow = true;
    bang.userData.character = true;
    headGroup.add(bang);
  });

  for (let side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), materials.eye);
    eye.position.set(side * 0.13, 0.02, 0.33);
    eye.scale.set(1, 0.75, 0.5);
    eye.userData.character = true;
    headGroup.add(eye);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.018), materials.hair);
    brow.position.set(side * 0.13, 0.105, 0.33);
    brow.rotation.z = side * -0.1;
    brow.userData.character = true;
    headGroup.add(brow);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), materials.skin);
  nose.position.set(0, -0.03, 0.37);
  nose.scale.set(0.75, 0.75, 1.25);
  nose.userData.character = true;
  headGroup.add(nose);

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.018, 0.015),
    new THREE.MeshBasicMaterial({ color: 0x8b4c45 })
  );
  mouth.position.set(0, -0.16, 0.345);
  mouth.userData.character = true;
  headGroup.add(mouth);

  group.position.set(0, 0.42, 0.1);
  group.rotation.y = -0.08;

  group.parts = { body, shirt, collar, arms, legs, headGroup, mouth };
  return group;
}

const room = createRoom();
scene.add(room);

const kiun = createKiun();
scene.add(kiun);

const thrownItems = [];
const sparkles = [];

function createItemMesh(type) {
  const group = new THREE.Group();

  if (type === "coffee") {
    group.add(createCoffeeCup());
  } else if (type === "laptop") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.23), materials.laptop);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.025), materials.laptop);
    screen.position.set(0, 0.12, -0.11);
    screen.rotation.x = -0.35;
    group.add(base, screen);
  } else if (type === "book") {
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.25), materials.book);
    group.add(book);
  } else if (type === "music") {
    const note = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16), materials.gold);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.34, 0.035), materials.gold);
    stem.position.set(0.11, 0.17, 0);
    group.add(note, stem);
  } else if (type === "dumbbell") {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.46, 10), materials.black);
    bar.rotation.z = Math.PI / 2;
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.2), materials.black);
    const r = l.clone();
    l.position.x = -0.26;
    r.position.x = 0.26;
    group.add(bar, l, r);
  } else if (type === "meal") {
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 10), materials.white);
    bowl.scale.set(1, 0.35, 1);
    const rice = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 8), materials.white);
    rice.position.y = 0.08;
    group.add(bowl, rice);
  } else if (type === "pillow") {
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.18, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xb6c7e2, roughness: 0.9 })
    );
    group.add(pillow);
  } else if (type === "shoe") {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.13, 0.22), materials.white);
    group.add(shoe);
  } else if (type === "broom") {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 10), materials.wood);
    stick.rotation.z = 0.45;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.08), materials.gold);
    head.position.set(0.18, -0.2, 0);
    group.add(stick, head);
  } else {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), materials.gold);
    group.add(ball);
  }

  group.traverse((obj) => {
    if (obj.isMesh) obj.castShadow = true;
  });

  return group;
}

function throwItem(type, onHit) {
  const mesh = createItemMesh(type);
  mesh.position.set((Math.random() - 0.5) * 1.2, 0.4, 5.2);
  mesh.scale.setScalar(1.15);
  scene.add(mesh);

  thrownItems.push({
    mesh,
    type,
    start: mesh.position.clone(),
    target: new THREE.Vector3(
      kiun.position.x + (Math.random() - 0.5) * 0.35,
      kiun.position.y + 0.85 + Math.random() * 0.4,
      kiun.position.z + 0.05
    ),
    progress: 0,
    speed: 1.5 + Math.random() * 0.4,
    rot: new THREE.Vector3(
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 7
    ),
    onHit,
  });
}

function spawnSparkles(origin, count = 12, color = 0xffd36a) {
  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 + Math.random() * 0.035, 8, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
    );
    mesh.position.copy(origin);
    mesh.position.x += (Math.random() - 0.5) * 0.6;
    mesh.position.y += 0.8 + Math.random() * 0.6;
    mesh.position.z += (Math.random() - 0.5) * 0.4;
    scene.add(mesh);

    sparkles.push({
      mesh,
      life: 1,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.7,
        0.4 + Math.random() * 0.7,
        (Math.random() - 0.5) * 0.5
      ),
    });
  }
}

function updateThrownItems(delta) {
  for (let i = thrownItems.length - 1; i >= 0; i -= 1) {
    const item = thrownItems[i];
    item.progress += delta * item.speed;
    const t = clamp(item.progress, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const arc = Math.sin(t * Math.PI) * 1.1;

    item.mesh.position.lerpVectors(item.start, item.target, eased);
    item.mesh.position.y += arc;
    item.mesh.rotation.x += item.rot.x * delta;
    item.mesh.rotation.y += item.rot.y * delta;
    item.mesh.rotation.z += item.rot.z * delta;

    if (t >= 1) {
      item.onHit?.();
      spawnSparkles(item.target, 14, 0xffdd91);
      scene.remove(item.mesh);
      thrownItems.splice(i, 1);
    }
  }
}

function updateSparkles(delta) {
  for (let i = sparkles.length - 1; i >= 0; i -= 1) {
    const s = sparkles[i];
    s.life -= delta * 1.5;
    s.mesh.position.addScaledVector(s.velocity, delta);
    s.velocity.y -= delta * 0.45;
    s.mesh.scale.setScalar(Math.max(0.1, s.life));
    s.mesh.material.opacity = Math.max(0, s.life);

    if (s.life <= 0) {
      scene.remove(s.mesh);
      sparkles.splice(i, 1);
    }
  }
}

function updatePose(delta) {
  const p = kiun.parts;
  const breathe = Math.sin(time * 2.2) * 0.025;
  kiun.position.y = 0.42 + breathe;
  p.headGroup.rotation.y = Math.sin(time * 0.8) * 0.06;
  p.headGroup.rotation.z = Math.sin(time * 0.65) * 0.025;

  p.arms.forEach((arm, index) => {
    const side = index === 0 ? -1 : 1;
    arm.rotation.z = side * (0.22 + Math.sin(time * 1.3 + index) * 0.025);
  });

  if (currentPose === "coding") {
    p.headGroup.rotation.x = -0.18 + Math.sin(time * 2) * 0.015;
    p.arms[0].rotation.z = -0.85;
    p.arms[1].rotation.z = 0.85;
  } else if (currentPose === "coffee") {
    p.headGroup.rotation.x = -0.05;
    p.arms[1].rotation.z = 1.1 + Math.sin(time * 2) * 0.04;
  } else if (currentPose === "reading") {
    p.headGroup.rotation.x = -0.16;
    p.arms[0].rotation.z = -0.7;
    p.arms[1].rotation.z = 0.7;
  } else if (currentPose === "exercise") {
    p.headGroup.rotation.x = Math.sin(time * 6) * 0.08;
    p.arms[0].rotation.z = -0.7 + Math.sin(time * 8) * 0.25;
    p.arms[1].rotation.z = 0.7 - Math.sin(time * 8) * 0.25;
    kiun.position.y += Math.abs(Math.sin(time * 8)) * 0.08;
  } else if (currentPose === "rest" || currentPose === "tired") {
    p.headGroup.rotation.x = 0.18 + Math.sin(time * 1.2) * 0.025;
    p.headGroup.rotation.z = 0.1;
  } else if (currentPose === "goout") {
    kiun.rotation.y = -0.25 + Math.sin(time * 3) * 0.08;
    p.arms[0].rotation.z = -0.28 + Math.sin(time * 6) * 0.15;
    p.arms[1].rotation.z = 0.28 - Math.sin(time * 6) * 0.15;
  } else if (currentPose === "music") {
    p.headGroup.rotation.z = Math.sin(time * 3) * 0.07;
    p.arms[0].rotation.z = -0.35;
    p.arms[1].rotation.z = 0.35;
  } else {
    p.headGroup.rotation.x = Math.sin(time * 0.7) * 0.025;
    kiun.rotation.y += (-0.08 - kiun.rotation.y) * Math.min(1, delta * 4);
  }
}

function getCharacterHit(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(kiun.children, true);
  return hits.find((hit) => hit.object.userData.character);
}

canvas.addEventListener("pointerdown", (event) => {
  const hit = getCharacterHit(event);
  if (!hit) return;
  isDraggingCharacter = true;
  petCharacter();
});

canvas.addEventListener("pointermove", (event) => {
  if (!isDraggingCharacter) return;
  const now = performance.now();
  if (now - lastPetAt < 500) return;
  lastPetAt = now;
  petCharacter();
});

window.addEventListener("pointerup", () => {
  isDraggingCharacter = false;
});

function petCharacter() {
  state.petCount += 1;
  addStat("mood", 2);
  addStat("focus", 1);
  state.bond = clamp(state.bond + 3);
  currentPose = "music";

  const reactions = [
    "오... 응원 고마워.",
    "기운이 조금 났다 🌱",
    "조용한 응원이 꽤 좋다.",
    "오늘도 해볼게.",
  ];
  showReaction(reactions[state.petCount % reactions.length]);
  spawnSparkles(kiun.position, 10, 0xffc9de);
  checkAchievements();
  updateUI();
}

document.querySelectorAll(".item-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const actionId = button.dataset.action;
    button.classList.add("pressed");
    setTimeout(() => button.classList.remove("pressed"), 260);
    performAction(actionId);
  });
});

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  time += delta;

  updatePose(delta);
  updateThrownItems(delta);
  updateSparkles(delta);

  const cameraDrift = Math.sin(time * 0.24) * 0.08;
  camera.position.x = cameraDrift;
  camera.lookAt(0, 1.18, 0);

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

setTimeout(() => {
  ui.loader?.classList.add("hidden");
}, 800);

renderGallery();
updateUI();
animate();
