import { AnimationClip, AnimationMixer, Clock, Euler, Group, LoopOnce, MathUtils, Mesh, MirroredRepeatWrapping, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Quaternion, QuaternionKeyframeTrack, Scene, ShaderMaterial, TextureLoader, Vector3, VectorKeyframeTrack, WebGLRenderer } from "three";
import { Water } from "./objects/water";
import { Sky } from "three/examples/jsm/objects/Sky";
import { addBackgroundBit, addChallengeRow, challengeRows, environmentBits, mothershipModel, objectsInit, rocketModel, starterBay } from "./game/objects";
import { crystalUiElement, levelIndicator, shieldUiElement, showLevelEndScreen, uiInit, updateLevelEndUI } from "./game/ui";

export const scene = new Scene();
export const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

export const destructionBits = new Array<Mesh>();
const sun = new Vector3();

const waterGeometry = new PlaneGeometry(10000, 10000);
const water = new Water(
    waterGeometry, {

    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new TextureLoader().load('static/normals/waternormals.jpeg', function (texture) {
        texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
    }),
    sunDirection: new Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
}
);

export const sceneConfiguration = {
    /// Whether the scene is ready (i.e.: All models have been loaded and can be used)
    ready: false,
    /// Whether the camera is moving from the beginning circular pattern to behind the ship
    cameraMovingToStartPosition: false,
    /// Whether the rocket is moving forward
    rocketMoving: false,
    // backgroundMoving: false,
    /// Collected game data
    data: {
        /// How many crystals the player has collected on this run
        crystalsCollected: 0,
        /// How many shields the player has collected on this run (can be as low as -5 if player hits rocks)
        shieldsCollected: 0,
    },
    /// The length of the current level, increases as levels go up
    courseLength: 500,
    /// How far the player is through the current level, initialises to zero.
    courseProgress: 0,
    /// Whether the level has finished
    levelOver: false,
    /// The current level, initialises to one.
    level: 1,
    /// Gives the completion amount of the course thus far, from 0.0 to 1.0.
    coursePercentComplete: () => (sceneConfiguration.courseProgress / sceneConfiguration.courseLength),
    /// Whether the start animation is playing (the circular camera movement while looking at the ship)
    cameraStartAnimationPlaying: false,
    /// How many 'background bits' are in the scene (the cliffs)
    backgroundBitCount: 0,
    /// How many 'challenge rows' are in the scene (the rows that have rocks, shields, or crystals in them).
    challengeRowCount: 0,
    /// The current speed of the ship
    speed: 0.0
}


let renderer: WebGLRenderer;


const init = () => {
    renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    // Set up variables to control the look of the sky
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 3,
        azimuth: 115
    };

    const pmremGenerator = new PMREMGenerator(renderer);

    const phi = MathUtils.degToRad(90 - parameters.elevation);
    const theta = MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    (water.material as ShaderMaterial).uniforms['sunDirection'].value.copy(sun).normalize();
    scene.environment = pmremGenerator.fromScene(sky as any).texture;

    (water.material as ShaderMaterial).uniforms['speed'].value = 0.0;

    rocketModel.scale.setScalar(0.3);
    scene.add(rocketModel);
    scene.add(mothershipModel);

    mothershipModel.position.y = 200;
    mothershipModel.position.z = 100;
    mothershipModel.scale.setScalar(15);
    sceneConfiguration.ready = true;
}

