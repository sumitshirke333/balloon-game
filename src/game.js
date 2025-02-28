const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#3498db",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
    },
  },
  scale: {
    mode: Phaser.Scale.Between,
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};
const game = new Phaser.Game(config);
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
let balloons = [];
let balloonIndex = 1;
const maxBalloonScale = 0.4;
const inflationAmount = 0.01;
const pumpPosition = { x: screenWidth - 100, y: screenHeight - 10 };
const maxBalloonsOnCanvas = 4;
let isInflating = false;
let pumpBody, pumpHandle, outputHandle;
let pumpAnimation;
let lastLetterIndex = -1;
const safeDistance = 200;

function preload() {
  this.load.image("background", "/graphics/Symbol 3 copy.png");
  this.load.image("particle", "/graphics/star.png");

  for (let i = 1; i <= 10; i++) {
    const balloonNumber = i < 10 ? `10000${i}` : `1000${i}`;
    this.load.image(`balloon${i}`, `/graphics/Symbol ${balloonNumber}.png`);
  }

  for (let i = 1; i <= 26; i++) {
    const letterNumber = i < 10 ? `1000${i}` : `100${i}`;
    this.load.image(`letter${i}`, `/graphics/Symbol ${letterNumber}.png`);
  }
  this.load.image("rope", "/graphics/Symbol 100011.png");

  this.load.image("pumpHandle", "/graphics/Symbol 320001.png");
  this.load.image("pumpBody", "/graphics/Symbol 320003.png");
  this.load.image("outputHandle", "/graphics/Symbol 320002.png");
  this.load.image("cloudImage", "/graphics/Symbol 27.png");
}

function create() {
  this.add
    .image(config.width / 2, config.height / 2, "background")
    .setOrigin(0.5, 0.5)
    .setDisplaySize(config.width, config.height);

  pumpBody = this.add
    .image(pumpPosition.x, pumpPosition.y + 20, "pumpBody")
    .setOrigin(0.5, 1)
    .setScale(0.5)
    .setDepth(1);
  pumpHandle = this.add
    .image(pumpPosition.x, pumpPosition.y - 120, "pumpHandle")
    .setOrigin(0.5, 1)
    .setScale(0.5)
    .setDepth(0);
  outputHandle = this.add
    .image(pumpPosition.x - 150, pumpPosition.y - 20, "outputHandle")
    .setOrigin(0.5, 1)
    .setScale(0.5)
    .setDepth(1);

  pumpBody.setInteractive();
  pumpBody.on("pointerdown", () => {
    inflateBalloon.call(this);
    animatePump.call(this);
  });

  pumpBody.on("pointerup", () => {
    if (pumpAnimation) {
      pumpAnimation.stop();
    }

    pumpHandle.setY(pumpPosition.y - 120);
    pumpBody.setY(pumpPosition.y + 20);
  });
  const cloud = this.add
    .image(pumpPosition.x, pumpPosition.y + 125, "cloudImage")
    .setOrigin(0.5, 1)
    .setScale(0.6)
    .setDepth(0);

  this.input.on("pointerdown", (pointer) => {
    for (let i = 0; i < balloons.length; i++) {
      if (
        balloons[i].isFlying &&
        balloons[i].getBounds().contains(pointer.x, pointer.y)
      ) {
        burstBalloon.call(this, i);
        break;
      }
    }
  });
}

function update() {
  for (let i = 0; i < balloons.length; i++) {
    if (balloons[i].isFlying && balloons[i].body) {
      if (balloons[i].rope) {
        balloons[i].rope.setPosition(balloons[i].x, balloons[i].y + 16);
      }

      balloons[i].body.setVelocityX(
        balloons[i].body.velocity.x + Phaser.Math.Between(-10, 10)
      );
      balloons[i].body.setVelocityY(
        balloons[i].body.velocity.y + Phaser.Math.Between(-5, 5)
      );

      balloons[i].alphabet.setPosition(balloons[i].x, balloons[i].y);
    }
  }
}

