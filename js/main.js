/* =========================================================
   Anusha's Portfolio - main.js
   Three jobs:
   1. Dark / light theme button
   2. Fade-in animation when scrolling (GSAP)
   3. 3D shape in the hero section (Three.js)
   ========================================================= */

var rootElement = document.documentElement;
var userPrefersLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* ---------- 1. THEME BUTTON ---------- */
function isDarkModeOn() {
  var chosenTheme = rootElement.getAttribute("data-theme");

  // If the visitor already clicked the button, use that choice
  if (chosenTheme) {
    return chosenTheme === "dark";
  }
  // Otherwise follow the device setting
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

document.getElementById("theme-button").addEventListener("click", function () {
  if (isDarkModeOn()) {
    rootElement.setAttribute("data-theme", "light");
  } else {
    rootElement.setAttribute("data-theme", "dark");
  }

  // Update the 3D shape color to match the new theme
  if (typeof updateShapeColor === "function") {
    updateShapeColor();
  }
});


/* ---------- 2. SCROLL ANIMATIONS (GSAP) ---------- */
function setupScrollAnimations() {
  // If GSAP did not load (no internet) or user wants less motion, skip
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  if (userPrefersLessMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  // Hero text slides up when the page opens
  gsap.from(".hero-text > *", {
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power3.out"
  });

  // These elements fade in when they reach the screen
  var itemsToAnimate = gsap.utils.toArray(
    ".about-layout, .stat-box, .project-card, .info-row, .contact > *, .section > .label, .section > h2"
  );

  itemsToAnimate.forEach(function (item) {
    gsap.from(item, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: item,
        start: "top 90%"
      }
    });
  });
}

setupScrollAnimations();


/* ---------- 3. 3D HERO SHAPE (Three.js) ---------- */
var updateShapeColor;   // made global so the theme button can call it

function setup3DHero() {
  // If Three.js did not load, the page still works without the shape
  if (typeof THREE === "undefined") return;

  var canvas = document.getElementById("hero-canvas");

  // Renderer = draws the 3D scene on the canvas
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Scene and camera
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 6;

  // Big wireframe knot
  var knotMaterial = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.5 });
  var knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.5, 0.45, 140, 18), knotMaterial);
  scene.add(knot);

  // Small shape inside the knot
  var coreMaterial = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.8 });
  var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), coreMaterial);
  scene.add(core);

  // 400 small dots floating around
  var dotPositions = [];
  for (var i = 0; i < 400; i++) {
    dotPositions.push(
      (Math.random() - 0.5) * 14,   // x
      (Math.random() - 0.5) * 10,   // y
      (Math.random() - 0.5) * 8     // z
    );
  }
  var dotGeometry = new THREE.BufferGeometry();
  dotGeometry.setAttribute("position", new THREE.Float32BufferAttribute(dotPositions, 3));
  var dotMaterial = new THREE.PointsMaterial({ size: 0.03, transparent: true, opacity: 0.7 });
  var dots = new THREE.Points(dotGeometry, dotMaterial);
  scene.add(dots);

  // Use the accent color from CSS for all the 3D parts
  updateShapeColor = function () {
    var accent = getComputedStyle(rootElement).getPropertyValue("--accent").trim() || "#6d4aff";
    knotMaterial.color.set(accent);
    coreMaterial.color.set(accent);
    dotMaterial.color.set(accent);
  };
  updateShapeColor();

  // Match the canvas size to the screen
  function resizeCanvas() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // smaller shape on phones
    var scale = width < 600 ? 0.65 : 1;
    knot.scale.setScalar(scale);
    core.scale.setScalar(scale);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // ----- Mouse / finger control -----
  var isDragging = false;
  var lastX = 0;
  var lastY = 0;
  var spinX = 0;       // extra spin added by dragging
  var spinY = 0;
  var mouseX = 0;      // mouse position from -0.5 to 0.5
  var mouseY = 0;

  canvas.addEventListener("pointerdown", function (event) {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.style.cursor = "grabbing";
  });

  window.addEventListener("pointerup", function () {
    isDragging = false;
    canvas.style.cursor = "grab";
  });

  window.addEventListener("pointermove", function (event) {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;

    if (isDragging) {
      spinY += (event.clientX - lastX) * 0.0015;
      spinX += (event.clientY - lastY) * 0.0015;
      lastX = event.clientX;
      lastY = event.clientY;
    }
  });

  // ----- Animation loop: runs about 60 times per second -----
  function animate() {
    var scrollAmount = window.scrollY / window.innerHeight;
    var autoSpeed = userPrefersLessMotion ? 0 : 1;

    // Slow automatic rotation + whatever the user dragged
    knot.rotation.y += 0.004 * autoSpeed + spinY;
    knot.rotation.x += 0.002 * autoSpeed + spinX;
    knot.rotation.z = scrollAmount * 1.5;      // scrolling twists the shape

    // Drag spin slowly fades out
    spinX *= 0.94;
    spinY *= 0.94;

    core.rotation.y -= 0.01;
    core.rotation.x = knot.rotation.x;
    dots.rotation.y = scrollAmount * 0.5 + mouseX * 0.2;

    // Camera follows the mouse a little
    camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    // Fade the shape out while scrolling down
    canvas.style.opacity = Math.max(0, 1 - scrollAmount * 1.2);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

setup3DHero();