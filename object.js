const objectFragmentShader = `
    precision highp float;

    uniform float u_time;
    uniform float u_morphProgress;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                   mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float pattern(vec2 st, float time) {
        vec2 pos = st * 10.0;
        float pattern = pos.x;

        // Rotate the position
        float angle = noise(pos + time) * 3.14159 * 2.0;
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        pos = rot * pos;

        // Create lines
        pattern = abs(sin(pos.x * 3.14159));
        pattern = smoothstep(0.0, 0.1, pattern);

        return pattern;
    }

    vec3 light(vec3 color, vec3 normal, vec3 lightDir, vec3 viewDir) {
        float ambient = 0.3;
        float diffuse = max(dot(normal, lightDir), 0.0);
        float specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 32.0);
        return color * (ambient + diffuse) + vec3(0.5) * specular;
    }

    void main() {
        vec2 st = vUv;

        float pat = pattern(st, u_time * 0.1);

        vec3 color1 = vec3(0.8, 0.2, 0.8); // Purple
        vec3 color2 = vec3(0.2, 0.8, 0.8); // Cyan
        vec3 baseColor = mix(color1, color2, pat);

        // Make it spiky
        baseColor *= 1.0 + pow(pat, 5.0) * 2.0;

        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
        vec3 finalColor = light(baseColor, normal, lightDir, viewDir);

        // Smooth highlight for morphing progress
        float highlight = smoothstep(0.9, 1.0, sin(u_morphProgress * 3.14159 * 2.0));
        finalColor += vec3(0.2) * highlight;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

const objectVertexShader = `
    uniform float u_morphProgress;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    
    // Improved letter shapes
    vec2 letterD(vec2 p) {
        float d = length(p - vec2(0.3, 0.0)) - 0.5;
        d = max(d, -p.x);
        return vec2(p.x, d);
    }

    vec2 letterB(vec2 p) {
        p.x = abs(p.x);
        float d1 = length(p - vec2(0.25, 0.25)) - 0.25;
        float d2 = length(p - vec2(0.25, -0.25)) - 0.25;
        float d3 = p.x;
        return vec2(p.x, min(min(d1, d2), d3));
    }

    vec2 letterF(vec2 p) {
        float d = max(p.x, max(abs(p.y) - 0.5, abs(p.x - 0.25) - 0.25));
        d = min(d, max(p.x - 0.25, abs(p.y - 0.25) - 0.1));
        return vec2(p.x, d);
    }

    vec2 letterG(vec2 p) {
        float d = length(p) - 0.5;
        d = max(d, -length(p - vec2(0.2, -0.1)) + 0.3);
        d = min(d, max(p.x - 0.1, abs(p.y + 0.2) - 0.1));
        return vec2(p.x, d);
    }
    
    vec2 morphShape(vec2 p, float progress) {
        vec2 original = p;
        vec2 d = letterD(p);
        vec2 b = letterB(p);
        vec2 f = letterF(p);
        vec2 g = letterG(p);
        
        vec2 morphed = mix(original, d, smoothstep(0.0, 0.25, progress));
        morphed = mix(morphed, b, smoothstep(0.25, 0.5, progress));
        morphed = mix(morphed, f, smoothstep(0.5, 0.75, progress));
        morphed = mix(morphed, g, smoothstep(0.75, 1.0, progress));
        
        return morphed;
    }
    
    void main() {
        vUv = uv;
        
        // Apply morphing
        vec2 morphedPosition = morphShape(position.xy, u_morphProgress);
        vec3 newPosition = vec3(morphedPosition, position.z);
        
        // Recalculate normal
        vec3 tangent = normalize(vec3(1.0, 0.0, 0.0));
        vec3 bitangent = normalize(vec3(0.0, 1.0, 0.0));
        vNormal = normalize(cross(tangent, bitangent));
        
        vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

let leftObjectScene, leftObjectCamera, leftObjectRenderer, leftAnimatedObject, leftObjectMaterial;
let rightObjectScene, rightObjectCamera, rightObjectRenderer, rightAnimatedObject, rightObjectMaterial;
let material;

function initAnimatedObjects() {
    console.log("Initializing animated objects");

    // Initialize left object
    leftObjectScene = new THREE.Scene();
    leftObjectCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    leftObjectCamera.position.z = 7.5;

    leftObjectRenderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('animated-object-left'),
        alpha: true,
        antialias: true,
    });
    leftObjectRenderer.setSize(2000, 2000);

    // Initialize right object
    rightObjectScene = new THREE.Scene();
    rightObjectCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    rightObjectCamera.position.z = 7.5;

    rightObjectRenderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('animated-object-right'),
        alpha: true,
        antialias: true,
    });
    rightObjectRenderer.setSize(2000, 2000);

    const sphereGeometry = new THREE.SphereGeometry(1, 128, 128);

    console.log("Sphere geometry created");

    material = new THREE.ShaderMaterial({
        vertexShader: objectVertexShader,
        fragmentShader: objectFragmentShader,
        uniforms: {
            u_time: {value: 0},
            u_morphProgress: {value: 0}
        }
    });


    leftObjectMaterial = material;
    rightObjectMaterial = material;

    leftAnimatedObject = new THREE.Mesh(sphereGeometry.clone(), leftObjectMaterial);
    rightAnimatedObject = new THREE.Mesh(sphereGeometry.clone(), rightObjectMaterial);

    leftObjectScene.add(leftAnimatedObject);
    rightObjectScene.add(rightAnimatedObject);

    console.log("Animated objects added to scenes");
}

function animateObjects(timeInSeconds) {
    if (leftObjectMaterial && leftObjectMaterial.uniforms) {
        material.uniforms.u_time.value += timeInSeconds;
        // leftObjectMaterial.uniforms.u_time.value = timeInSeconds;
        // leftObjectMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    }
    // if (rightObjectMaterial && rightObjectMaterial.uniforms) {
    //     rightObjectMaterial.uniforms.time.value = timeInSeconds;
    //     rightObjectMaterial.uniforms.u_time.value = timeInSeconds;
    //     rightObjectMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    // }

    // if (leftObjectRenderer && leftObjectScene && leftObjectCamera) {
    //     leftObjectRenderer.render(leftObjectScene, leftObjectCamera);
    // }
    // if (rightObjectRenderer && rightObjectScene && rightObjectCamera) {
    //     rightObjectRenderer.render(rightObjectScene, rightObjectCamera);
    // }
}

function updateMorphProgress(currentStep, totalSteps) {
    if (currentStep < totalSteps) {
        const progress = currentStep / totalSteps;
        material.uniforms.u_morphProgress.value = progress;
        console.log(`Morph progress: ${progress}`);
    }
}

// Function to update time uniform (call this in your animation loop)
function updateTime(deltaTime) {
    material.uniforms.u_time.value += deltaTime;
}

// Export these functions
window.initAnimatedObjects = initAnimatedObjects;
window.animateObjects = animateObjects;
window.updateMorphProgress = updateMorphProgress;