function inflateBalloon() {
  if (!isInflating) {
    isInflating = true;

    let currentBalloon =
      balloons.length > 0 ? balloons[balloons.length - 1] : null;

    if (
      !currentBalloon ||
      currentBalloon.isFlying ||
      currentBalloon.clicks >= 4
    ) {
      currentBalloon = this.add
        .image(
          pumpPosition.x - 209,
          pumpPosition.y - 244,
          `balloon${balloonIndex}`
        )
        .setVisible(true);
      currentBalloon.setScale(0.1);
      currentBalloon.clicks = 0;
      currentBalloon.isFlying = false;

      this.physics.add.existing(currentBalloon);
      if (currentBalloon.body) {
        currentBalloon.body.setCollideWorldBounds(true);
      }

      lastLetterIndex = (lastLetterIndex + 1) % 26;
      const alphabet = this.add
        .image(
          currentBalloon.x,
          currentBalloon.y,
          `letter${lastLetterIndex + 1}`
        )
        .setOrigin(0.5, 0.5)
        .setScale(0.02);

      currentBalloon.alphabet = alphabet;
      balloons.push(currentBalloon);

      balloonIndex = (balloonIndex % 10) + 1;
    }

    if (currentBalloon.clicks < 4) {
      currentBalloon.clicks++;
      inflateBalloonAnimation.call(
        this,
        currentBalloon,
        currentBalloon.alphabet
      );
    }
  }
}

function inflateBalloonAnimation(balloon, alphabet) {
  const newScale = 0.1 + balloon.clicks * 0.1;

  this.tweens.add({
    targets: [balloon, alphabet],
    scaleX: newScale,
    scaleY: newScale,
    duration: 200,
    onComplete: () => {
      if (balloon.clicks >= 4) {
        startFlying.call(this, balloon);
      } else {
        isInflating = false;
      }
    },
  });

  animatePump.call(this);
}

function animatePump() {
  if (pumpAnimation) {
    pumpAnimation.stop();
  }

  pumpAnimation = this.tweens.add({
    targets: pumpHandle,
    y: pumpHandle.y + 50,
    duration: 200,
    yoyo: true,
    onComplete: () => {
      pumpHandle.setY(pumpPosition.y - 0);
    },
  });

  this.tweens.add({
    targets: pumpBody,
    y: pumpBody.y + 10,
    duration: 200,
    yoyo: true,
    onComplete: () => {
      pumpBody.setY(pumpPosition.y + 0);
    },
  });
}

function startFlying(balloon) {
  balloon.setPosition(pumpPosition.x - 209, pumpPosition.y - 244);
  balloon.isFlying = true;

  const rope = this.add.image(balloon.x, balloon.y, "rope").setOrigin(0.5, 0);
  rope.setScale(0.4);

  balloon.rope = rope;

  this.physics.add.existing(balloon);
  if (balloon.body) {
    balloon.body.setCollideWorldBounds(true);
    balloon.body.setVelocity(0, -100);

    this.time.addEvent({
      delay: 2000,
      callback: changeDirection,
      callbackScope: this,
      args: [balloon],
    });

    isInflating = false;
  }
}

function changeDirection(balloon) {
  if (balloon && balloon.body) {
    const randomDirection = Phaser.Math.Between(-50, 50);
    balloon.body.setVelocityX(randomDirection);
    balloon.body.setVelocityY(-100);
  }
}

function burstBalloon(index) {
  const balloon = balloons[index];
  const rope = balloon.rope;

  createParticleEffect.call(this, balloon.x, balloon.y);

  if (rope) {
    rope.destroy();
  }

  balloon.alphabet.destroy();
  balloon.destroy();

  balloons.splice(index, 1);
}

function createParticleEffect(x, y) {
  const particles = this.add.particles("particle");

  const emitter = particles.createEmitter({
    speed: { min: 100, max: 300 },
    angle: { min: 0, max: 360 },
    gravityY: 200,
    scale: { start: 0.3, end: 0 },
    lifespan: 500,
    frequency: -1,
    quantity: 10,
    x: x,
    y: y,
  });

  emitter.explode(10, x, y);
}

window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;
});
