import {Vector3} from "three";
import {rocketModel} from "./objects";
import {destructionBits, scene} from "../game";


export const moveCollectedBits = () => {
    for (let i = 0; i < destructionBits.length; i++) {
        let bit = destructionBits[i];
        if (bit.userData.lifetime > 500) {
            scene.remove(bit);
            destructionBits.splice(i, 1);
        } else {
            let target = rocketModel.position;
            let targetNormalizedVector = new Vector3(0, 0, 0);
            targetNormalizedVector.x = target.x - bit.position.x;
            targetNormalizedVector.y = target.y - bit.position.y;
            targetNormalizedVector.z = target.z - bit.position.z;
            targetNormalizedVector.normalize();
            bit.translateOnAxis(targetNormalizedVector, 0.8);
            bit.userData.lifetime++;
        }


    }
    // console.log(`tracking ${destructionBits.length}`);
}
