import {Group, MathUtils, Object3D} from "three";
import {scene, sceneConfiguration} from "../game";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {setProgress} from "./ui";

export const environmentBits = new Array<Object3D>();

export const challengeRows = new Array<ChallengeRow>();
export let rocketModel: Object3D;
export let starterBay: Group;
export let mothershipModel: Group;
export let cliffsModel: Object3D;
export let crystalModel: Object3D;
export let rockModel: Object3D;
export let shieldModel: Object3D;

const gltfLoader = new GLTFLoader();


const rocketGLTF = 'static/models/rocket/scene.gltf';
const cliffsGLTF = 'static/models/cliffs/scene.gltf';
const crystalsGLTF = 'static/models/glowing_crystals/scene.gltf';
const rockGLTF = 'static/models/glowing_rock/scene.gltf';
const shieldGLTF = 'static/models/shield_item/scene.gltf';
const starterBayGLTF = 'static/models/start_bay/scene.gltf';
const mothershipGLTF = 'static/models/spaceship_nortend/scene.gltf';

export const objectsInit = async () => {
    cliffsModel = (await gltfLoader.loadAsync(cliffsGLTF)).scene.children[0];
    setProgress('Loading energy crystal model...');
    crystalModel = (await gltfLoader.loadAsync(crystalsGLTF)).scene.children[0];
    setProgress('Loading rock model...');
    rockModel = (await gltfLoader.loadAsync(rockGLTF)).scene.children[0];
    setProgress('Loading shield model...');
    shieldModel = (await gltfLoader.loadAsync(shieldGLTF)).scene.children[0];
    setProgress('Loading rocket model ...');
    rocketModel = (await gltfLoader.loadAsync(rocketGLTF)).scene.children[0];
    setProgress('Loading starter bay...');
    starterBay = (await gltfLoader.loadAsync(starterBayGLTF)).scene;
    setProgress('Loading mothership...');
    mothershipModel = (await gltfLoader.loadAsync(mothershipGLTF)).scene;
}

export const addBackgroundBit = (count: number, horizonSpawn: boolean = false) => {
    // If we're spawning on the horizon, always spawn at a position far away from the player
    // Otherwise, place the rocks at certain intervals into the distance-
    let zOffset = (horizonSpawn ? -1400 : -(60 * count));
    // Create a copy of our original rock model
    let thisRock = cliffsModel.clone();
    // Set the scale appropriately for the scene
    thisRock.scale.set(0.02, 0.02, 0.02);
    // If the row that we're adding is divisble by two, place the rock to the left of the user
    // otherwise, place it to the right of the user.
    thisRock.position.set(count % 2 == 0 ? 60 - Math.random() : -60 - Math.random(), 0, zOffset);
    // Rotate the rock to a better angle
    thisRock.rotation.set(MathUtils.degToRad(-90), 0, Math.random());
    // Finally, add the rock to the scene
    scene.add(thisRock);
    // Add the rock to the beginning of the environmentBits array to keep track of them (so we can clean up later)
    environmentBits.unshift(thisRock);// add to beginning of array
}

export const addChallengeRow = (count: number, horizonSpawn: boolean = false) => {
    // Work out how far away this challenge row should be
    let zOffset = (horizonSpawn ? -1400 : -(count * 60));
    // Create a Group for the objects. This will be the parent for these objects.
    let rowGroup = new Group();
    rowGroup.position.z = zOffset;
    for (let i = 0; i < 5; i++) {
        // Calculate a random number between 1 and 10
        const random = Math.random() * 10;

        // If it's less than 2, create a crystal
        if (random < 2) {
            let crystal = addCrystal(i);
            rowGroup.add(crystal);

        }
        // If it's less than 4, spawn a rock
        else if (random < 4) {
            let rock = addRock(i);
            rowGroup.add(rock);
        }
       // but if it's more than 9, spawn a shield
        else if (random > 9) {
            let shield = addShield(i);
            rowGroup.add(shield);
        }
    }
    // Add the row to the challengeRows array to keep track of it, and so we can clean them up later
    challengeRows.unshift({rowParent: rowGroup, index: sceneConfiguration.challengeRowCount++});
    // Finally add the row to the scene
    scene.add(rowGroup);
}
const addCrystal = (rowCell: number) => {
    let crystal = crystalModel.clone();
    // crystal.position.z = zOffset;
    crystal.position.x = rowCell * 11 - 20;
    crystal.scale.set(0.02, 0.02, 0.02);
    crystal.userData.objectType = ObjectType.CRYSTAL;
    return crystal;
}
const addRock = (rowCell: number) => {
    let rock = rockModel.clone();
    rock.position.x = rowCell * 11 - 20;
    rock.scale.set(5, 5, 5);
    rock.position.setY(5);
    rock.userData.objectType = ObjectType.ROCK;
    return rock;
}
const addShield = (rowCell: number) => {
    let shield = shieldModel.clone();
    shield.position.x = rowCell * 11 - 20;
    shield.position.y = 8;
    shield.userData.objectType = ObjectType.SHIELD_ITEM;
    return shield;
}

export enum ObjectType {
    ROCK,
    CRYSTAL,
    SHIELD_ITEM
}

interface ChallengeRow {
    index: number;
    rowParent: Group;
}
