import * as PIXI from "pixi.js";

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  add(vector: Vector2) {
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }
  normalize() {
    return this.div(Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)));
  }
  substract(vector: Vector2) {
    return new Vector2(this.x - vector.x, this.y - vector.y);
  }
  mul(x: number) {
    return new Vector2(this.x * x, this.y * x);
  }
  div(x: number) {
    return new Vector2(this.x / x, this.y / x);
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
  compare(vector: Vector2) {
    return this.x == vector.x && this.y == vector.y;
  }
  set(vector: Vector2) {
    this.x = vector.x;
    this.y = vector.y;
  }
  floor() {
    return new Vector2(Math.floor(this.x), Math.floor(this.y));
  }
  ceil() {
    return new Vector2(Math.ceil(this.x), Math.ceil(this.y));
  }
  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}
const getMapVectorFromScreen = (vector: Vector2, view: PIXI.Container) => {
  return new Vector2(
    (vector.x - view.x) / view.scale.x,
    (vector.y - view.y) / view.scale.y
  );
};
enum ShooterType {
  Player,
  Enemy,
}
class Shooter extends PIXI.Graphics {
  radius: number;
  shootTime: number;
  uuid: string;
  shooterType: ShooterType;

  constructor() {
    super();
    this.rotation = Math.random() * 2 * Math.PI;
    this.radius = 30;
    this.shootTime = 0;
    this.uuid = crypto.randomUUID();
    this.shooterType = ShooterType.Enemy;

    this.beginFill(0xffffff);
    this.drawCircle(0, 0, this.radius);
    this.endFill();
  }
  shoot(world: World) {
    if (Date.now() - this.shootTime < 100) return;
    const bullet = new Bullet(this.rotation, this.shooterType);
    bullet.x = Math.cos(this.rotation) * (this.radius + 3) + this.x;
    bullet.y = Math.sin(this.rotation) * (this.radius + 3) + this.y;
    world.bullets.push(bullet);
    world.view.addChild(bullet);
    this.shootTime = Date.now();
  }
  move(movement: Vector2) {
    this.x += movement.x;
    this.y += movement.y;
  }
  getVector() {
    return new Vector2(this.x, this.y);
  }
  lookat(vector: Vector2) {
    const relativeVector = vector.substract(this.getVector());
    this.rotation = Math.atan2(relativeVector.y, relativeVector.x);
  }
  onDead() {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tick(world: World) {}
}
class Player extends Shooter {
  dead: boolean;
  constructor() {
    super();
    this.shooterType = ShooterType.Player;
    this.dead = false;
  }
  onDead() {
    this.dead = true;
  }
}
class ShooterBot extends Shooter {
  delayedShootTime: number;

  constructor(world: World) {
    super();
    this.delayedShootTime = 0;
    this.shooterType = ShooterType.Enemy;
    let baseX = Math.random() - 0.5;
    let baseY = Math.random() - 0.5;
    if (baseX < 0.25 && baseX >= 0) baseX += 0.2;
    if (baseX > -0.25 && baseX < 0) baseX -= 0.2;
    if (baseY < 0.25 && baseY >= 0) baseY += 0.2;
    if (baseY > -0.25 && baseY < 0) baseY -= 0.2;
    this.x = world.player.x + baseX * 6000;
    this.y = world.player.y + baseY * 6000;
  }
  tick(world: World) {
    this.move(
      world.player.getVector().substract(this.getVector()).normalize().mul(5)
    );
    this.lookat(world.player.getVector());

    if (Date.now() - this.delayedShootTime > 500) {
      this.delayedShootTime = Date.now();
      this.shoot(world);
    }
  }
}
class Bullet extends PIXI.Graphics {
  radius: number;
  speed: number;
  uuid: string;
  shooterType: ShooterType;
  constructor(rotation: number, shooterType: ShooterType) {
    super();
    this.rotation = rotation;
    this.radius = 8;
    this.speed = 10;
    this.uuid = crypto.randomUUID();
    this.shooterType = shooterType;

    this.beginFill(0xffffff);
    this.drawCircle(0, 0, this.radius);
    this.endFill();
  }
  isCollide(shooter: Shooter) {
    if (
      Math.pow(shooter.x - this.x, 2) + Math.pow(shooter.y - this.y, 2) <
        Math.pow(shooter.radius + this.radius, 2) &&
      shooter.shooterType != this.shooterType
    ) {
      return true;
    }
    return false;
  }
  tick(world: World) {
    this.x += Math.cos(this.rotation) * this.speed;
    this.y += Math.sin(this.rotation) * this.speed;

    const leftTop = getMapVectorFromScreen(new Vector2(0, 0), world.view);
    const rightBottom = getMapVectorFromScreen(
      new Vector2(window.innerWidth, window.innerHeight),
      world.view
    );

    if (
      this.x + this.radius < leftTop.x ||
      this.x - this.radius > rightBottom.x ||
      this.y + this.radius < leftTop.y ||
      this.y - this.radius > rightBottom.y
    ) {
      const index = world.bullets.findIndex((v) => v.uuid == this.uuid);
      if (index != -1) {
        world.view.removeChild(this);
        world.bullets.splice(index, 1);
      }
    }

    world.shooters.forEach(
      ((shooter: Shooter, index: number) => {
        if (this.isCollide(shooter)) {
          const thisIndex = world.bullets.findIndex((v) => v.uuid == this.uuid);
          if (thisIndex != -1) {
            world.view.removeChild(this);
            world.bullets.splice(thisIndex, 1);
          }
          shooter.onDead();
          world.view.removeChild(shooter);
          world.shooters.splice(index, 1);
        }
      }).bind(this)
    );
  }
}
class World {
  bullets: Bullet[];
  shooters: Shooter[];
  view: PIXI.Container;
  player: Player;

  constructor(view: PIXI.Container, player: Player) {
    this.bullets = [];
    this.shooters = [];
    this.view = view;
    this.player = player;

    for (let i = 0; i < 5; i++) {
      const shooter = new ShooterBot(this);

      this.shooters.push(shooter);
      view.addChild(shooter);
    }
    this.shooters.push(player);
  }
  tick() {
    this.bullets.forEach((bullet) => bullet.tick(this));
    this.shooters.forEach((shooter) => shooter.tick(this));

    if (this.shooters.length != 5) {
      for (let i = 0; i < 5 - this.shooters.length; i++) {
        const shooter = new ShooterBot(this);

        this.shooters.push(shooter);
        this.view.addChild(shooter);
      }
    }
  }
}

export { Shooter, Vector2, Bullet, World, Player, getMapVectorFromScreen };
