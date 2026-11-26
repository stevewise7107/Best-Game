
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;

let engine, world;
let W, H, c, ctx;

let mouse;
let move = false;
let lastSelected = null;

let circles = [];
let selected = [];
let booms = [];

let score = 0;
let highScore = Number(localStorage.getItem("proComboHigh") || 0);

let timer = 90;
let gamePlaying = false;
let animationStarted = false;

const colors = [
    '#FF2020',
    '#00E83A',
    '#168BFF',
    '#E000FF',
    '#FFD700'
];

const GLOW_COLOR = '#FFD700';

function random(max = 1, min = 0) {
    return Math.random() * (max - min) + min;
}


// =================================
// BALL CLASS
// =================================

class Ball {

    constructor(x, y, rad, isGlow = false) {

        this.x = x;
        this.y = y;
        this.rad = rad;

        this.isGlow = isGlow;

        this.mq = Math.floor(random(colors.length - 1));

        this.c = this.isGlow ? GLOW_COLOR : colors[this.mq];

        this.select = false;

        this.options = {
            isStatic: false,
            friction: 0,
            restitution: 0
        };

        this.body = Bodies.circle(
            this.x,
            this.y,
            this.rad,
            this.options
        );

        World.add(world, this.body);
    }


    // =================================
    // SHARP 3D BALL RENDERING
    // =================================

