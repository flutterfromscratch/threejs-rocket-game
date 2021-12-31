declare module '*.js';

declare module 'Mesh'{
    import {BufferGeometry} from "three/src/core/BufferGeometry";
    import {Material} from "three/src/materials/Material";
    import {Object3D} from "three/src/core/Object3D";
    import {Intersection, Raycaster} from "three/src/core/Raycaster";
    import {ShaderMaterial} from "three";

    export class Mesh<
        TGeometry extends BufferGeometry = BufferGeometry,
        TMaterial extends Material | Material[] = Material | Material[],
        > extends Object3D {
        constructor(geometry?: TGeometry, material?: TMaterial);

        geometry: TGeometry;
        material: ShaderMaterial;
        morphTargetInfluences?: number[] | undefined;
        morphTargetDictionary?: { [key: string]: number } | undefined;
        readonly isMesh: true;
        type: string;

        updateMorphTargets(): void;
        raycast(raycaster: Raycaster, intersects: Intersection[]): void;
    }

}
