import { matrix, struct, vector } from "../api/Types";
import { add, lookAt, matmul, mul, normalized, perspective } from "../api/KernelScopeBuiltin";
import { f32 } from "../api/Kernels";

export class Camera {
  constructor(
    public position: number[],
    public direction: number[],
    public up: number[] = [0.0, 1.0, 0.0],
    public fov: number = 45,
    public near: number = 0.1,
    public far: number = 1000
  ) {}
  public view: number[][] = [];
  public projection: number[][] = [];
  public viewProjection: number[][] = [];

  computeMatrices(aspectRatio: number) {
    this.view = lookAt(this.position, add(this.position, this.direction), this.up);
    this.projection = perspective(this.fov, aspectRatio, this.near, this.far);
    this.viewProjection = matmul(this.projection, this.view);
  }

  static getKernelType(): any {
    return struct({
      position: vector(f32, 3),
      direction: vector(f32, 3),
      up: vector(f32, 3),
      fov: f32,
      near: f32,
      far: f32,
      view: matrix(f32, 4, 4),
      projection: matrix(f32, 4, 4),
      viewProjection: matrix(f32, 4, 4)
    });
  }
  track(canvas: HTMLCanvasElement, yawSpeed: number = 2, pitchSpeed: number = 2, movementSpeed: number = 0.01) {
    let vecToEuler = (v: number[]) => {
      v = normalized(v);
      let pitch = Math.asin(v[1]);
      let sinYaw = -v[0] / Math.cos(pitch);
      let cosYaw = -v[2] / Math.cos(pitch);
      let eps = 1e-6;
      let yaw: number;
      if (Math.abs(sinYaw) < eps) {
        yaw = 0.0;
      } else {
        yaw = Math.acos(cosYaw);
        if (sinYaw < 0) {
          yaw = -yaw;
        }
      }
      return [yaw, pitch];
    };
    let eulerToVec = (yaw: number, pitch: number) => {
      let v = [0.0, 0.0, 0.0];
      v[0] = -Math.sin(yaw) * Math.cos(pitch);
      v[1] = Math.sin(pitch);
      v[2] = -Math.cos(yaw) * Math.cos(pitch);
      return v;
    };
    let mouseIsDown = false;
    let lastX = 0.0;
    let lastY = 0.0;
    canvas.onmousedown = (ev: MouseEvent) => {
      mouseIsDown = true;
      lastX = ev.offsetX / canvas.width;
      lastY = ev.offsetY / canvas.height;
    };
    canvas.onmouseup = (ev: MouseEvent) => {
      mouseIsDown = false;
    };
    canvas.onmousemove = (ev: MouseEvent) => {
      if (mouseIsDown) {
        let currX = ev.offsetX / canvas.width;
        let currY = ev.offsetY / canvas.height;

        let dx = currX - lastX;
        let dy = currY - lastY;

        let [yaw, pitch] = vecToEuler(normalized(this.direction));
        yaw += dx * yawSpeed;
        pitch += dy * pitchSpeed;

        let pitchLimit = (Math.PI / 2) * 0.99;
        if (pitch > pitchLimit) {
          pitch = pitchLimit;
        }
        if (pitch < -pitchLimit) {
          pitch = -pitchLimit;
        }
        this.direction = eulerToVec(yaw, pitch);

        lastX = currX;
        lastY = currY;
      }
    };
    canvas.onwheel = (ev: WheelEvent) => {
      this.position = add(this.position, mul(this.direction, -ev.deltaY * movementSpeed));
    };
  }
}
