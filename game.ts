// import * as THREE from 'three'
import {
    AnimationClip,
    AnimationMixer,
    Clock,
    Euler,
    Group,
    HemisphereLight,
    InterpolateSmooth,
    LoopOnce,
    MathUtils,
    Mesh,
    MirroredRepeatWrapping,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    Quaternion,
    QuaternionKeyframeTrack,
    Scene,
    SpotLight,
    TextureLoader,
    Vector3,
    VectorKeyframeTrack,
    WebGLRenderer,
} from 'three';

import {Water} from './objects/water'
import {Sky} from "three/examples/jsm/objects/Sky";
import * as joystick from 'nipplejs';
import {JoystickManager} from 'nipplejs';
import {garbageCollector} from "./game/garbageCollector";
import {moveCollectedBits} from "./game/physics";
import {
    crystalUiElement,
    nextLevel,
    nextLevelButton,
    progressUiElement,
    setProgress,
    shieldUiElement,
    showLevelEndScreen,
    startGameButton,
    uiInit,
    updateLevelEndUI
} from './game/ui';
import {
    addBackgroundBit,
    addChallengeRow,
    challengeRows,
    environmentBits,
    objectsInit,
    rocketModel,
    starterBay
} from "./game/objects";
import {isTouchDevice} from "./isTouchDevice";
import {detectCollisions} from "./game/collisionDetection";
// const sceneClock = new Clock();


export const scene = new Scene()

export const destructionBits = new Array<Mesh>();

export const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
)

let angle = 0.00;

let positionOffset = 0.0;

let renderer: WebGLRenderer;

let joystickManager: JoystickManager | null;
const waterGeometry = new PlaneGeometry(10000, 10000);


const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new TextureLoader().load('static/normals/waternormals.jpeg', function (texture) {

            texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
            // texture.offset = new Vector2(speed, speed);

        }),
        sunDirection: new Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
) as any;

let distance = 0.0;
let leftPressed = false;
let rightPressed = false;


const sun = new Vector3();
const light = new HemisphereLight(0xffffff, 0x444444, 1.0);
light.position.set(0, 1, 0);
scene.add(light);

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


window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

uiInit();
objectsInit();

const animate = () => {
    requestAnimationFrame(animate);
    if (leftPressed) {
        // console.log(rocketModel.position.x);
        rocketModel.position.x -= 0.5;
    }
    if (rightPressed) {
        rocketModel.position.x += 0.5;
    }

    if (sceneConfiguration.rocketMoving) {
        progressUiElement.style.width = String(sceneConfiguration.coursePercentComplete() * 200) + 'px';
        sceneConfiguration.speed += 0.001;
        sceneConfiguration.courseProgress += sceneConfiguration.speed;
        console.log();
        distance += sceneConfiguration.speed;

        garbageCollector();
    }


    if (sceneConfiguration.ready) {
        if (rocketModel.userData?.mixer != null) {
            // debugger;
            rocketModel.userData?.mixer?.update(rocketModel.userData.clock.getDelta());
        }

        if (!sceneConfiguration.cameraStartAnimationPlaying) {
            camera.position.x = 20 * Math.cos(angle);
            camera.position.z = 20 * Math.sin(angle);
            camera.position.y = 30;
            // camera.position.y += 40;
            camera.lookAt(rocketModel.position);
            angle += 0.005;
        }
        if (sceneConfiguration.levelOver) {
            if (sceneConfiguration.speed > 0) {
                sceneConfiguration.speed -= 0.1;
            }
        }
        rocketModel.position.x += positionOffset;
        rocketModel.position.x = clamp(rocketModel.position.x, -20, 25);

        renderer.render(scene, camera);

        destructionBits.forEach(mesh => {
            if (mesh.userData.clock && mesh.userData.mixer) {
                // debugger;
                mesh.userData.mixer.update(mesh.userData.clock.getDelta());
            }
        });

        camera.userData?.mixer?.update(camera.userData?.clock?.getDelta());


        if (sceneConfiguration.rocketMoving) {
            detectCollisions();
            for (let i = 0; i < environmentBits.length; i++) {
                let mesh = environmentBits[i];
                mesh.position.z += sceneConfiguration.speed;
            }
            for (let i = 0; i < challengeRows.length; i++) {
                challengeRows[i].rowParent.position.z += sceneConfiguration.speed;
                // challengeRows[i].rowObjects.forEach(x => {
                //     x.position.z += speed;
                // })
            }
            // console.log(environmentBits[0].position.z);
            if ((!environmentBits.length || environmentBits[0].position.z > -1300) && !sceneConfiguration.levelOver) {
                addBackgroundBit(sceneConfiguration.backgroundBitCount++, true);
            }
            if ((!challengeRows.length || challengeRows[0].rowParent.position.z > -1300) && !sceneConfiguration.levelOver) {
                addChallengeRow(sceneConfiguration.challengeRowCount++, true);
            }
            // console.log(starterBay.position.z);
            if (starterBay != null) {
                starterBay.position.z += sceneConfiguration.speed;
            }
            if (starterBay.position.z > 200) {
                scene.remove(starterBay);
            }
        }
        moveCollectedBits();
        if (sceneConfiguration.courseProgress >= sceneConfiguration.courseLength) {
            // console.log('level over!');
            // sceneConfiguration.rocketMoving = false;
            if (!rocketModel.userData.flyingAway) {
                // debugger;
                endLevel(false);
            }
        }
        if (rocketModel.userData.flyingAway) {
            camera.lookAt(rocketModel.position);
        }
    }
    render()
}

