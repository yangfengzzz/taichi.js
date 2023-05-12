import { Field } from "../../data/Field";
import { SetImage } from "./SetImage";
import { Texture } from "../../data/Texture";
import { DepthTexture } from "../../data/Texture";

export class Canvas {
  constructor(public htmlCanvas: HTMLCanvasElement) {
    this.setImageObj = new SetImage(htmlCanvas);
  }

  private setImageObj: SetImage;

  async setImage(image: Field | Texture | DepthTexture) {
    await this.setImageObj.render(image);
  }
}