    draw() {

        ctx.save();

        // Main ball gradient

        let g = ctx.createRadialGradient(
            this.x - this.rad * 0.34,
            this.y - this.rad * 0.36,
            1,
            this.x,
            this.y,
            this.rad
        );

        if (this.isGlow) {

            g.addColorStop(0, '#FFFFFF');
            g.addColorStop(0.12, '#FFFDE7');
            g.addColorStop(0.4, '#FFD700');
            g.addColorStop(0.8, '#FFA500');
            g.addColorStop(1, '#744500');

        } else {

            g.addColorStop(0, '#FFFFFF');
            g.addColorStop(0.10, this.c);
            g.addColorStop(0.48, this.c);
            g.addColorStop(0.82, this.c);
            g.addColorStop(1, '#171717');

        }

        // Draw ball

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.rad,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = g;
        ctx.fill();

        // Crisp white reflection

        let highlight = ctx.createRadialGradient(
            this.x - this.rad * 0.34,
            this.y - this.rad * 0.36,
            0,
            this.x - this.rad * 0.34,
            this.y - this.rad * 0.36,
            this.rad * 0.34
        );

        highlight.addColorStop(0, 'rgba(255,255,255,1)');
        highlight.addColorStop(0.22, 'rgba(255,255,255,0.85)');
        highlight.addColorStop(0.55, 'rgba(255,255,255,0.25)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.beginPath();

        ctx.arc(
            this.x - this.rad * 0.34,
            this.y - this.rad * 0.36,
            this.rad * 0.34,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = highlight;
        ctx.fill();

        // Small secondary reflection

        ctx.beginPath();

        ctx.arc(
            this.x - this.rad * 0.12,
            this.y - this.rad * 0.13,
            this.rad * 0.07,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fill();

        // Selection outline

        if (this.select) {

            ctx.beginPath();

            ctx.arc(
                this.x,
                this.y,
                this.rad + 3,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.stroke();

        }

        // Special golden ball outline

        if (this.isGlow) {

            ctx.beginPath();

            ctx.arc(
                this.x,
                this.y,
                this.rad + 2,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle = 'rgba(255,215,0,0.9)';
            ctx.lineWidth = 2;
            ctx.stroke();

        }

        ctx.restore();
    }


    update() {

        this.x = this.body.position.x;
        this.y = this.body.position.y;

        this.draw();
    }

}


// =================================
// PARTICLE EFFECTS
// =================================

class Boom {

    constructor(x, y, rad, color) {

        this.x = x;
        this.y = y;
        this.rad = rad;
        this.color = color;

        this.a = random(2 * Math.PI);
    }

    draw() {

        ctx.beginPath();

        ctx.fillStyle = this.color;

        ctx.arc(
            this.x,
            this.y,
            this.rad,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    update() {

        this.x += 2 * Math.cos(this.a);
        this.y += 2 * Math.sin(this.a);

        this.draw();
    }

}


// =================================
// SCREEN SETUP
// =================================

function initWidthHeight() {

    c.width = W = window.innerWidth;
    c.height = H = window.innerHeight;

}


// =================================
// PHYSICS ENGINE
// =================================

function createMatter() {

    engine = Engine.create();

    world = engine.world;

    Matter.Runner.run(engine);

    World.add(world, [

        Bodies.rectangle(
            W / 2,
            H + 20,
            W,
            40,
            { isStatic: true }
        ),

        Bodies.rectangle(
            -20,
            H / 2,
            40,
            H * 2,
            { isStatic: true }
        ),

        Bodies.rectangle(
            W + 20,
            H / 2,
            40,
            H * 2,
            { isStatic: true }
        )

    ]);

}


// =================================
// CREATE BALLS
// =================================

function createCircles() {

    let rad = W / 12;

    for (
        let x = rad;
        x < W - rad;
        x += rad * 2
    ) {

        for (
            let y = rad;
            y < H - rad;
            y += rad * 2
        ) {

            circles.push(
                new Ball(x, y, rad)
            );

        }

    }

    if (circles.length > 0) {

        let g = circles[
            Math.floor(random(circles.length))
        ];

        g.isGlow = true;
        g.c = GLOW_COLOR;

    }

}


// =================================
// SELECTION
// =================================

function resetSelection() {

    lastSelected = null;
    selected = [];

    circles.forEach(b => {
        b.select = false;
    });

}


function checkSelect() {

    for (let i = 0; i < circles.length; i++) {

        let d = Math.hypot(
            mouse.x - circles[i].x,
            mouse.y - circles[i].y
        );

        if (
            d < circles[i].rad &&
            !circles[i].select
        ) {

            if (selected.length > 0) {

                let last = circles[lastSelected];

                if (
                    last &&
                    Math.hypot(
                        last.x - circles[i].x,
                        last.y - circles[i].y
                    ) < circles[i].rad * 2.2 &&
                    circles[i].mq == last.mq
                ) {

                    selected.push(i);

                    circles[i].select = true;

                    lastSelected = i;

                }

            } else {

                selected.push(i);

                circles[i].select = true;

                lastSelected = i;

            }

        }

    }

}


// =================================
// COMBO SYSTEM
// =================================

function checkCombo() {

    if (selected.length >= 3) {

        let points = 0;

        selected.forEach(idx => {

            let b = circles[idx];

            points += b.isGlow ? 10 : 1;

            for (let n = 0; n < 10; n++) {

                booms.push(
                    new Boom(
                        b.x,
                        b.y,
                        b.rad / 2,
                        b.c
                    )
                );

            }

            World.remove(world, b.body);

        });


        circles = circles.filter(b => !b.select);

        score += points;

        document.getElementById('scoreboard').innerText =
            "Score: " + score;

        highScore = Math.max(score, highScore);

        localStorage.setItem(
            "proComboHigh",
            highScore
        );

        document.getElementById('highscore').innerText =
            "High Score: " + highScore;

        spawnNewBalls(selected.length);

    }

    resetSelection();

}


// =================================
// SPAWN NEW BALLS
// =================================

function spawnNewBalls(n) {

    let rad = W / 12;

    for (let i = 0; i < n; i++) {

        circles.push(
            new Ball(
                random(W - rad * 2, rad),
                random(-50, -10),
                rad
            )
        );

    }

    if (Math.random() < 0.05 && circles.length > 0) {

        let g = circles[
            Math.floor(random(circles.length))
        ];

        g.isGlow = true;
        g.c = GLOW_COLOR;

    }

}


// =================================
// GAME ANIMATION
// =================================

function updateBalls() {

    for (let i = 0; i < circles.length; i++) {

        circles[i].update();

    }

    for (
        let i = booms.length - 1;
        i >= 0;
        i--
    ) {

        booms[i].update();

        booms[i].rad -= 0.5;

        if (booms[i].rad <= 0.6) {

            booms.splice(i, 1);

        }

    }

}


function animate() {

    ctx.clearRect(0, 0, W, H);

    if (move && mouse) {

        checkSelect();

    }

    updateBalls();

    requestAnimationFrame(animate);

}


// =================================
// TIMER
// =================================

function countdown() {

    if (gamePlaying) {

        timer--;

        document.getElementById('timer').innerText =
            "Time: " + timer;

        if (timer <= 0) {

            gameOver();

        } else {

            setTimeout(countdown, 1000);

        }

    }

}


// =================================
// GAME OVER
// =================================

function gameOver() {

    gamePlaying = false;

    let end = document.getElementById('endgame');

    end.style.display = 'flex';

    end.innerHTML =
        'GAME OVER<br><br>' +
        '<span style="font-size:0.6em">Final Score: ' +
        score +
        '</span><br>' +
        '<span style="font-size:0.45em">Tap to Play Again</span>';

}


// =================================
// START / RESTART
// =================================

function startGame() {

    if (gamePlaying) return;

    score = 0;
    timer = 90;

    document.getElementById('scoreboard').innerText =
        "Score: 0";

    document.getElementById('timer').innerText =
        "Time: 90";

    document.getElementById('highscore').innerText =
        "High Score: " + highScore;

    if (document.getElementById('endgame').style.display === 'flex') {

        circles.forEach(b => {
            World.remove(world, b.body);
        });

        circles = [];
        booms = [];

        createCircles();

    }

    document.getElementById('endgame').style.display = 'none';

    document.getElementById('rules').style.display = 'none';

    gamePlaying = true;

    countdown();

}


// =================================
// INITIALIZATION
// =================================

function init() {

    c = document.getElementById("canvas");

    initWidthHeight();

    ctx = c.getContext("2d");

    createMatter();

    createCircles();

    setupEvents();

    if (!animationStarted) {

        animationStarted = true;

        requestAnimationFrame(animate);

    }

}


// =================================
// CONTROLS
// =================================

function setupEvents() {

    mouse = { x: null, y: null };

    c.addEventListener("mousemove", e => {

        if (move) {

            mouse.x = e.clientX;
            mouse.y = e.clientY;

        }

    });

    c.addEventListener("mousedown", e => {

        if (!gamePlaying) return;

        move = true;

        mouse.x = e.clientX;
        mouse.y = e.clientY;

    });

    c.addEventListener("mouseup", () => {

        if (!gamePlaying) return;

        move = false;

        mouse.x = null;
        mouse.y = null;

        checkCombo();

    });


    c.addEventListener("touchstart", e => {

        if (!gamePlaying) return;

        e.preventDefault();

        let t = e.changedTouches[0];

        mouse.x = t.clientX;
        mouse.y = t.clientY;

        move = true;

    }, { passive: false });


    c.addEventListener("touchmove", e => {

        if (!gamePlaying) return;

        e.preventDefault();

        if (move) {

            let t = e.changedTouches[0];

            mouse.x = t.clientX;
            mouse.y = t.clientY;

        }

    }, { passive: false });


    c.addEventListener("touchend", e => {

        if (!gamePlaying) return;

        e.preventDefault();

        move = false;

        mouse.x = null;
        mouse.y = null;

        checkCombo();

    }, { passive: false });


    document.getElementById('rules').addEventListener(
        "click",
        startGame
    );

    document.getElementById('endgame').addEventListener(
        "click",
        startGame
    );


    window.addEventListener("resize", () => {

        initWidthHeight();

    });

}


onload = init;
  
