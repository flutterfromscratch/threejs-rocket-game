import {Group, MathUtils, Object3D} from "three";
import {scene, sceneConfiguration} from "../game";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {setProgress} from "./ui";

export const environmentBits = new Array<Object3D>();
export let cliffsModel: Object3D;
export let crystalModel: Object3D;
export let rockModel: Object3D;
export let shieldModel: Object3D;
export const challengeRows = new Array<ChallengeRow>();
export let rocketModel: Object3D;
export let starterBay: Group;

const gltfLoader = new GLTFLoader();


const rocketGLTF = 'static/models/rocket/scene.gltf';
const cliffsGLTF = 'static/models/cliffs/scene.gltf';
const crystalsGLTF = 'static/models/glowing_crystals/scene.gltf';
const rockGLTF = 'static/models/glowing_rock/scene.gltf';
const shieldGLTF = 'static/models/shield_item/scene.gltf';
const starterBayGLTF = 'static/models/start_bay/scene.gltf';

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
}

export const addBackgroundBit = (count: number, horizonSpawn: boolean = false) => {
    console.log('adding ' + count);
    let zOffset = (horizonSpawn ? -1400 : -(60 * count));
    let thisRock = cliffsModel.clone();
    // debugger;
    // debugger;
    thisRock.scale.set(0.02, 0.02, 0.02);
    thisRock.position.set(count % 2 == 0 ? 60 - Math.random() : -60 - Math.random(), 0, zOffset);
    thisRock.rotation.set(MathUtils.degToRad(-90), 0, Math.random());
    // thisRock.traverse((object => {
    //     if(object.isMesh)
    // }))
    // thisRock.castShadow = true;
    // thisRock.receiveShadow = true;
    // thisRock.traverse((object => obj))
    scene.add(thisRock);
    // environmentBits.push(thisRock);
    environmentBits.unshift(thisRock);// add to beginning of array
}
export const addChallengeRow = (count: number, horizonSpawn: boolean = false) => {
    console.log(`creating challenge row ${count}`);
    let zOffset = (horizonSpawn ? -1400 : -(count * 60));
    let rowGroup = new Group();
    rowGroup.position.z = zOffset;
    // let challengeRow = new Array<Object3D>();
    for (let i = 0; i < 5; i++) {
        const random = Math.random() * 10; // number between 1 and 10
        // let crystal = objectLoader(index, ObjectType.CRYSTAL);
        if (random < 2) {
            let crystal = addCrystal(i);

            // crystal.updateMatrixWorld();
            rowGroup.add(crystal);
            // challengeRow.push(addCrystal(challengeRowCount, i, zOffset));
        } else if (random < 4) {
            let rock = addRock(i);
            rowGroup.add(rock);
            // debugger;
            // let rock = add
        } else if (random > 9) {
            let shield = addShield(i);
            rowGroup.add(shield);
        }
    }
    challengeRows.unshift({rowParent: rowGroup, index: sceneConfiguration.challengeRowCount++});
    // debugger;
    scene.add(rowGroup);
}
const addCrystal = (rowCell: number) => {
    let crystal = crystalModel.clone();
    // crystal.position.z = zOffset;
    crystal.position.x = rowCell * 11 - 20;
    crystal.scale.set(0.02, 0.02, 0.02);
    // attachBoundingBox(`boundingBox-crystal-${rowCell}`, 10, crystal);
    // scene.add(crystal);
    crystal.userData.objectType = ObjectType.CRYSTAL;
    return crystal;
}
const addRock = (rowCell: number) => {
    let rock = rockModel.clone();
    rock.position.x = rowCell * 11 - 20;
    rock.scale.set(5, 5, 5);
    rock.position.setY(5);
    // rock.castShadow = true;
    // rock.receiveShadow = true;
    rock.userData.objectType = ObjectType.ROCK;
    // attachBoundingBox(`boundingBox-rock-${rowCell}`, 8, rock);
    // rock.scale.set(0.02, 0.02, 0.02);
    return rock;
}
const addShield = (rowCell: number) => {
    let shield = shieldModel.clone();
    shield.position.x = rowCell * 11 - 20;
    shield.position.y = 8;
    shield.userData.objectType = ObjectType.SHIELD_ITEM;
    // attachBoundingBox(`boundingBox-shield-${rowCell}`, 10, shield);
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
    // zOffset: number;

}
