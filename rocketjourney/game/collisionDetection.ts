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
    // If the level is over, don't detect collisions
    if (sceneConfiguration.levelOver) return;
    // Using the dimensions of our rocket, create a box that is the width and height of our model
    // This box doesn't appear in the world, it's merely a set of coordinates that describe the box
    // in world space.
    const rocketBox = new Box3().setFromObject(rocketModel);
    // For every challange row that we have on the screen...
    challengeRows.forEach(x => {
        // ...update the global position matrix of the row, and its children.
        x.rowParent.updateMatrixWorld();
        // Next, for each object within each challenge row...
        x.rowParent.children.forEach(y => {
            y.children.forEach(z => {
                // ...create a box that is the width and height of the object
                const box = new Box3().setFromObject(z);
                // Check if the box with the obstacle overlaps (or intersects with) our rocket
                if (box.intersectsBox(rocketBox)) {
                    // If it does, get the center position of that box
                    let destructionPosition = box.getCenter(z.position);
                    // Queue up the destruction animation to play (the boxes flying out from the rocket)
                    playDestructionAnimation(destructionPosition);
                    // Remove the object that has been hit from the parent
                    // This removes the object from the scene
                    y.remove(z);
                    // Now, we check what it was that we hit, whether it was a rock, shield, or crystal
                    if (y.userData.objectType !== undefined) {
                        let type = y.userData.objectType as ObjectType;
                        switch (type) {
                            // If it was a rock...
                            case ObjectType.ROCK:
                                // ...remove one shield from the players' score
                                sceneConfiguration.data.shieldsCollected--;
                                // Update the UI with the new count of shields
                                shieldUiElement.innerText = String(sceneConfiguration.data.shieldsCollected);
                                // If the player has less than 0 shields...
                                if (sceneConfiguration.data.shieldsCollected <= 0) {
                                    // ...add the 'danger' CSS class to make the text red (if it's not already there)
                                    if (!shieldUiElement.classList.contains('danger')) {
                                        shieldUiElement.classList.add('danger');
                                    }
                                } else { //Otherwise, if it's more than 0 shields, remove the danger CSS class
                                    // so the text goes back to being white
                                    shieldUiElement.classList.remove('danger');
                                }

                                // If the ship has sustained too much damage, and has less than -5 shields...
                                if (sceneConfiguration.data.shieldsCollected <= -5) {
                                    // ...end the scene
                                    endLevel(true);
                                }
                                break;
                            // If it's a crystal...
                            case ObjectType.CRYSTAL:
                                // Update the UI with the new count of crystals, and increment the count of
                                // currently collected crystals
                                crystalUiElement.innerText = String(++sceneConfiguration.data.crystalsCollected);
                                break;
                            // If it's a shield...
                            case ObjectType.SHIELD_ITEM:
                                // Update the UI with the new count of shields, and increment the count of
                                // currently collected shields
                                shieldUiElement.innerText = String(++sceneConfiguration.data.shieldsCollected);
                                break;
                        }
                    }
                }
            });
        })
    });
}
const playDestructionAnimation = (spawnPosition: Vector3) => {

    // Create six boxes
    for (let i = 0; i < 6; i++) {
        // Our destruction 'bits' will be black, but have some transparency to them
        let destructionBit = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({
            color: 'black',
            transparent: true,
            opacity: 0.4
        }));

        // Each destruction bit object within the scene will have a 'lifetime' property associated to it
        // This property is incremented every time a frame is drawn to the screen
        // Within our animate loop, we check if this is more than 500, and if it is, we remove the object
        destructionBit.userData.lifetime = 0;
        // Set the spawn position of the box
        destructionBit.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
        // Create an animation mixer for the object
        destructionBit.userData.mixer = new AnimationMixer(destructionBit);

        // Spawn the objects in a circle around the rocket
        let degrees = i / 45;

        // Work out where on the circle we should spawn this specific destruction bit
        let spawnX = Math.cos(radToDeg(degrees)) * 15;
        let spawnY = Math.sin(radToDeg(degrees)) * 15;

        // Create a VectorKeyFrameTrack that will animate this box from its starting position to the final
        // 'outward' position (so it looks like the boxes are exploding from the ship)
        let track = new VectorKeyframeTrack('.position', [0, 0.3], [
            rocketModel.position.x, // x 1
            rocketModel.position.y, // y 1
            rocketModel.position.z, // z 1
            rocketModel.position.x + spawnX, // x 2
            rocketModel.position.y, // y 2
            rocketModel.position.z + spawnY, // z 2
        ]);

        // Create an animation clip with our VectorKeyFrameTrack
        const animationClip = new AnimationClip('animateIn', 10, [track]);
        const animationAction = destructionBit.userData.mixer.clipAction(animationClip);

        // Only play the animation once
        animationAction.setLoop(LoopOnce, 1);

        // When complete, leave the objects in their final position (don't reset them to the starting position)
        animationAction.clampWhenFinished = true;
        // Play the animation
        animationAction.play();
        // Associate a Clock to the destruction bit. We use this within the render loop so ThreeJS knows how far
        // to move this object for this frame
        destructionBit.userData.clock = new Clock();
        // Add the destruction bit to the scene
        scene.add(destructionBit);

        // Add the destruction bit to an array, to keep track of them
        destructionBits.push(destructionBit);
    }
}
