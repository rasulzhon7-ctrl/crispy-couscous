
"use strict";

// NEXORA AI 5.0
const $ = id => document.getElementById(id);
const reducedMotion = matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// INTRO
const intro = $("intro");
const introScene = $("introScene");
const enterBtn = $("enterBtn");
const main = $("mainContent");

main.inert = true;

function welcomeSound() {
  try {
    const AudioClass = window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioClass) return;

    const audio = new AudioClass();
    audio.resume();

    [440, 554, 740].forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const time = audio.currentTime + index * 0.12;

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.035, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

      oscillator.connect(gain);
      gain.connect(audio.destination);

      oscillator.start(time);
      oscillator.stop(time + 0.23);
    });

    setTimeout(() => audio.close().catch(() => {}), 1000);
  } catch (error) {
    // Без звука сайт продолжит работать.
  }
}

enterBtn.addEventListener("click", () => {
  welcomeSound();
  intro.classList.add("closed");
  document.body.classList.remove("intro-active");
  main.inert = false;

  setTimeout(() => {
    intro.hidden = true;
    $("runTerminal").focus({preventScroll:true});
    playTerminal();
  }, reducedMotion ? 0 : 900);
});

// 3D INTRO MOUSE MOVEMENT
if (!reducedMotion &&
    matchMedia("(hover:hover) and (pointer:fine)").matches) {
  introScene.addEventListener("pointermove", event => {
    const rect = introScene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    introScene.style.transform =
      `perspective(950px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
  });

  introScene.addEventListener("pointerleave", () => {
    introScene.style.transform = "";
  });
}

// PARTICLE ENGINE
let effectsEnabled = !reducedMotion;
const particleSystems = [];

function createParticles(canvas, introMode) {
  const context = canvas.getContext("2d");
  if (!context) return;

  let width = 0;
  let height = 0;
  let particles = [];
  let frame = null;

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.min(
      introMode ? 85 : 60,
      Math.max(20, Math.floor(width / 19))
    );

    particles = Array.from({length:count}, () => ({
      x:Math.random() * width,
      y:Math.random() * height,
      vx:(Math.random() - 0.5) * 0.3,
      vy:(Math.random() - 0.5) * 0.3,
      radius:Math.random() * 1.6 + 0.5,
      alpha:Math.random() * 0.45 + 0.15
    }));
  }

  function draw() {
    context.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      context.beginPath();
      context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(158,145,255,${p.alpha})`;
      context.fill();
    });

    if (width > 600) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);

          if (distance < 105) {
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.strokeStyle =
              `rgba(89,150,255,${(1 - distance / 105) * 0.12})`;
            context.lineWidth = 0.7;
            context.stroke();
          }
        }
      }
    }

    frame = requestAnimationFrame(draw);
  }

  function start() {
    if (frame !== null || !effectsEnabled) return;
    draw();
  }

  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    context.clearRect(0, 0, width, height);
  }

  resize();

  window.addEventListener("resize", () => {
    const wasRunning = frame !== null;
    stop();
    resize();
    if (wasRunning) start();
  });

  particleSystems.push({start, stop});
  if (effectsEnabled) start();
}

createParticles($("introCanvas"), true);
createParticles($("backgroundCanvas"), false);

// EFFECTS TOGGLE
const effectsBtn = $("effectsBtn");

function updateEffects() {
  document.body.classList.toggle("effects-off", !effectsEnabled);
  effectsBtn.textContent = effectsEnabled ? "✧" : "✦";
  effectsBtn.setAttribute(
    "aria-label",
    effectsEnabled ? "Отключить эффекты" : "Включить эффекты"
  );

  particleSystems.forEach(system => {
    if (effectsEnabled) system.start();
    else system.stop();
  });
}

effectsBtn.addEventListener("click", () => {
  effectsEnabled = !effectsEnabled;
  updateEffects();
});

updateEffects();

// MOBILE MENU
const menuBtn = $("menuBtn");
const navMenu = $("navMenu");

menuBtn.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  menuBtn.textContent = open ? "✕" : "☰";
  menuBtn.setAttribute("aria-expanded", String(open));
});

navMenu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuBtn.textContent = "☰";
    menuBtn.setAttribute("aria-expanded", "false");
  });
});

// THEME SWITCHER
const themeBtn = $("themeBtn");

function setTheme(light) {
  document.body.classList.toggle("light", light);
  themeBtn.textContent = light ? "☾" : "☀";

  try {
    localStorage.setItem("nexora-theme", light ? "light" : "dark");
  } catch (error) {}
}