/// Initialisation for the scene
async function init() {
    renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    if (isTouchDevice()) {
        let touchZone = document.getElementById('joystick-zone');
        if (touchZone != null) {
            joystickManager = joystick.create({zone: document.getElementById('joystick-zone')!,})
            joystickManager.on("move", (event, data) => {
                positionOffset = data.vector.x;
                // console.log(data.position.x);
                // rocketModel.position.x += data.vector.x
            })
            joystickManager.on('end', (event, data) => {
                positionOffset = 0.0;
            })
        }
    }

    nextLevelButton.onclick = (event) => {
        nextLevel();
    }

    startGameButton.onclick = (event) => {
        sceneConfiguration.cameraStartAnimationPlaying = true;
        shieldUiElement.classList.remove('danger');
        // debugger;
        // let rotation = AnimationClipCreator.CreateRotationAnimation(100, "z");
        // camera.userData.mixer.clipAction(rotation).play();

        camera.userData.mixer = new AnimationMixer(camera);

        let track = new VectorKeyframeTrack('.position', [0, 2], [
            camera.position.x, // x 3
            camera.position.y, // y 3
            camera.position.z, // z 3
            0, // x 2
            30, // y 2
            100, // z 2
        ], InterpolateSmooth);

        let identityRotation = new Quaternion().setFromAxisAngle(new Vector3(-1, 0, 0), .3);

        let rotationClip = new QuaternionKeyframeTrack('.quaternion', [0, 2], [
            camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w,
            identityRotation.x, identityRotation.y, identityRotation.z, identityRotation.w
        ])

        const animationClip = new AnimationClip('animateIn', 4, [track, rotationClip]);
        const animationAction = camera.userData.mixer.clipAction(animationClip);
        animationAction.setLoop(LoopOnce, 1);
        animationAction.clampWhenFinished = true;

        camera.userData.clock = new Clock();
        camera.userData.mixer.addEventListener('finished', function () {
            camera.lookAt(new Vector3(0, -500, -1400));
            sceneConfiguration.rocketMoving = true;
            // sceneConfiguration.backgroundMoving = true;
            // console.log('finished animating destruction bit');
            // this.userData.animating = true;
        });

        camera.userData.mixer.clipAction(animationClip).play();

        document.getElementById('startGame')!.classList.add('hidden');
        document.getElementById('headsUpDisplay')!.style.display = 'flex';
        // moveTowards(camera, new Vector3(0, 0, 0));

        // console.log('okay');
    }

    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.autoUpdate = true;
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // gltfLoader.load(rocketGLTF, (model) =>{
    //     // model.scene.scale.set(10, 10, 10);
    //
    //     // boundingMesh.position.z = 70;
    //     // let collisionBox = CubeMe
    // });

    setProgress('Loading cliffs...');


    setProgress('Scene loaded!');
    document.getElementById('loadingCover')?.remove();
    document.getElementById('loadingTextContainer')?.remove();
    document.getElementById('rocketPicture')?.remove();


    // Water
    configureWater();

    // Skybox

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = (sky.material as any).uniforms;

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

    (sky.material as any).uniforms['sunPosition'].value.copy(sun);
    (water.material as any).uniforms['sunDirection'].value.copy(sun).normalize();

    // scene.environment = pmremGenerator.fromScene(sky).texture;
    scene.environment = pmremGenerator.fromScene(sky as any).texture;


    (water.material as any).uniforms['speed'].value = 0.0;


    // scene.add(starterBay);
    const shadowLight = new SpotLight();
    shadowLight.lookAt(rocketModel.position);
    shadowLight.position.z = 50;
    shadowLight.position.y = 100;
    shadowLight.position.x = 100;
    shadowLight.castShadow = true;
    // shadowLight.shadow.v
    // shadowLight.shadow.bias = 0.002;
    // shadowLight.position.x = 200;
    scene.add(shadowLight);

    sceneConfiguration.ready = true;
    rocketModel.scale.set(0.3, 0.3, 0.3);
    // rocket.
    scene.add(rocketModel);

    sceneSetup(sceneConfiguration.level);
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

    let destinationRotation = camera.position;
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


function render() {
    (water.material).uniforms['time'].value += 1 / 60.0;
    if (sceneConfiguration.rocketMoving) {
        (water.material as any).uniforms['speed'].value += sceneConfiguration.speed / 50;
    }
}

function configureWater() {
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = 180;

    scene.add(water);
}

function onKeyDown(event: KeyboardEvent) {
    console.log('keypress');
    let keyCode = event.which;
    if (keyCode == 37) {
        leftPressed = true;
    } else if (keyCode == 39) {
        rightPressed = true;
    }
}

function onKeyUp(event: KeyboardEvent) {
    let keyCode = event.which;
    if (keyCode == 37) {
        leftPressed = false;
    } else if (keyCode == 39) {
        rightPressed = false;
    }

}

export const sceneSetup = (level: number) => {

    sceneConfiguration.challengeRowCount = 0;
    sceneConfiguration.backgroundBitCount = 0;

    camera.position.z = 50;
    camera.position.y = 12;
    camera.position.x = 15;
    camera.rotation.y = 2.5;

    scene.add(starterBay);

    starterBay.position.copy(new Vector3(10, 0, 120));

    rocketModel.rotation.x = Math.PI;
    rocketModel.rotation.z = Math.PI;

    rocketModel.position.z = 70;
    rocketModel.position.y = 10;
    rocketModel.position.x = 0;

    challengeRows.forEach(x => {
        scene.remove(x.rowParent);
    });

    environmentBits.forEach(x => {
        scene.remove(x);
    })

    environmentBits.length = 0;
    challengeRows.length = 0;

    for (let i = 0; i < 60; i++) {
        // debugger;
        addChallengeRow(sceneConfiguration.challengeRowCount++);
        addBackgroundBit(sceneConfiguration.backgroundBitCount++);
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

    document.getElementById('levelIndicator')!.innerText = `LEVEL ${sceneConfiguration.level}`;
    sceneConfiguration.ready = true;
}


objectsInit().then(x => {
    init().then(x => {
        sceneSetup(sceneConfiguration.level);
    })
})

animate()
