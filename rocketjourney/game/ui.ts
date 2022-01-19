import {sceneConfiguration, sceneSetup,} from "../game";

export const crystalUiElement = document.getElementById('crystalCount')!;
export const shieldUiElement = document.getElementById('shieldCount')!;
export const progressUiElement = document.getElementById('courseProgress')!;

export const endLevelDescriptor = document.getElementById('levelDescriptor')!;
export const endLevelShipStatus = document.getElementById('shipStatus')!;

export const nextLevelButton = document.getElementById('nextLevel')!;

export const startAgainButton = document.getElementById('startOver')!;
export const startGameButton = document.getElementById('startGame')!;

export const startPanel = document.getElementById('levelStartPanel')!;
export const levelIndicator = document.getElementById('levelIndicator')!;


export const uiInit = () => {
    startAgainButton.onclick = () => {
        nextLevel(true);
        // sceneSetup(1);
    }
}

export const nextLevel = (reset: boolean = false) => {
    document.getElementById('endOfLevel')!.style!.display = '';
    document.getElementById('endOfLevel')!.classList.remove('fadeOut');
    document.getElementById('endOfLevel')!.classList.add('hidden');
    document.getElementById('startGame')!.classList.remove('hidden');
    document.getElementById('levelStartPanel')!.classList.remove('hidden');

// debugger;
    sceneConfiguration.cameraStartAnimationPlaying = false;
    sceneConfiguration.rocketMoving = false;
    sceneConfiguration.speed = 0.05;
    // sceneConfiguration.rocketMoving = false;
    sceneConfiguration.speed = sceneConfiguration.level * 0.1;
    if (reset) {
        sceneSetup(1)
    } else {
        sceneSetup(++sceneConfiguration.level);
    }
}

export const updateLevelEndUI = (damaged: boolean) => {
    endLevelDescriptor.innerText = `LEVEL ${sceneConfiguration.level}`;
    if (damaged) {
        endLevelShipStatus.innerText = 'Your ship has hit too many rocks and is too damaged to continue!\r\n\r\n' +
            'We have another one you can use but you\'ll have to start over...';
        nextLevelButton.classList.add('hidden');
        startAgainButton.classList.remove('hidden');
    } else {
        let shieldCount = sceneConfiguration.data.shieldsCollected;
        if (shieldCount == 5) {
            endLevelShipStatus.innerText = 'Your ship is in pristine condition!';
        } else if (shieldCount > 1 && shieldCount < 5) {
            endLevelShipStatus.innerText = 'Your ship is in pretty good condition.';
        } else if (shieldCount == 0) {
            endLevelShipStatus.innerText = 'Your ship is in the same condition as when you left.';
        } else if (shieldCount >= -4 && shieldCount < 0) {
            endLevelShipStatus.innerText = 'Your ship is in pretty bad shape. We\'ll patch it up, but try to hit less rocks.';
        }

        nextLevelButton.classList.remove('hidden');
        startAgainButton.classList.add('hidden');

    }
}

export const showLevelEndScreen = () => {
    // document.
    document.getElementById('endOfLevel')!.style!.display = 'flex';
    document.getElementById('endOfLevel')!.classList.add('fadeOut');
    document.getElementById('crystalCountLevelEnd')!.innerText = String(sceneConfiguration.data.crystalsCollected);


}
export const setProgress = (progress: string) => {
    let progressElement = document.getElementById('loadingProgress');
    if (progressElement != null) {
        progressElement.innerText = progress;
    }
}