let savedTheme = "dark";
try {
  savedTheme = localStorage.getItem("nexora-theme") || "dark";
} catch (error) {}

setTheme(savedTheme === "light");

themeBtn.addEventListener("click", () => {
  setTheme(!document.body.classList.contains("light"));
});

// TERMINAL DEMOS
const demos = {
  website: [
    "> Initializing NEXORA Code Engine...",
    "",
    "const website = {",
    '  name: "Future Website",',
    '  style: "Ultra Neon 3D",',
    '  version: "5.0",',
    '  status: "READY"',
    "};",
    "",
    "console.log(website);",
    "",
    "✓ Website demo completed"
  ],
  analytics: [
    "> Starting analytics engine...",
    "",
    "const data = [120,180,250,340];",
    "",
    "const total = data.reduce(",
    "  (sum, value) => sum + value, 0",
    ");",
    "",
    "console.log(total); // 890",
    "",
    "✓ Analysis demo completed"
  ],
  automation: [
    "> Running automation demo...",
    "",
    "[1/4] Loading data...",
    "[2/4] Validating input...",
    "[3/4] Processing...",
    "[4/4] Preparing result...",
    "",
    "Status: SUCCESS",
    "✓ Workflow demo completed"
  ]
};

let selectedDemo = "website";
let terminalTimer = null;
let terminalVersion = 0;

function stopTerminal() {
  terminalVersion++;
  clearTimeout(terminalTimer);
}

function playTerminal() {
  stopTerminal();

  const version = terminalVersion;
  const content = demos[selectedDemo].join("\n");
  const output = $("terminalText");
  output.textContent = "";

  if (reducedMotion) {
    output.textContent = content;
    return;
  }

  let position = 0;

  function type() {
    if (version !== terminalVersion ||
        position >= content.length) return;

    output.textContent += content[position++];
    output.scrollTop = output.scrollHeight;
    terminalTimer = setTimeout(type, 18);
  }

  type();
}

$("runTerminal").addEventListener("click", playTerminal);

$("clearTerminal").addEventListener("click", () => {
  stopTerminal();
  $("terminalText").textContent = "Terminal cleared.";
});

document.querySelectorAll(".command").forEach(button => {
  button.addEventListener("click", () => {
    selectedDemo = button.dataset.command;

    document.querySelectorAll(".command").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    playTerminal();
  });
});

// FEATURE TABS
const features = {
  code: {
    number:"FEATURE 01",
    title:"AI Code Studio",
    description:"Пример работы интеллектуального редактора программного кода.",
    html:`<pre>// NEXORA AI Code Studio

function buildApp(name) {
  return {
    name: name,
    design: "Neon 3D",
    status: "READY"
  };
}

console.log(buildApp("NEXORA"));</pre>`
  },
  analytics: {
    number:"FEATURE 02",
    title:"Smart Analytics",
    description:"Демонстрационная визуализация динамики данных.",
    html:`<h4>Analytics Overview</h4>
      <div class="demo-chart">
        <div style="height:32%"></div>
        <div style="height:49%"></div>
        <div style="height:42%"></div>
        <div style="height:69%"></div>
        <div style="height:58%"></div>
        <div style="height:94%"></div>
      </div>
      <p style="color:var(--muted);font-size:12px">
      Пример аналитической диаграммы
      </p>`
  },
  security: {
    number:"FEATURE 03",
    title:"Security Center",
    description:"Демонстрационная панель состояния компонентов системы.",
    html:`<div style="line-height:2.9">
      <h4>⬡ System Monitor</h4>
      <div>✓ Access Control — Demo OK</div>
      <div>✓ Network Monitor — Demo OK</div>
      <div>✓ Activity Review — Demo OK</div>
      <div style="color:#64edb7">● Demo status: ACTIVE</div>
    </div>`
  }
};

const featureTabs = [...document.querySelectorAll(".feature-tab")];

function selectFeature(name) {
  const feature = features[name];
  if (!feature) return;

  $("featureNumber").textContent = feature.number;
  $("featureTitle").textContent = feature.title;
  $("featureDescription").textContent = feature.description;
  $("featurePreview").innerHTML = feature.html;

  featureTabs.forEach(tab => {
    const active = tab.dataset.feature === name;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
}

featureTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectFeature(tab.dataset.feature));

  tab.addEventListener("keydown", event => {
    if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;

    event.preventDefault();
    let next = index;

    if (event.key === "ArrowRight")
      next = (index + 1) % featureTabs.length;
    if (event.key === "ArrowLeft")
      next = (index - 1 + featureTabs.length) % featureTabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = featureTabs.length - 1;

    selectFeature(featureTabs[next].dataset.feature);
    featureTabs[next].focus();
  });
});