export const sceneSetup = (level: number) => {
    sceneConfiguration.challengeRowCount = 0;
    sceneConfiguration.backgroundBitCount = 0;

    camera.position.x = 15;
    camera.position.y = 12;
    camera.position.z = 50;
    camera.rotation.y = 2.5;

    scene.add(starterBay);
    starterBay.position.x = 10;
    starterBay.position.z = 120;

    rocketModel.rotation.x = Math.PI;
    rocketModel.rotation.z = Math.PI;

    rocketModel.position.y = 10;
    rocketModel.position.z = 70;

    challengeRows.forEach(x => {
        scene.remove(x.rowParent);
    });

    environmentBits.forEach(x => {
        scene.remove(x);
    });

    environmentBits.length = 0;
    challengeRows.length = 0;

    for (let i=0; i< 60; i++){
        addChallengeRow(i);
        addBackgroundBit(i);
    }

    sceneConfiguration.cameraStartAnimationPlaying = false;
    sceneConfiguration.levelOver = false;
    rocketModel.userData.flyingAway = false;

    sceneConfiguration.courseProgress = 0;
    sceneConfiguration.courseLength = 1000 * level;

    sceneConfiguration.data.shieldsCollected = 0;
    sceneConfiguration.data.crystalsCollected = 0;

    crystalUiElement.innerText = String(sceneConfiguration.data.crystalsCollected);
    shieldUiElement.innerText = String(sceneConfiguration.data.shieldsCollected);

    levelIndicator.innerText = `LEVEL ${sceneConfiguration.level}`;

    sceneConfiguration.ready = true;
}

export const endLevel = (damaged: boolean) => {
    updateLevelEndUI(damaged);
    sceneConfiguration.rocketMoving = false;
    sceneConfiguration.levelOver = true;
    rocketModel.userData.flyingAway = true;
    destructionBits.forEach(x => {
        scene.remove(x);
    });
    destructionBits.length = 0;

    // make the camera look at the rocket before it flies away

    let cubeLook = new Group();
    let rocketPositionCopy = rocketModel.position.clone();
    cubeLook.position.copy(rocketPositionCopy);
    cubeLook.lookAt(rocketModel.position);
    let lookAtRocketQuaternion = cubeLook.quaternion;

    let cameraRotationTrack = new QuaternionKeyframeTrack('.quaternion', [0, 2], [
        camera.quaternion.x,
        camera.quaternion.y,
        camera.quaternion.z,
        camera.quaternion.w,
        lookAtRocketQuaternion.x,
        lookAtRocketQuaternion.y,
        lookAtRocketQuaternion.z,
        lookAtRocketQuaternion.w,
    ])

    const lookAtRocketAnimationClip = new AnimationClip('lookAtRocket', 2, [cameraRotationTrack]);
    const lookAtRocketAnimationAction = camera.userData.mixer.clipAction(lookAtRocketAnimationClip);
    lookAtRocketAnimationAction.setLoop(LoopOnce, 1);
    lookAtRocketAnimationAction.clampWhenFinished = true;
    lookAtRocketAnimationAction.play();

    rocketModel.userData.mixer = new AnimationMixer(rocketModel);
    let track = new VectorKeyframeTrack('.position', [2, 3, 5], [
        rocketModel.position.x, rocketModel.position.y, rocketModel.position.z,
        20, 100, 20,
        40, 400, 100
    ]);

    let destinationQuaternion = new Quaternion().setFromEuler(new Euler(-90, 0, -90))

    let rotationTrack = new QuaternionKeyframeTrack('.quaternion', [0, 2], [
        rocketModel.quaternion.x,
        rocketModel.quaternion.y,
        rocketModel.quaternion.z,
        rocketModel.quaternion.w,
        destinationQuaternion.x,
        destinationQuaternion.y,
        destinationQuaternion.z,
        destinationQuaternion.w
    ]);

    rocketModel.userData.clock = new Clock();

    const animationClip = new AnimationClip('flyAway', 6, [track, rotationTrack]);
    const animationAction = rocketModel.userData.mixer.clipAction(animationClip);
    animationAction.setLoop(LoopOnce, 1);
    animationAction.clampWhenFinished = true;

    rocketModel.userData.mixer.addEventListener('finished', function () {
        showLevelEndScreen();
    });
    animationAction.play();
}

const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

objectsInit().then(x => {
    uiInit();
    init();
})

animate()
