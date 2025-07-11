// ==========================
// 🔧 Register the Settings Menu
// ==========================
Hooks.once("init", () => {
  game.settings.registerMenu("undertale-walk", "userToggleMenu", {
    name: "Toggle for Specific Players",
    label: "Manage Walk Animation Access",
    hint: "Enable or disable walking animations for individual players.",
    type: UserToggleForm,
    restricted: true
  });

  game.settings.register("undertale-walk", "enabledUsers", {
    name: "Enabled Users",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
});

// ==========================
// 🧩 GM Settings Form Class
// ==========================
class UserToggleForm extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "undertale-walk-toggle",
      title: "Enable Walk Animation Per Player",
      template: "modules/undertale-walk/templates/user-toggle.html",
      width: 400
    });
  }

  getData() {
    const allUsers = game.users.contents.filter(u => !u.isGM);
    const enabled = game.settings.get("undertale-walk", "enabledUsers") || [];
    return {
      users: allUsers.map(u => ({
        id: u.id,
        name: u.name,
        enabled: enabled.includes(u.id)
      }))
    };
  }

  async _updateObject(_, formData) {
    const selected = Object.entries(formData)
      .filter(([_, v]) => v === true)
      .map(([k, _]) => k);
    await game.settings.set("undertale-walk", "enabledUsers", selected);
  }
}

// ==========================
// 🚶 Player-Side Animation Logic
// ==========================
Hooks.once("ready", async () => {
  const enabledUsers = game.settings.get("undertale-walk", "enabledUsers") || [];
  if (!enabledUsers.includes(game.user.id)) return;

  let idleTimeout = null;
  let lastDirection = "ArrowDown";

  const walkAnimations = {
    ArrowUp: "modules/undertale-walk/animations/walk_up.webm",
    ArrowDown: "modules/undertale-walk/animations/walk_down.webm",
    ArrowLeft: "modules/undertale-walk/animations/walk_left.webm",
    ArrowRight: "modules/undertale-walk/animations/walk_right.webm"
  };

  const idleAnimations = {
    ArrowUp: "modules/undertale-walk/animations/idle_up.webp",
    ArrowDown: "modules/undertale-walk/animations/idle_down.webp",
    ArrowLeft: "modules/undertale-walk/animations/idle_left.webp",
    ArrowRight: "modules/undertale-walk/animations/idle_right.webp"
  };

  window.addEventListener("keydown", async (event) => {
    const key = event.key;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return;

    const token = canvas.tokens.controlled[0];
    if (!token || !token.document) return;

    lastDirection = key;
    clearTimeout(idleTimeout);

    const gridSize = canvas.grid.size;
    const dx = (key === "ArrowLeft") ? -1 : (key === "ArrowRight") ? 1 : 0;
    const dy = (key === "ArrowUp") ? -1 : (key === "ArrowDown") ? 1 : 0;

    await token.document.update({
      texture: { src: walkAnimations[key] }
    });

    await token.document.update({
      x: token.document.x + dx * gridSize,
      y: token.document.y + dy * gridSize
    });

    idleTimeout = setTimeout(() => {
      token.document.update({
        texture: { src: idleAnimations[lastDirection] }
      });
    }, 300);
  });
});