selectFeature("code");

// PRICING CALCULATOR
const usersSlider = $("usersSlider");
const billingToggle = $("billingToggle");
let yearly = false;

function money(value) {
  return "$" + value.toLocaleString("en-US", {
    maximumFractionDigits:2
  });
}

function calculatePricing() {
  const users = Number(usersSlider.value);
  const basePrice = 19;
  const unit = yearly ? basePrice * 0.8 : basePrice;
  const monthly = users * unit;
  const total = yearly ? monthly * 12 : monthly;
  const saving = yearly ? users * basePrice * 12 * 0.2 : 0;

  $("usersCount").textContent = users;
  $("totalPrice").textContent = money(total);
  $("unitPrice").textContent = money(unit);
  $("savings").textContent = money(saving);
  $("monthlyPrice").textContent = money(monthly);
  $("periodLabel").textContent =
    yearly ? "за 12 месяцев" : "за 1 месяц";
}

usersSlider.addEventListener("input", calculatePricing);

billingToggle.addEventListener("click", () => {
  yearly = !yearly;

  billingToggle.classList.toggle("active", yearly);
  billingToggle.setAttribute("aria-checked", String(yearly));
  billingToggle.setAttribute(
    "aria-label",
    yearly ? "Переключить на месячную оплату" :
             "Переключить на годовую оплату"
  );

  calculatePricing();
});

calculatePricing();

// FAQ ACCORDION
document.querySelectorAll(".faq-item").forEach((item, index) => {
  const question = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");

  answer.id = "faq-answer-" + index;
  question.setAttribute("aria-controls", answer.id);

  question.addEventListener("click", () => {
    const shouldOpen = !item.classList.contains("open");

    document.querySelectorAll(".faq-item").forEach(other => {
      other.classList.remove("open");
      other.querySelector(".faq-question")
        .setAttribute("aria-expanded", "false");
    });

    if (shouldOpen) {
      item.classList.add("open");
      question.setAttribute("aria-expanded", "true");
    }
  });
});

// DEMO CHAT
const chatLauncher = $("chatLauncher");
const chatPanel = $("chatPanel");
const chatMessages = $("chatMessages");
const chatInput = $("chatInput");

function toggleChat(open) {
  chatPanel.hidden = !open;
  chatLauncher.setAttribute("aria-expanded", String(open));

  if (open) chatInput.focus();
  else chatLauncher.focus();
}

chatLauncher.addEventListener("click", () => {
  toggleChat(chatPanel.hidden);
});

$("chatClose").addEventListener("click", () => toggleChat(false));

function sendMessage(text, sender) {
  const element = document.createElement("div");
  element.className = "message " + sender;
  element.textContent = text;
  chatMessages.appendChild(element);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function botReply(text) {
  const message = text.toLowerCase();

  if (/привет|салом|hello/.test(message)) {
    return "Привет! Добро пожаловать в NEXORA AI 5.0!";
  }
  if (/цен|тариф|оплат|скидк|стоит/.test(message)) {
    return "Базовая демонстрационная цена — $19 за пользователя в месяц. При годовой оплате скидка 20%.";
  }
  if (/3d|дизайн|эффект|луч|анимац/.test(message)) {
    return "NEXORA AI использует CSS 3D, световые лучи, Canvas-частицы и интерактивные анимации.";
  }
  if (/сайт|код|разработ/.test(message)) {
    return "Открой раздел AI Terminal, чтобы посмотреть пример генерации кода.";
  }
  if (/функц|умеешь|помощ/.test(message)) {
    return "Я могу рассказать о функциях, дизайне и тарифах этой демонстрационной платформы.";
  }

  return "Я демонстрационный помощник. Спроси о тарифах, 3D-дизайне, коде или функциях NEXORA AI.";
}

$("chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const text = chatInput.value.trim();
  if (!text) return;

  sendMessage(text, "user");
  chatInput.value = "";
  sendMessage(botReply(text), "bot");
});

// SCROLL REVEAL
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reducedMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.08});

  revealElements.forEach(element => observer.observe(element));
} else {
  revealElements.forEach(element => element.classList.add("visible"));
}

// 3D CARD TILT
if (!reducedMotion &&
    matchMedia("(hover:hover) and (pointer:fine)").matches) {
  document.querySelectorAll(".tilt").forEach(element => {
    element.addEventListener("pointermove", event => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      element.style.transform =
        `perspective(1000px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });
}
