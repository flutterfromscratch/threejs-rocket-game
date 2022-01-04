import {
    AnimationClip,
    AnimationMixer,
    Box3,
    BoxGeometry,
    Clock,
    LoopOnce,
    Mesh,
    MeshBasicMaterial,
    Vector3,
    VectorKeyframeTrack
} from "three";
import {challengeRows, ObjectType, rocketModel} from "./objects";
import {crystalUiElement, shieldUiElement} from "./ui";
import {radToDeg} from "three/src/math/MathUtils";
import {destructionBits, endLevel, scene, sceneConfiguration} from "../game";

export const detectCollisions = () => {
    if (sceneConfiguration.levelOver) return; // don't detect collisions when the level is over
    // rocketBoundingBox.geometry.computeBoundingBox();
    // rocketBoundingBox.updateMatrixWorld();
    const rocketBox = new Box3().setFromObject(rocketModel);
    challengeRows.forEach(x => {
        x.rowParent.updateMatrixWorld();
        // console.log(x.rowParent.children);
        x.rowParent.children.forEach(y => {
            y.children.forEach(z => {
                const box = new Box3().setFromObject(z);
                if (box.intersectsBox(rocketBox)) {
                    // console.log('collision!');
                    let destructionPosition = box.getCenter(z.position);
                    playDestructionAnimation(destructionPosition);
                    y.remove(z);
                    if (y.userData.objectType !== undefined) {
                        let type = y.userData.objectType as ObjectType;
                        switch (type) {
                            case ObjectType.ROCK:
                                // if (sceneConfiguration.data.shieldsCollected > 0) {
                                sceneConfiguration.data.shieldsCollected--;
                                shieldUiElement.innerText = String(sceneConfiguration.data.shieldsCollected);
                                if (sceneConfiguration.data.shieldsCollected <= 0) {
                                    if (!shieldUiElement.classList.contains('danger')) {
                                        shieldUiElement.classList.add('danger');
                                    }
                                } else {
                                    shieldUiElement.classList.remove('danger');
                                }

                                // }
                                if (sceneConfiguration.data.shieldsCollected <= -5) {
                                    endLevel(true);
                                }
                                break;
                            case ObjectType.CRYSTAL:
                                crystalUiElement.innerText = String(++sceneConfiguration.data.crystalsCollected);
                                break;
                            case ObjectType.SHIELD_ITEM:
                                shieldUiElement.innerText = String(++sceneConfiguration.data.shieldsCollected);
                                break;
                        }
                    }
                    // playDestructionAnimation()
                    // scene.remove(z);
                }
            });
        })
    });
}
const playDestructionAnimation = (spawnPosition: Vector3) => {
    for (let i = 0; i < 6; i++) {
        // let group = new Group();
        let destructionBit = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({
            color: 'black',
            transparent: true,
            opacity: 0.4
        }));
        destructionBit.userData.lifetime = 0;
        destructionBit.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
        // group.add(destructionBit);
        destructionBit.userData.mixer = new AnimationMixer(destructionBit);
        // let mixer =

        let degrees = i / 45;

        let spawnX = Math.cos(radToDeg(degrees)) * 15;
        let spawnY = Math.sin(radToDeg(degrees)) * 15;


        let track = new VectorKeyframeTrack('.position', [0, 0.3], [
            rocketModel.position.x, // x 3
            rocketModel.position.y, // y 3
            rocketModel.position.z, // z 3
            rocketModel.position.x + spawnX, // x 2
            rocketModel.position.y, // y 2
            rocketModel.position.z + spawnY, // z 2
        ]);

        const animationClip = new AnimationClip('animateIn', 10, [track]);
        const animationAction = destructionBit.userData.mixer.clipAction(animationClip);
        animationAction.setLoop(LoopOnce, 1);
        animationAction.clampWhenFinished = true;
        animationAction.play();
        destructionBit.userData.clock = new Clock();
        destructionBit.userData.mixer.addEventListener('finished', function () {
            // console.log('finished animating destruction bit');
            // this.userData.animating = true;
        });

        scene.add(destructionBit);

        destructionBits.push(destructionBit);

    }
}
