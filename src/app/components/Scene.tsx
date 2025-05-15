'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


interface ProjectImage {
  file: string;
  pos: [number, number, number];
  rotY: number;
  name: string;
  url: string;
}



const Scene = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isInInnerBox, setIsInInnerBox] = useState(false);
  const houseModelRef = useRef<THREE.Object3D | null>(null);
  const houseBoxRef = useRef<THREE.BoxHelper | null>(null);
  const desktopModelRef = useRef<THREE.Object3D | null>(null);
  const bedModelRef = useRef<THREE.Object3D | null>(null);
  const chairModelRef = useRef<THREE.Object3D | null>(null);
  const robotModelRef = useRef<THREE.Object3D | null>(null);
  const robotMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const robotScreenRef = useRef<THREE.Mesh | null>(null);
  const robotBorderPlaneRef = useRef<THREE.Mesh | null>(null);
  const robotBorderRef = useRef<THREE.LineSegments | null>(null);
  const [showRobotScreen, setShowRobotScreen] = useState(false);
  const [isCameraLockedToChat, setIsCameraLockedToChat] = useState(false);
  const [showProjects, setShowProjects] = useState(true);
  const [showStart, setShowStart] = useState(true);
  const [showPause, setShowPause] = useState(false);
  const startModelRef = useRef<THREE.Object3D | null>(null);
  const pauseModelRef = useRef<THREE.Object3D | null>(null);
  const aboutMeTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const characterRef = useRef<{
    object: THREE.Object3D | null;
    mixer: THREE.AnimationMixer | null;
    isWalking: boolean;
    walkSpeed: number;
    direction: THREE.Vector3;
  }>({
    object: null,
    mixer: null,
    isWalking: false,
    walkSpeed: 30,
    direction: new THREE.Vector3(0, 0, 0),
  });
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!mountRef.current || !isMounted) return;

    // Clear any existing content
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a1a);
    
    // Responsive camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      windowSize.width / windowSize.height,
      0.1,
      1000
    );
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(windowSize.width, windowSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x1a1a1a, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Controls with responsive settings
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.enabled = true;
    controls.enablePan = false;

    // Set initial camera limits
    controls.minDistance = 30;  // Minimum zoom distance
    controls.maxDistance = 150; // Maximum zoom distance
    controls.minPolarAngle = 0; // Minimum vertical angle (looking up)
    controls.maxPolarAngle = Math.PI / 2; // Maximum vertical angle (looking down)
    controls.minAzimuthAngle = -Math.PI / 2; // Minimum horizontal angle
    controls.maxAzimuthAngle = Math.PI / 2; // Maximum horizontal angle
    controls.update();

    // Adjust controls based on screen size
    if (windowSize.width < 768) {
      controls.minDistance = 30;
      controls.maxDistance = 100;
      controls.maxPolarAngle = Math.PI / 2;
    } else {
      controls.minDistance = 30;
      controls.maxDistance = 150;
      controls.maxPolarAngle = Math.PI / 2;
    }

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Handle mouse click
    const handleClick = (event: MouseEvent) => {
      if (!robotModelRef.current) return;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Check for project image click
      const projectImageClicked = intersects.find(intersect => {
        return intersect.object.userData && intersect.object.userData.url;
      });
      if (projectImageClicked) {
        const url = projectImageClicked.object.userData.url;
        if (url) {
          window.open(url, '_blank');
          return;
        }
      }

      // Check for robot_walk.glb click
      const robotWalkClicked = intersects.some(intersect => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          if (obj === robotModelRef.current || obj.name === 'robot') return true;
          obj = obj.parent;
        }
        return false;
      });

      if (robotWalkClicked) {
        setShowRobotScreen(prev => !prev);
        return;
      }

      // Check for start.glb click
      const startClicked = intersects.some(intersect => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          if (obj === startModelRef.current) return true;
          obj = obj.parent;
        }
        return false;
      });
      if (startClicked) {
        setShowStart(false);
        setShowPause(true);
        return;
      }

      // Check for pause.glb click
      const pauseClicked = intersects.some(intersect => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          if (obj === pauseModelRef.current) return true;
          obj = obj.parent;
        }
        return false;
      });
      if (pauseClicked) {
        setShowStart(true);
        setShowPause(false);
        return;
      }

      // Check for achievements start/pause buttons
      const achievementsStartClicked = intersects.some(intersect => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          if (obj.name === 'achievementsStartModel') return true;
          obj = obj.parent;
        }
        return false;
      });

      const achievementsPauseClicked = intersects.some(intersect => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj) {
          if (obj.name === 'achievementsPauseModel') return true;
          obj = obj.parent;
        }
        return false;
      });

      if (achievementsStartClicked || achievementsPauseClicked) {
        setShowStart(prev => !prev);
        setShowPause(prev => !prev);
        return;
      }
    };

    window.addEventListener('click', handleClick);

    // Character state
    const character = {
      object: null as THREE.Object3D | null,
      mixer: null as THREE.AnimationMixer | null,
      isWalking: false,
      walkSpeed: 30,
      direction: new THREE.Vector3(0, 0, 0),
    };

    // Load models function
    const loadModel = (modelPath: string) => {
      const fbxLoader = new FBXLoader();
      const textureLoader = new THREE.TextureLoader();
      // Load all PBR textures in parallel
      Promise.all([
        textureLoader.loadAsync('/model/texture_diffuse.png'),
        textureLoader.loadAsync('/model/texture_metallic.png'),
        textureLoader.loadAsync('/model/texture_roughness.png'),
        textureLoader.loadAsync('/model/texture_normal.png'),
      ]).then(([diffuse, metallic, roughness, normal]) => {
        fbxLoader.load(
          modelPath,
          (object) => {
            if (characterRef.current.object) {
              scene.remove(characterRef.current.object);
            }

            object.scale.set(0.007, 0.007, 0.007);
            const prevPosition = characterRef.current.object ? characterRef.current.object.position.clone() : new THREE.Vector3(60, 28, 150);
            const prevRotation = characterRef.current.object ? characterRef.current.object.rotation.clone() : new THREE.Euler(0, 0, 0);
            object.position.copy(prevPosition);
            object.rotation.copy(prevRotation);

            // Apply the PBR textures to all meshes
            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = new THREE.MeshStandardMaterial({
                  map: diffuse,
                  metalnessMap: metallic,
                  roughnessMap: roughness,
                  normalMap: normal,
                  metalness: 1.0,
                  roughness: 1.0,
                });
              }
            });

            characterRef.current.object = object;
            characterRef.current.mixer = new THREE.AnimationMixer(object);
            
            if (object.animations.length > 0) {
              const clip = object.animations[0];
              
              // Create a new animation clip that removes the root motion
              const tracks = [];
              for (let i = 0; i < clip.tracks.length; i++) {
                const track = clip.tracks[i];
                // Skip position tracks that affect the root bone
                if (!track.name.includes('mixamorigHips.position')) {
                  tracks.push(track);
                }
              }
              const staticClip = new THREE.AnimationClip('static_' + clip.name, clip.duration, tracks);
              
              const action = characterRef.current.mixer.clipAction(staticClip);
              action.play();
            }

            scene.add(object);
          }
        );
      });
    };

    // Initial load of standing model
    loadModel('/model/Standing.fbx');

    // Poodle setup
    const poodle = {
      object: null as THREE.Object3D | null,
      mixer: null as THREE.AnimationMixer | null,
      isWalking: false,
      basePosition: new THREE.Vector3(40, 10, 150),
      targetPosition: new THREE.Vector3(40, 10, 150),
      walkSpeed: 5,
      runSpeed: 10,
      randomWalkRadius: 15,
      timeToNewTarget: 0
    };

    // Function to get random position within radius
    const getRandomPosition = () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * poodle.randomWalkRadius;
      const x = poodle.basePosition.x + Math.cos(angle) * radius;
      const z = poodle.basePosition.z + Math.sin(angle) * radius;
      return new THREE.Vector3(x, poodle.basePosition.y, z);
    };

    // Function to load poodle
    const loadPoodle = () => {
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        '/poodle/animations/walk/Poodle_Portrait_0428141001_texture_walk.glb',
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(0.3, 0.3, 0.3);
          
          // Set poodle at initial position
          model.position.copy(poodle.basePosition);
          
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          poodle.object = model;
          poodle.mixer = new THREE.AnimationMixer(model);
          
          if (gltf.animations.length > 0) {
            const action = poodle.mixer.clipAction(gltf.animations[0]);
            action.play();
          }

          scene.add(model);
        }
      );
    };

    // Keyboard controls
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
      }

      if (!characterRef.current.isWalking) {
        characterRef.current.isWalking = true;
        loadModel('/model/Walking.fbx');
      }

      switch (event.key) {
        case 'ArrowUp':
          characterRef.current.direction.z = -1;
          if (characterRef.current.object) characterRef.current.object.rotation.y = Math.PI;
          break;
        case 'ArrowDown':
          characterRef.current.direction.z = 1;
          if (characterRef.current.object) characterRef.current.object.rotation.y = 0;
          break;
        case 'ArrowLeft':
          characterRef.current.direction.x = -1;
          if (characterRef.current.object) characterRef.current.object.rotation.y = -Math.PI / 2;
          break;
        case 'ArrowRight':
          characterRef.current.direction.x = 1;
          if (characterRef.current.object) characterRef.current.object.rotation.y = Math.PI / 2;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          characterRef.current.direction.z = 0;
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          characterRef.current.direction.x = 0;
          break;
      }

      // If no keys are pressed, stop walking
      if (characterRef.current.direction.x === 0 && characterRef.current.direction.z === 0) {
        characterRef.current.isWalking = false;
        loadModel('/model/Standing.fbx');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add hemisphere light for soft sky/ground lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    // Sun-like directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(30, 100, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Optional: add a point light for highlights
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 200);
    pointLight.position.set(0, 50, 50);
    scene.add(pointLight);

    // Ground
    const groundWidth = 500;
    const groundDepth = 500;
    const groundThickness = 10; // Make this as thick as you want
    const groundGeometry = new THREE.BoxGeometry(groundWidth, groundThickness, groundDepth);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -groundThickness / 2; // So the top is at y=0
    ground.receiveShadow = true;
    ground.castShadow = false;
    scene.add(ground);

    // Load house
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/house/house.glb', (gltf) => {
      const model = gltf.scene;
      model.name = 'house';
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.name = 'house';
        }
      });
      model.scale.set(150, 120, 120);
      model.position.set(0, 0, 0);
      scene.add(model);
      houseModelRef.current = model;

      // Add box outline
      const boxHelper = new THREE.BoxHelper(model, 0x00ff00);
      boxHelper.name = 'houseBox';
      boxHelper.visible = false;//outter Box
      scene.add(boxHelper);
      houseBoxRef.current = boxHelper;

      // Add center box
      const houseBox = new THREE.Box3().setFromObject(model);
      const houseCenter = new THREE.Vector3();
      houseBox.getCenter(houseCenter);
      
      // Create a box geometry for the center area
      //TODO: Inner box 
      const centerBoxSize = new THREE.Vector3(150, 50, 100); // Size of the center box
      const centerBoxGeometry = new THREE.BoxGeometry(
        centerBoxSize.x,
        centerBoxSize.y,
        centerBoxSize.z
      );
      
      // Create wireframe material
      const centerBoxMaterial = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });
      
      // Create mesh and position it at house center
      const centerBox = new THREE.Mesh(centerBoxGeometry, centerBoxMaterial);
      centerBox.position.copy(houseCenter);
      centerBox.position.y = 26; // Moved up by 20 units (from 20 to 40)
      centerBox.position.z = -20;
      centerBox.position.x = -18;
      centerBox.name = 'centerBox';
      centerBox.visible = false; //Inner Box : centerBox; Outter Box ： boxHelper
      scene.add(centerBox);

      // Load poodle after house is loaded
      loadPoodle();

      // Load and display house/destop.glb
      gltfLoader.load('/house/desktop.glb', (gltf2) => {
        const destopModel = gltf2.scene;
        destopModel.name = 'destop';
        destopModel.scale.set(30, 30, 30); // Adjust scale as needed
        destopModel.position.set(0, 0, -78); // Position near the house
        scene.add(destopModel);
        desktopModelRef.current = destopModel;
      });

      gltfLoader.load('/house/bed.glb', (gltf2) => {
        const bedModel = gltf2.scene;
        bedModel.name = 'bed';
        bedModel.scale.set(25, 20, 40); // Adjust scale as needed
        bedModel.position.set(-78, 0, -45); // Position near the house
        scene.add(bedModel);
        bedModelRef.current = bedModel;
      });
      gltfLoader.load('/house/robot.glb', (gltf2) => {
        const robotModel = gltf2.scene;
        robotModel.name = 'robot';
        robotModel.scale.set(10, 10, 10); // Adjust scale as needed
        robotModel.position.set(53, 0, -50); // Position near the house
        robotModel.rotateY(-Math.PI / 4); // Rotate 45 degrees around Y axis
        scene.add(robotModel);
        robotModelRef.current = robotModel;
      });

      gltfLoader.load('/house/showcase.glb', (gltf2) => {
        const showcaseModel = gltf2.scene;
        showcaseModel.name = 'projectTitle';
        showcaseModel.scale.set(15, 15, 15); // Adjust scale as needed
        showcaseModel.position.set(53, 60, -50); // Position near the house
        showcaseModel.rotateY(-Math.PI / 4); // Rotate 45 degrees around Y axis
        scene.add(showcaseModel);
        // Optionally add a showcaseModelRef if needed
      });

      // Add showcase for achievements screen
      gltfLoader.load('/house/awards.glb', (gltf2) => {
        const achievementsShowcaseModel = gltf2.scene;
        achievementsShowcaseModel.name = 'achievementsTitle';
        achievementsShowcaseModel.scale.set(15, 15, 15);
        achievementsShowcaseModel.position.set(-100, 60, -20); // Position above achievements screen
        achievementsShowcaseModel.rotateY(Math.PI / 2); // Rotate to face the screen
        scene.add(achievementsShowcaseModel);
      });

      if (showStart) {
        gltfLoader.load('/house/start.glb', (gltf2) => {
          const startModel = gltf2.scene;
          startModel.name = 'startModel';
          startModel.scale.set(5, 5, 5);
          startModel.position.set(37, 60, -66);
          startModel.rotateY(-Math.PI / 4);
          scene.add(startModel);
          startModelRef.current = startModel;
        });
      } else {
        gltfLoader.load('/house/pause.glb', (gltf2) => {
          const pauseModel = gltf2.scene;
          pauseModel.name = 'pauseModel';
          pauseModel.scale.set(5, 5, 5);
          pauseModel.position.set(37, 60, -66);
          pauseModel.rotateY(-Math.PI / 4);
          scene.add(pauseModel);
          pauseModelRef.current = pauseModel;
        });
      }

      gltfLoader.load('/house/projectTitle.glb', (gltf2) => {
        const projectTitleModel = gltf2.scene;
        projectTitleModel.name = 'projectTitle';
        projectTitleModel.scale.set(16, 16, 16); // Adjust scale as needed
        projectTitleModel.position.set(67, 0, -36); // Position near the house
        projectTitleModel.rotateY(-Math.PI / 4); // Rotate 45 degrees around Y axis
        scene.add(projectTitleModel);
        // Optionally add a projectTitleModelRef if needed
      });

      gltfLoader.load('/house/eemun.glb', (gltf2) => {
        const eemunTitleModel = gltf2.scene;
        eemunTitleModel.name = 'eemunTitle';
        eemunTitleModel.scale.set(15, 15, 15); // Adjust scale as needed
        eemunTitleModel.position.set(39, 0, -64); // Position near the house
        eemunTitleModel.rotateY(-Math.PI / 4); // Rotate 45 degrees around Y axis
        scene.add(eemunTitleModel);
        // Optionally add a eemunTitleModelRef if needed
      });

      gltfLoader.load('/house/gamingChair.glb', (gltf2) => {
        const chairModel = gltf2.scene;
        chairModel.name = 'chair';
        chairModel.scale.set(20, 20, 20); // Adjust scale as needed
        chairModel.position.set(0, 0, -50); // Position near the house
        chairModel.rotateY(Math.PI);
        scene.add(chairModel);
        chairModelRef.current = chairModel;
      });
      gltfLoader.load('/house/blindbox.glb', (gltf2) => {
        const blindboxModel = gltf2.scene;
        blindboxModel.name = 'blindbox';
        blindboxModel.scale.set(30, 20, 30); // Adjust scale as needed
        blindboxModel.position.set(-45, 1, -78); // Position near the house       
        //blindboxModel.rotateY(Math.PI);
        scene.add(blindboxModel);
        // Optionally add a blindboxModelRef if needed
      });

      gltfLoader.load('/house/robot_walk.glb', (gltf2) => {
        const robotModel = gltf2.scene;
        robotModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.userData.isRobotWalk = true; // Mark all meshes as part of robot_walk
          }
        });
        robotModel.scale.set(0.2, 0.2, 0.2);
        robotModel.position.set(-45, 47, -78);
        scene.add(robotModel);
        robotModelRef.current = robotModel;

        // Set up animation mixer for robot
        if (gltf2.animations.length > 0) {
          robotMixerRef.current = new THREE.AnimationMixer(robotModel);
          const action = robotMixerRef.current.clipAction(gltf2.animations[0]);
          action.play();
        }

        // Add a second projector screen near the robot
        const screenWidth = 40;   // width of the screen
        const screenHeight = 25;  // height of the screen
        const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
        const screenMaterial = new THREE.MeshStandardMaterial({
          color: 0xFFC0CB,
          side: THREE.DoubleSide,
          roughness: 0.7,
          metalness: 0.1,
          transparent: true,
          opacity: 0.5
        });
        const robotProjectorScreen = new THREE.Mesh(screenGeometry, screenMaterial);
        robotProjectorScreen.position.set(-45, 60, -78); // Position above the robot
        robotProjectorScreen.name = 'robotProjectorScreen';
        robotProjectorScreen.visible = false; // Start hidden
        scene.add(robotProjectorScreen);
        robotScreenRef.current = robotProjectorScreen;

        // Add a black border plane behind the screen for a thick border effect
        const borderPlaneGeometry = new THREE.PlaneGeometry(screenWidth + 2, screenHeight + 2);
        const borderPlaneMaterial = new THREE.MeshBasicMaterial({
          color: 0xFFC0CB,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        });
        const borderPlane = new THREE.Mesh(borderPlaneGeometry, borderPlaneMaterial);
        borderPlane.position.copy(robotProjectorScreen.position);
        borderPlane.rotation.copy(robotProjectorScreen.rotation);
        borderPlane.position.z -= 0.2; // Slightly further behind the screen
        borderPlane.visible = false; // Start hidden
        scene.add(borderPlane);
        robotBorderPlaneRef.current = borderPlane;

        // Add a thin outline border using EdgesGeometry
        const edgeGeometry = new THREE.EdgesGeometry(screenGeometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xFFC0CB, linewidth: 2 });
        const border = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        border.position.copy(robotProjectorScreen.position);
        border.rotation.copy(robotProjectorScreen.rotation);
        border.visible = false; // Start hidden
        scene.add(border);
        robotBorderRef.current = border;
      });
      
      gltfLoader.load('/house/wardrobe.glb', (gltf2) => {
        const chairModel = gltf2.scene;
        chairModel.name = 'wardrobe';
        chairModel.scale.set(30, 30, 30); // Adjust scale as needed
        chairModel.position.set(63, 1, 10); // Position near the house
        chairModel.rotateY(-Math.PI/2 - Math.PI/6); // Added 30 degrees (-Math.PI/6)
        scene.add(chairModel);
        chairModelRef.current = chairModel;
      });

      gltfLoader.load('/house/coffeebar.glb', (gltf2) => {
        const bedModel = gltf2.scene;
        bedModel.name = 'coffeebar';
        bedModel.scale.set(40, 40, 40); // Adjust scale as needed
        bedModel.position.set(-60, 0, 40); // Position near the house
        bedModel.rotateY(Math.PI); // Rotate 45 degrees around Y axis
        scene.add(bedModel);
        bedModelRef.current = bedModel;
      });

      // Add a 3D flat projector screen
      const screenWidth = 60;   // width of the screen
      const screenHeight = 35;  // height of the screen
      const screenGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
      const screenMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFC0CB, // color doesn't matter if fully transparent
        side: THREE.DoubleSide,
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0.5 // Fully see-through
      });
      const projectorScreen = new THREE.Mesh(screenGeometry, screenMaterial);
      projectorScreen.position.set(50, 40, -50); // Adjust position as needed
      projectorScreen.rotation.y = -Math.PI / 4 ; // Rotate 225 degrees around Y axis
      projectorScreen.name = 'projectorScreen';
      scene.add(projectorScreen);

      // Add a black border plane behind the screen for a thick border effect
      const borderPlaneGeometry = new THREE.PlaneGeometry(screenWidth + 2, screenHeight + 2);
      const borderPlaneMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFC0CB,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const borderPlane = new THREE.Mesh(borderPlaneGeometry, borderPlaneMaterial);
      borderPlane.position.copy(projectorScreen.position);
      borderPlane.rotation.copy(projectorScreen.rotation);
      borderPlane.position.z -= 0.2; // Slightly further behind the screen
      scene.add(borderPlane);

      // Add a thin outline border using EdgesGeometry
      const edgeGeometry = new THREE.EdgesGeometry(screenGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xFFC0CB, linewidth: 2 });
      const border = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      border.position.copy(projectorScreen.position);
      border.rotation.copy(projectorScreen.rotation);
      scene.add(border);

      // Add achievements projector screen
      const achievementsScreen = new THREE.Mesh(screenGeometry, screenMaterial);
      achievementsScreen.position.set(-100, 40, -20);
      achievementsScreen.rotation.y = Math.PI / 2;
      achievementsScreen.name = 'achievementsScreen';
      scene.add(achievementsScreen);

      // Add a black border plane behind the achievements screen
      const achievementsBorderPlane = new THREE.Mesh(borderPlaneGeometry, borderPlaneMaterial);
      achievementsBorderPlane.position.copy(achievementsScreen.position);
      achievementsBorderPlane.rotation.copy(achievementsScreen.rotation);
      achievementsBorderPlane.position.z -= 0.2;
      scene.add(achievementsBorderPlane);

      // Add a thin outline border for achievements screen
      const achievementsBorder = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      achievementsBorder.position.copy(achievementsScreen.position);
      achievementsBorder.rotation.copy(achievementsScreen.rotation);
      scene.add(achievementsBorder);

      // Create texture loader
      const loader = new THREE.TextureLoader();

      // Define award images array
      const awardImages: ProjectImage[] = [
        { file: '/portfolio/project1.png', pos: [-99, 50, -20], rotY: Math.PI / 2, name: 'Dean\'s List', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [-99, 40, -20], rotY: Math.PI / 2, name: 'Best Project', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [-99, 30, -20], rotY: Math.PI / 2, name: 'Hackathon Winner', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [-99, 50, -36], rotY: Math.PI / 2, name: 'Research Grant', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [-99, 40, -36], rotY: Math.PI / 2, name: 'Research Grant', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [-99, 30, -36], rotY: Math.PI / 2, name: 'Innovation Award', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [-99, 50, -4], rotY: Math.PI / 2, name: 'Academic Excellence', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [-99, 40, -4], rotY: Math.PI / 2, name: 'Leadership Award', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [-99, 30, -4], rotY: Math.PI / 2, name: 'Community Service', url: 'https://eemunportfolio.vercel.app/' },
      ];

      // Load and display award images
      awardImages.forEach(({ file, pos, rotY, name, url }) => {
        loader.load(file, (texture: THREE.Texture) => {
          const imgWidth = 15;
          const imgHeight = 8;
          const geometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
          const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
          const imagePlane = new THREE.Mesh(geometry, material);
          imagePlane.position.set(...pos);
          imagePlane.rotation.y = rotY;
          imagePlane.name = name;
          imagePlane.userData.url = url;
          scene.add(imagePlane);
        });
      });

      // Load and display portfolio/project1.png as a plane in the scene
      loader.load('/portfolio/project1.png', (texture: THREE.Texture) => {
        const imgWidth = 15;  // Adjust as needed 
        const imgHeight = 8; // Adjust as needed
        const geometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const imagePlane = new THREE.Mesh(geometry, material);
        imagePlane.position.set(48, 40, -48); //center
        imagePlane.rotation.y = -Math.PI / 4 ; 
        imagePlane.name = 'project1Image';
        scene.add(imagePlane);
      });
      
      const projectImages: ProjectImage[] = [
        { file: '/portfolio/project2.png', pos: [36, 50, -60], rotY: -Math.PI / 4, name: 'HackSplit', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project3.png', pos: [36, 40, -60], rotY: -Math.PI / 4, name: 'PawChain', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [36, 30, -60], rotY: -Math.PI / 4, name: 'Graphic Programming', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [48, 50, -48], rotY: -Math.PI / 4, name: 'Java', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [48, 30, -48], rotY: -Math.PI / 4, name: 'Mixue', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [60, 50, -36], rotY: -Math.PI / 4, name: 'TravelConnect', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [60, 40, -36], rotY: -Math.PI / 4, name: 'Recycle_Reward_System', url: 'https://eemunportfolio.vercel.app/' },
        { file: '/portfolio/project1.png', pos: [60, 30, -36], rotY: -Math.PI / 4, name: 'CureMeBaby', url: 'https://eemunportfolio.vercel.app/' },
      ];

      // Only add project images if showProjects is true
      if (showProjects) {
        projectImages.forEach(({ file, pos, rotY, name, url }) => {
          loader.load(file, (texture: THREE.Texture) => {
            const imgWidth = 15;
            const imgHeight = 8;
            const geometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
            const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
            const imagePlane = new THREE.Mesh(geometry, material);
            imagePlane.position.set(...pos);
            imagePlane.rotation.y = rotY;
            imagePlane.name = name;
            imagePlane.userData.url = url;
            scene.add(imagePlane);
          });
        });
      }

      // Load and display /garden/pink_tree.glb
      gltfLoader.load('/garden/pink_tree.glb', (gltf2) => {
        const pinkTreeModel = gltf2.scene;
        pinkTreeModel.name = 'pinkTree';
        pinkTreeModel.scale.set(20, 20, 20); // Adjust scale as needed
        pinkTreeModel.position.set(-120, 0, 150); // Place in garden area, adjust as needed
        scene.add(pinkTreeModel);
        // Optionally add a ref if you want to manipulate it later
      });

      gltfLoader.load('/garden/pink_tree.glb', (gltf2) => {
        const pinkTreeModel = gltf2.scene;
        pinkTreeModel.name = 'pinkTree';
        pinkTreeModel.scale.set(20, 20, 20); // Adjust scale as needed
        pinkTreeModel.position.set(120, 0, 150); // Place in garden area, adjust as needed
        scene.add(pinkTreeModel);
        // Optionally add a ref if you want to manipulate it later
      });

   
    });

    // Camera position
    camera.position.set(15, 50, 250);
    camera.lookAt(0, 0, 150);

    // State to track if character is in house
    let isInHouse = false;
    let hasTeleportedToCenter = false;

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Update character movement and animation
      if (characterRef.current.isWalking && characterRef.current.object) {
        const moveDistance = characterRef.current.walkSpeed * delta;
        let nextPosition = characterRef.current.object.position.clone();
        nextPosition.x += characterRef.current.direction.x * moveDistance;
        nextPosition.z += characterRef.current.direction.z * moveDistance;

        // Get references to boxes
        const houseBox = houseModelRef.current ? new THREE.Box3().setFromObject(houseModelRef.current) : null;
        const centerBox = scene.getObjectByName('centerBox');
        const center = centerBox instanceof THREE.Mesh ? centerBox.position : new THREE.Vector3();
        const centerSize = new THREE.Vector3(150, 50, 100);

        // Check if character is in house (green box)
        if (houseBox && houseBox.containsPoint(nextPosition)) {
          if (!hasTeleportedToCenter) {
            // Teleport both character and poodle to center of inner box
            const centerPos = center.clone();
            centerPos.y = 28;
            characterRef.current.object.position.copy(centerPos);
            setIsInInnerBox(true);

            if (poodle.object) {
              const poodleCenter = center.clone();
              poodleCenter.y = 10;
              poodle.object.position.copy(poodleCenter);
              poodle.targetPosition.copy(poodleCenter);
              poodle.basePosition.copy(poodleCenter);
            }

            isInHouse = true;
            hasTeleportedToCenter = true;
          }
        } else {
          isInHouse = false;
          hasTeleportedToCenter = false;
          setIsInInnerBox(false);
        }

        // Restrict movement to centerBox if in house and not colliding with obstacles
        if (isInHouse && centerBox instanceof THREE.Mesh) {
          // Only allow movement if next position is inside centerBox
          if (Math.abs(nextPosition.x - center.x) <= centerSize.x / 2 &&
              Math.abs(nextPosition.y - center.y) <= centerSize.y / 2 &&
              Math.abs(nextPosition.z - center.z) <= centerSize.z / 2) {
            characterRef.current.object.position.copy(nextPosition);
          }
          // Camera and color logic for being inside the center box
          const cameraOffset = new THREE.Vector3(0, 35, -65);
          const targetCameraPos = characterRef.current.object.position.clone().add(cameraOffset);
          if (cameraRef.current) {
            cameraRef.current.position.copy(targetCameraPos);
            cameraRef.current.lookAt(characterRef.current.object.position);
          }
          if (controlsRef.current) {
            controlsRef.current.target.copy(characterRef.current.object.position);
            controlsRef.current.minDistance = 30;
            controlsRef.current.maxDistance = 80;
            controlsRef.current.minPolarAngle = 0;
            controlsRef.current.maxPolarAngle = Math.PI / 2;
            controlsRef.current.minAzimuthAngle = -Math.PI / 2;
            controlsRef.current.maxAzimuthAngle = Math.PI / 2;
            controlsRef.current.update();
          }
        } else if (!isInHouse) {
          // Normal movement outside house
          characterRef.current.object.position.copy(nextPosition);
          // Update camera position to follow character from behind
          if (characterRef.current.direction.z > 0) { // Moving down (character facing camera)
            const cameraOffset = new THREE.Vector3(0, 35, -65);
            const targetCameraPos = characterRef.current.object.position.clone().add(cameraOffset);
            if (cameraRef.current) {
              cameraRef.current.position.copy(targetCameraPos);
              cameraRef.current.lookAt(characterRef.current.object.position);
            }
            if (controlsRef.current) {
              controlsRef.current.target.copy(characterRef.current.object.position);
            }
          } else if (characterRef.current.direction.z < 0) { // Moving up (character facing away)
            const cameraOffset = new THREE.Vector3(0, 35, 65);
            const targetCameraPos = characterRef.current.object.position.clone().add(cameraOffset);
            if (cameraRef.current) {
              cameraRef.current.position.copy(targetCameraPos);
              cameraRef.current.lookAt(characterRef.current.object.position);
            }
            if (controlsRef.current) {
              controlsRef.current.target.copy(characterRef.current.object.position);
            }
          } else if (characterRef.current.direction.x !== 0) { // Moving left/right
            const cameraOffset = new THREE.Vector3(0, 35, 65);
            const targetCameraPos = characterRef.current.object.position.clone().add(cameraOffset);
            if (cameraRef.current) {
              cameraRef.current.position.copy(targetCameraPos);
              cameraRef.current.lookAt(characterRef.current.object.position);
            }
            if (controlsRef.current) {
              controlsRef.current.target.copy(characterRef.current.object.position);
            }
            if (characterRef.current.object) {
              characterRef.current.object.rotation.y = Math.PI;
            }
          }
          // Reset camera zoom and angle limits when outside
          if (controlsRef.current) {
            controlsRef.current.minDistance = 30;
            controlsRef.current.maxDistance = 150;
            controlsRef.current.minPolarAngle = 0;
            controlsRef.current.maxPolarAngle = Math.PI / 2;
            controlsRef.current.minAzimuthAngle = -Math.PI / 2;
            controlsRef.current.maxAzimuthAngle = Math.PI / 2;
            controlsRef.current.update(); // Added update here
          }
        }

        // Poodle movement logic
        const minPoodleDistance = 25; // Minimum allowed distance between poodle and character
        const maxPoodleDistance = 45; // Maximum distance before poodle starts following
        if (poodle.object && characterRef.current.object) {
          // Calculate intended next position for poodle
          let poodleNextPos = poodle.object.position.clone();
          const currentDistance = poodle.object.position.distanceTo(characterRef.current.object.position);
          
          if (characterRef.current.isWalking) {
            // Poodle follows character but maintains distance
            if (currentDistance > maxPoodleDistance) {
              // If too far, move closer
              poodle.targetPosition.copy(characterRef.current.object.position).add(new THREE.Vector3(3, 0, 0));
              poodle.targetPosition.y = 10; // Keep y position at 10
            } else if (currentDistance < minPoodleDistance) {
              // If too close, move away
              const awayDirection = poodle.object.position.clone().sub(characterRef.current.object.position).normalize();
              poodle.targetPosition.copy(characterRef.current.object.position).add(awayDirection.multiplyScalar(minPoodleDistance));
              poodle.targetPosition.y = 10; // Keep y position at 10
            } else {
              // Maintain current distance
              poodle.targetPosition.copy(poodle.object.position);
            }
          }
          
          const direction = poodle.targetPosition.clone().sub(poodle.object.position);
          if (direction.length() > 0.1) {
            direction.normalize();
            poodleNextPos.add(direction.multiplyScalar(poodle.walkSpeed * delta));
            
            // Restrict poodle to centerBox with fixed y-value
            if (isInHouse && centerBox instanceof THREE.Mesh) {
              // Keep poodle's y position at 10
              poodleNextPos.y = 10;
              
              // Only allow movement if next position is inside centerBox
              if (Math.abs(poodleNextPos.x - center.x) <= centerSize.x / 2 &&
                  Math.abs(poodleNextPos.z - center.z) <= centerSize.z / 2) {
                poodle.object.position.copy(poodleNextPos);
              }
            } else {
              // Normal movement outside house
              poodleNextPos.y = 10; // Keep y position at 10
              poodle.object.position.copy(poodleNextPos);
            }
            
            // Make poodle face movement direction
            poodle.object.rotation.y = Math.atan2(direction.x, direction.z);
          }
        } else {
          // Random walk behavior when character is not moving
          if (poodle.object) {
            poodle.timeToNewTarget -= delta;
            
            // Get new random target position when timer expires or close to current target
            if (poodle.timeToNewTarget <= 0 || 
                poodle.object.position.distanceTo(poodle.targetPosition) < 0.5) {
              poodle.targetPosition.copy(getRandomPosition());
              poodle.targetPosition.y = 10; // Keep y position at 10
              poodle.timeToNewTarget = 3 + Math.random() * 2; // Random time between 3-5 seconds
            }

            // Move towards target position
            const direction = poodle.targetPosition.clone().sub(poodle.object.position);
            if (direction.length() > 0.1) {
              direction.normalize();
              poodle.object.position.add(direction.multiplyScalar(poodle.walkSpeed * delta));
              poodle.object.position.y = 10; // Keep y position at 10
              // Make poodle face movement direction
              poodle.object.rotation.y = Math.atan2(direction.x, direction.z);
            }
          }
        }
      } else {
        // Random walk behavior when character is not moving
        if (poodle.object) {
          poodle.timeToNewTarget -= delta;
          
          // Get new random target position when timer expires or close to current target
          if (poodle.timeToNewTarget <= 0 || 
              poodle.object.position.distanceTo(poodle.targetPosition) < 0.5) {
            poodle.targetPosition.copy(getRandomPosition());
            poodle.targetPosition.y = 10; // Keep y position at 10
            poodle.timeToNewTarget = 3 + Math.random() * 2; // Random time between 3-5 seconds
          }

          // Move towards target position
          const direction = poodle.targetPosition.clone().sub(poodle.object.position);
          if (direction.length() > 0.1) {
            direction.normalize();
            poodle.object.position.add(direction.multiplyScalar(poodle.walkSpeed * delta));
            poodle.object.position.y = 10; // Keep y position at 10
            // Make poodle face movement direction
            poodle.object.rotation.y = Math.atan2(direction.x, direction.z);
          }
        }
      }

      // Update animations
      if (characterRef.current.mixer) {
        characterRef.current.mixer.update(delta);
      }
      if (poodle.mixer) {
        poodle.mixer.update(delta);
      }
      if (robotMixerRef.current) {
        robotMixerRef.current.update(delta);
      }

      // If camera is locked to chat view, ensure it maintains the correct position
      if (isCameraLockedToChat && robotScreenRef.current) {
        const screenPosition = robotScreenRef.current.position.clone();
        if (controlsRef.current) {
          controlsRef.current.target.copy(screenPosition);
          controlsRef.current.minDistance = 30;
          controlsRef.current.maxDistance = 50;
          controlsRef.current.minPolarAngle = Math.PI / 4;
          controlsRef.current.maxPolarAngle = Math.PI / 2;
          // Update will be handled by the final controls.update() or if specific immediate effect needed
        }
      } else {
        // Normal camera controls when not chatting
        if (controlsRef.current) {
          // These limits should be consistent with the "outside house" general limits
          controlsRef.current.minDistance = 30; 
          controlsRef.current.maxDistance = 150;
          controlsRef.current.minPolarAngle = 0;
          controlsRef.current.maxPolarAngle = Math.PI / 2; 
          controlsRef.current.minAzimuthAngle = -Math.PI / 2; // Ensure these are also set if they can vary
          controlsRef.current.maxAzimuthAngle = Math.PI / 2;   // Ensure these are also set
          controlsRef.current.update(); // Added update here
        }
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };

    animate();

    // Update handleResize function
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update camera
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Update renderer
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Update controls
      if (width < 768) {
        controls.minDistance = 30;
        controls.maxDistance = 100;
        controls.maxPolarAngle = Math.PI / 2;
      } else {
        controls.minDistance = 30;
        controls.maxDistance = 150;
        controls.maxPolarAngle = Math.PI / 2;
      }
      controls.update();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      // Remove event listeners
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      // Dispose of scene resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else if (object.material) {
              object.material.dispose();
            }
          }
        });
      }

      // Dispose of renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // Stop animations
      if (characterRef.current.mixer) {
        characterRef.current.mixer.stopAllAction();
      }
      if (poodle.mixer) {
        poodle.mixer.stopAllAction();
      }
      if (robotMixerRef.current) {
        robotMixerRef.current.stopAllAction();
      }

      // Dispose of controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      // Clear the mount point
      if (mountRef.current) {
        while (mountRef.current.firstChild) {
          mountRef.current.removeChild(mountRef.current.firstChild);
        }
      }
    };
  }, [isMounted, windowSize]); // Add windowSize to dependencies

  // Update screen visibility when state changes
  useEffect(() => {
    if (robotScreenRef.current) {
      robotScreenRef.current.visible = showRobotScreen;
    }
    if (robotBorderPlaneRef.current) {
      robotBorderPlaneRef.current.visible = showRobotScreen;
    }
    if (robotBorderRef.current) {
      robotBorderRef.current.visible = showRobotScreen;
    }
  }, [showRobotScreen]);

  // Add this useEffect for project images:
  useEffect(() => {
    if (!sceneRef.current) return;
    // Remove all project images
    sceneRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.name.startsWith('project')) {
        sceneRef.current?.remove(obj);
      }
    });

  }, [showProjects]);

  // Add this useEffect for start/pause models:
  useEffect(() => {
    if (!sceneRef.current) return;
    // Remove start and pause models
    if (startModelRef.current) sceneRef.current?.remove(startModelRef.current);
    if (pauseModelRef.current) sceneRef.current?.remove(pauseModelRef.current);
    const gltfLoader = new GLTFLoader();
    if (showStart) {
      gltfLoader.load('/house/start.glb', (gltf2) => {
        const startModel = gltf2.scene;
        startModel.name = 'startModel';
        startModel.scale.set(5, 5, 5);
        startModel.position.set(37, 60, -66);
        startModel.rotateY(-Math.PI / 4);
        sceneRef.current?.add(startModel);
        startModelRef.current = startModel;
      });
    }
    if (showPause) {
      gltfLoader.load('/house/pause.glb', (gltf2) => {
        const pauseModel = gltf2.scene;
        pauseModel.name = 'pauseModel';
        pauseModel.scale.set(5, 5, 5);
        pauseModel.position.set(37, 60, -66);
        pauseModel.rotateY(-Math.PI / 4);
        sceneRef.current?.add(pauseModel);
        pauseModelRef.current = pauseModel;
      });
    }
  }, [showStart, showPause]);

  // Function to create AboutMe texture
  const createAboutMeTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text styles
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // Title
    ctx.font = 'bold 48px Arial';
    ctx.fillText('Leong Ee Mun', canvas.width / 2, 80);

    // About text
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    const text = [
      "Hello, I'm Ee Mun Leong, a passionate developer with a creative mindset. I specialize in building dynamic, interactive web experiences using modern technologies like React, Next.js, Node.js, and Three.js. My approach combines technical expertise with a strong sense of design, resulting in projects that are both visually appealing and highly functional.",
      "I enjoy solving complex problems, learning new technologies, and collaborating on innovative projects. Whether it's developing web applications, creating 3D animations, or designing user interfaces, I strive to deliver work that exceeds expectations.",
      "Feel free to explore my projects below or get in touch if you'd like to collaborate!"
    ];

    const lineHeight = 32;
    const margin = 50;
    const maxWidth = canvas.width - (margin * 2);

    text.forEach((paragraph, index) => {
      const words = paragraph.split(' ');
      let line = '';
      let y = 150 + (index * 200);

      words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, margin, y);
          line = word + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, margin, y);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // Update the robot screen material when showRobotScreen changes
  useEffect(() => {
    if (robotScreenRef.current) {
      if (showRobotScreen) {
        if (!aboutMeTextureRef.current) {
          aboutMeTextureRef.current = createAboutMeTexture();
        }
        if (aboutMeTextureRef.current) {
          (robotScreenRef.current.material as THREE.MeshStandardMaterial).map = aboutMeTextureRef.current;
          (robotScreenRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      } else {
        (robotScreenRef.current.material as THREE.MeshStandardMaterial).map = null;
        (robotScreenRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
      }
    }
  }, [showRobotScreen]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {isInInnerBox && (
        <div style={{
          position: 'absolute',
          bottom: windowSize.width < 768 ? '10px' : '20px',
          right: windowSize.width < 768 ? '10px' : '20px',
          transform: 'none',
          display: 'flex',
          flexDirection: windowSize.width < 768 ? 'column' : 'column',
          gap: windowSize.width < 768 ? '10px' : '20px',
          zIndex: 1000,
          padding: windowSize.width < 768 ? '10px' : '0',
          alignItems: 'flex-end'
        }}>
          <button
            onClick={() => {
              if (characterRef.current.object && cameraRef.current && controlsRef.current) {
                // Move character outside the house
                const targetPosition = new THREE.Vector3(60, 28, 150);
                characterRef.current.object.position.copy(targetPosition);
                setIsInInnerBox(false);

                // Animate camera to follow character
                const cameraOffset = new THREE.Vector3(0, 35, 65);
                const targetCameraPos = targetPosition.clone().add(cameraOffset);
                const startPos = cameraRef.current.position.clone();
                const startRot = cameraRef.current.rotation.clone();

                // Set up lookAt rotation
                cameraRef.current.position.copy(targetCameraPos);
                cameraRef.current.lookAt(targetPosition);
                const endRot = cameraRef.current.rotation.clone();
                cameraRef.current.position.copy(startPos);
                cameraRef.current.rotation.copy(startRot);

                // Animate camera movement
                const duration = 1000;
                const startTime = Date.now();
                const animateCamera = () => {
                  const now = Date.now();
                  const elapsed = now - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  const ease = (t: number) => t * t * (3 - 2 * t);
                  const t = ease(progress);
                  cameraRef.current?.position.lerpVectors(startPos, targetCameraPos, t);
                  if (cameraRef.current) {
                    cameraRef.current.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
                    cameraRef.current.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
                    cameraRef.current.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
                  }
                  if (progress < 1) {
                    requestAnimationFrame(animateCamera);
                  }
                };
                animateCamera();

                // Update controls to target the character
                controlsRef.current.target.copy(targetPosition);
                controlsRef.current.minDistance = 30;
                controlsRef.current.maxDistance = 150;
                controlsRef.current.maxPolarAngle = Math.PI / 2;
                controlsRef.current.update();
              }
            }}
            style={{
              padding: windowSize.width < 768 ? '8px 16px' : '10px 20px',
              backgroundImage: 'url(/frame/button_frame.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              color: '#d75bbb',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: windowSize.width < 768 ? '14px' : '16px',
              fontWeight: 'bold',
              width: windowSize.width < 768 ? '120px' : '150px',
              height: windowSize.width < 768 ? '40px' : '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}
          >
            Exit House
          </button>
          <button
            onClick={() => {
              setShowRobotScreen(prev => {
                const newShowRobotScreen = !prev;
                setIsCameraLockedToChat(newShowRobotScreen);

                if (robotScreenRef.current && cameraRef.current && controlsRef.current) {
                  if (newShowRobotScreen) {
                    // Opening: move camera to view screen
                    const screenPosition = robotScreenRef.current.position.clone();
                    const cameraOffset = new THREE.Vector3(-20, 5, 20);
                    const targetCameraPos = screenPosition.clone().add(cameraOffset);
                    const startPos = cameraRef.current.position.clone();
                    const startRot = cameraRef.current.rotation.clone();
                    const endRot = new THREE.Euler();
                    cameraRef.current.position.copy(targetCameraPos);
                    cameraRef.current.lookAt(screenPosition);
                    endRot.copy(cameraRef.current.rotation);
                    cameraRef.current.position.copy(startPos);
                    cameraRef.current.rotation.copy(startRot);

                    // Animate camera movement
                    const duration = 1000;
                    const startTime = Date.now();
                    const animateCamera = () => {
                      const now = Date.now();
                      const elapsed = now - startTime;
                      const progress = Math.min(elapsed / duration, 1);
                      const ease = (t: number) => t * t * (3 - 2 * t);
                      const t = ease(progress);
                      cameraRef.current?.position.lerpVectors(startPos, targetCameraPos, t);
                      if (cameraRef.current) {
                        cameraRef.current.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
                        cameraRef.current.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
                        cameraRef.current.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
                      }
                      if (progress < 1) {
                        requestAnimationFrame(animateCamera);
                      }
                    };
                    animateCamera();
                    controlsRef.current.target.copy(screenPosition);
                    controlsRef.current.minDistance = 30;
                    controlsRef.current.maxDistance = 50;
                    controlsRef.current.update();
                  } else {
                    // Closing: move camera back to character position
                    if (characterRef.current.object) {
                      const charPos = characterRef.current.object.position.clone();
                      const cameraOffset = new THREE.Vector3(0, 35, 65);
                      const targetCameraPos = charPos.clone().add(cameraOffset);
                      const startPos = cameraRef.current.position.clone();
                      const startRot = cameraRef.current.rotation.clone();

                      // Set up lookAt rotation
                      cameraRef.current.position.copy(targetCameraPos);
                      cameraRef.current.lookAt(charPos);
                      const endRot = cameraRef.current.rotation.clone();
                      cameraRef.current.position.copy(startPos);
                      cameraRef.current.rotation.copy(startRot);

                      // Animate camera movement
                      const duration = 1000;
                      const startTime = Date.now();
                      const animateCamera = () => {
                        const now = Date.now();
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const ease = (t: number) => t * t * (3 - 2 * t);
                        const t = ease(progress);
                        cameraRef.current?.position.lerpVectors(startPos, targetCameraPos, t);
                        if (cameraRef.current) {
                          cameraRef.current.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
                          cameraRef.current.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
                          cameraRef.current.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
                        }
                        if (progress < 1) {
                          requestAnimationFrame(animateCamera);
                        }
                      };
                      animateCamera();

                      // Update controls to target the character
                      controlsRef.current.target.copy(charPos);
                      controlsRef.current.minDistance = 30;
                      controlsRef.current.maxDistance = 150;
                      controlsRef.current.maxPolarAngle = Math.PI / 2;
                      controlsRef.current.update();
                    }
                  }
                }
                return newShowRobotScreen;
              });
            }}
            style={{
              padding: windowSize.width < 768 ? '8px 16px' : '10px 20px',
              backgroundImage: 'url(/frame/button_frame.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              color: '#d75bbb',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: windowSize.width < 768 ? '14px' : '16px',
              fontWeight: 'bold',
              width: windowSize.width < 768 ? '120px' : '150px',
              height: windowSize.width < 768 ? '40px' : '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}
          >
            About Me
          </button>
          <button
            onClick={() => {
              setShowStart(prev => {
                const newShowStart = !prev;
                setShowPause(!newShowStart);

                // Find the projector screen mesh in the scene
                const projectorScreen = sceneRef.current?.getObjectByName('projectorScreen') as THREE.Mesh;
                if (projectorScreen && cameraRef.current && controlsRef.current) {
                  if (!newShowStart) {
                    // Opening: move camera to view screen
                    const screenPos = projectorScreen.position.clone();
                    const cameraOffset = new THREE.Vector3(0, 0, 45);
                    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), projectorScreen.rotation.y);
                    const targetCameraPos = screenPos.clone().add(cameraOffset);
                    const startPos = cameraRef.current.position.clone();
                    const startRot = cameraRef.current.rotation.clone();

                    // Set up lookAt rotation
                    cameraRef.current.position.copy(targetCameraPos);
                    cameraRef.current.lookAt(screenPos);
                    const endRot = cameraRef.current.rotation.clone();
                    cameraRef.current.position.copy(startPos);
                    cameraRef.current.rotation.copy(startRot);

                    // Animate camera movement
                    const duration = 1000;
                    const startTime = Date.now();
                    const animateCamera = () => {
                      const now = Date.now();
                      const elapsed = now - startTime;
                      const progress = Math.min(elapsed / duration, 1);
                      const ease = (t: number) => t * t * (3 - 2 * t);
                      const t = ease(progress);
                      cameraRef.current?.position.lerpVectors(startPos, targetCameraPos, t);
                      if (cameraRef.current) {
                        cameraRef.current.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
                        cameraRef.current.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
                        cameraRef.current.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
                      }
                      if (progress < 1) {
                        requestAnimationFrame(animateCamera);
                      }
                    };
                    animateCamera();

                    // Update controls to target the screen
                    controlsRef.current.target.copy(screenPos);
                    controlsRef.current.minDistance = 30;
                    controlsRef.current.maxDistance = 80;
                    controlsRef.current.update();
                  } else {
                    // Closing: move camera back to character position
                    if (characterRef.current.object) {
                      const charPos = characterRef.current.object.position.clone();
                      const cameraOffset = new THREE.Vector3(0, 35, 65);
                      const targetCameraPos = charPos.clone().add(cameraOffset);
                      const startPos = cameraRef.current.position.clone();
                      const startRot = cameraRef.current.rotation.clone();

                      // Set up lookAt rotation
                      cameraRef.current.position.copy(targetCameraPos);
                      cameraRef.current.lookAt(charPos);
                      const endRot = cameraRef.current.rotation.clone();
                      cameraRef.current.position.copy(startPos);
                      cameraRef.current.rotation.copy(startRot);

                      // Animate camera movement
                      const duration = 1000;
                      const startTime = Date.now();
                      const animateCamera = () => {
                        const now = Date.now();
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const ease = (t: number) => t * t * (3 - 2 * t);
                        const t = ease(progress);
                        cameraRef.current?.position.lerpVectors(startPos, targetCameraPos, t);
                        if (cameraRef.current) {
                          cameraRef.current.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
                          cameraRef.current.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
                          cameraRef.current.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
                        }
                        if (progress < 1) {
                          requestAnimationFrame(animateCamera);
                        }
                      };
                      animateCamera();

                      // Update controls to target the character
                      controlsRef.current.target.copy(charPos);
                      controlsRef.current.minDistance = 30;
                      controlsRef.current.maxDistance = 150;
                      controlsRef.current.maxPolarAngle = Math.PI / 2;
                      controlsRef.current.update();
                    }
                  }
                }
                return newShowStart;
              });
            }}
            style={{
              padding: windowSize.width < 768 ? '8px 16px' : '10px 20px',
              backgroundImage: 'url(/frame/button_frame.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              color: '#d75bbb',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: windowSize.width < 768 ? '14px' : '16px',
              fontWeight: 'bold',
              width: windowSize.width < 768 ? '120px' : '150px',
              height: windowSize.width < 768 ? '40px' : '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}
          >
            My Projects
          </button>
          <button
            onClick={() => {
              // Find the achievements screen mesh in the scene
              const achievementsScreen = sceneRef.current?.getObjectByName('achievementsScreen') as THREE.Mesh;
              if (achievementsScreen && cameraRef.current && controlsRef.current) {
                // Toggle between achievements screen and character position
                const isViewingAchievements = cameraRef.current.position.distanceTo(achievementsScreen.position) < 100;
                
                if (!isViewingAchievements) {
                  // Move camera to view achievements screen
                  const screenPos = achievementsScreen.position.clone();
                  const cameraOffset = new THREE.Vector3(0, 0, 45);
                  cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), achievementsScreen.rotation.y);
                  const targetCameraPos = screenPos.clone().add(cameraOffset);
                  const startPos = cameraRef.current.position.clone();
                  const startRot = cameraRef.current.rotation.clone();

                  // Set up lookAt rotation
                  cameraRef.current.position.copy(targetCameraPos);
                  cameraRef.current.lookAt(screenPos);
                  const endRot = cameraRef.current.rotation.clone();
                  cameraRef.current.position.copy(startPos);
                  cameraRef.current.rotation.copy(startRot);

                  // Animate camera movement
                  const duration = 1000;
                  const startTime = Date.now();
                  const animateCamera = () => {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const ease = (t: number) => t * t * (3 - 2 * t);
                    const t = ease(progress);
                    cameraRef.current?.position.lerpVectors(startPos, targetCameraPos, t);
                    if (cameraRef.current) {
                      cameraRef.current.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
                      cameraRef.current.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
                      cameraRef.current.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
                    }
                    if (progress < 1) {
                      requestAnimationFrame(animateCamera);
                    }
                  };
                  animateCamera();

                  // Update controls to target the screen
                  controlsRef.current.target.copy(screenPos);
                  controlsRef.current.minDistance = 30;
                  controlsRef.current.maxDistance = 80;
                  controlsRef.current.update();
                } else {
                  // Return to character position
                  if (characterRef.current.object) {
                    const charPos = characterRef.current.object.position.clone();
                    const cameraOffset = new THREE.Vector3(0, 35, 65);
                    const targetCameraPos = charPos.clone().add(cameraOffset);
                    const startPos = cameraRef.current.position.clone();
                    const startRot = cameraRef.current.rotation.clone();

                    // Set up lookAt rotation
                    cameraRef.current.position.copy(targetCameraPos);
                    cameraRef.current.lookAt(charPos);
                    const endRot = cameraRef.current.rotation.clone();
                    cameraRef.current.position.copy(startPos);
                    cameraRef.current.rotation.copy(startRot);

                    // Animate camera movement
                    const duration = 1000;
                    const startTime = Date.now();
                    const animateCamera = () => {
                      const now = Date.now();
                      const elapsed = now - startTime;
                      const progress = Math.min(elapsed / duration, 1);
                      const ease = (t: number) => t * t * (3 - 2 * t);
                      const t = ease(progress);
                      cameraRef.current?.position.lerpVectors(startPos, targetCameraPos, t);
                      if (cameraRef.current) {
                        cameraRef.current.rotation.x = startRot.x + (endRot.x - startRot.x) * t;
                        cameraRef.current.rotation.y = startRot.y + (endRot.y - startRot.y) * t;
                        cameraRef.current.rotation.z = startRot.z + (endRot.z - startRot.z) * t;
                      }
                      if (progress < 1) {
                        requestAnimationFrame(animateCamera);
                      }
                    };
                    animateCamera();

                    // Update controls to target the character
                    controlsRef.current.target.copy(charPos);
                    controlsRef.current.minDistance = 30;
                    controlsRef.current.maxDistance = 150;
                    controlsRef.current.maxPolarAngle = Math.PI / 2;
                    controlsRef.current.update();
                  }
                }
              }
            }}
            style={{
              padding: windowSize.width < 768 ? '8px 16px' : '10px 20px',
              backgroundImage: 'url(/frame/button_frame.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              color: '#d75bbb',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: windowSize.width < 768 ? '14px' : '16px',
              fontWeight: 'bold',
              width: windowSize.width < 768 ? '120px' : '150px',
              height: windowSize.width < 768 ? '40px' : '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}
          >
            Awards
          </button>

          {/* Directional Controls */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            marginTop: '20px'
          }}>
            {/* Up Button */}
            <button
              onMouseDown={() => {
                if (!characterRef.current.isWalking) {
                  characterRef.current.isWalking = true;
                  characterRef.current.direction.z = -1;
                  if (characterRef.current.object) characterRef.current.object.rotation.y = Math.PI;
                }
              }}
              onMouseUp={() => {
                characterRef.current.direction.z = 0;
                if (characterRef.current.direction.x === 0 && characterRef.current.direction.z === 0) {
                  characterRef.current.isWalking = false;
                }
              }}
              style={{
                padding: '10px',
                backgroundImage: 'url(/frame/button_frame.png)',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                color: '#d75bbb',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              ↑
            </button>
            
            {/* Middle Row */}
            <div style={{ display: 'flex', gap: '5px' }}>
              {/* Left Button */}
              <button
                onMouseDown={() => {
                  if (!characterRef.current.isWalking) {
                    characterRef.current.isWalking = true;
                    characterRef.current.direction.x = -1;
                    if (characterRef.current.object) characterRef.current.object.rotation.y = -Math.PI / 2;
                  }
                }}
                onMouseUp={() => {
                  characterRef.current.direction.x = 0;
                  if (characterRef.current.direction.x === 0 && characterRef.current.direction.z === 0) {
                    characterRef.current.isWalking = false;
                  }
                }}
                style={{
                  padding: '10px',
                  backgroundImage: 'url(/frame/button_frame.png)',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  color: '#d75bbb',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}
              >
                ←
              </button>

              {/* Down Button */}
              <button
                onMouseDown={() => {
                  if (!characterRef.current.isWalking) {
                    characterRef.current.isWalking = true;
                    characterRef.current.direction.z = 1;
                    if (characterRef.current.object) characterRef.current.object.rotation.y = 0;
                  }
                }}
                onMouseUp={() => {
                  characterRef.current.direction.z = 0;
                  if (characterRef.current.direction.x === 0 && characterRef.current.direction.z === 0) {
                    characterRef.current.isWalking = false;
                  }
                }}
                style={{
                  padding: '10px',
                  backgroundImage: 'url(/frame/button_frame.png)',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  color: '#d75bbb',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}
              >
                ↓
              </button>

              {/* Right Button */}
              <button
                onMouseDown={() => {
                  if (!characterRef.current.isWalking) {
                    characterRef.current.isWalking = true;
                    characterRef.current.direction.x = 1;
                    if (characterRef.current.object) characterRef.current.object.rotation.y = Math.PI / 2;
                  }
                }}
                onMouseUp={() => {
                  characterRef.current.direction.x = 0;
                  if (characterRef.current.direction.x === 0 && characterRef.current.direction.z === 0) {
                    characterRef.current.isWalking = false;
                  }
                }}
                style={{
                  padding: '10px',
                  backgroundImage: 'url(/frame/button_frame.png)',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  color: '#d75bbb',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scene; 