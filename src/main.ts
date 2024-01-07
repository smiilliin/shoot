import * as PIXI from "pixi.js";
import { Player, Vector2, World, getMapVectorFromScreen } from "./game";

const app = new PIXI.Application({
  background: "#000000",
  resizeTo: window,
});

document.body.appendChild(app.view as HTMLCanvasElement);

app.stage.eventMode = "static";
app.stage.hitArea = app.screen;

const view = new PIXI.Container();

app.stage.addChild(view);

const pressedKeys: string[] = [];

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (pressedKeys.indexOf(key) == -1) {
    pressedKeys.push(key);
  }
});
window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  const index = pressedKeys.indexOf(key);

  if (index != -1) {
    pressedKeys.splice(index, 1);
  }
});

app.stage.on("wheel", (event) => {
  view.scale.x *= 1 - event.deltaY / 1000;
  view.scale.y *= 1 - event.deltaY / 1000;

  if (view.scale.x < 0.3) {
    view.scale.x = 0.3;
    view.scale.y = 0.3;
    return;
  }
  if (view.scale.x > 5) {
    view.scale.x = 5;
    view.scale.y = 5;
    return;
  }
});
const player = new Player();
view.addChild(player);

app.stage.on("mousemove", (event) => {
  player.lookat(getMapVectorFromScreen(new Vector2(event.x, event.y), view));
});
const world = new World(view, player);

const movementSpeed = 5;

app.ticker.add(() => {
  if (!player.dead) {
    if (pressedKeys.indexOf("a") != -1) {
      player.x -= movementSpeed;
    }
    if (pressedKeys.indexOf("d") != -1) {
      player.x += movementSpeed;
    }
    if (pressedKeys.indexOf("w") != -1) {
      player.y -= movementSpeed;
    }
    if (pressedKeys.indexOf("s") != -1) {
      player.y += movementSpeed;
    }
    if (pressedKeys.indexOf(" ") != -1) {
      player.shoot(world);
    }
  }

  world.tick();

  view.x = -player.x * view.scale.x + window.innerWidth / 2;
  view.y = -player.y * view.scale.y + window.innerHeight / 2;
});
