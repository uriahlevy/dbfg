function initRenderer() {
    if (isWebGLAvailable()) {
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('holographic-background'),
                alpha: true,
                antialias: true // Added for smoother lines
            });
            updateVersionLabel(true);
        } catch (e) {
            console.warn("WebGL initialization failed, falling back to CSS3DRenderer");
            showWebGLInstructions();
            updateVersionLabel(false);
            return tryCSS3DRenderer();
        }
    } else {
        console.warn("WebGL not supported, falling back to CSS3DRenderer");
        showWebGLInstructions();
        updateVersionLabel(false);
        return tryCSS3DRenderer();
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // For sharper rendering
    return true;
}

function tryCSS3DRenderer() {
    try {
        renderer = new THREE.CSS3DRenderer();
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        document.body.appendChild(renderer.domElement);
        return true;
    } catch (e) {
        console.warn("CSS3DRenderer not supported, falling back to CSS animation");
        useCSSFallback();
        return false;
    }
}

const vertexShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
        vUv = uv;
        vPosition = position;
        
        vec3 pos = position;
        
        // Add more complex movement
        float wave = sin(pos.x * 2.0 + time) * cos(pos.y * 2.0 + time) * 0.1;
        pos.z += wave;
        
        // Add some swirling motion
        float angle = length(pos.xy) * 0.5 + time * 0.5;
        pos.xy += vec2(sin(angle), cos(angle)) * 0.1;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const fragmentShader = `
    uniform sampler2D fabricTexture;
uniform float time;
varying vec2 vUv;

// Function to convert HSL to RGB
vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main() {
    vec2 uv = vUv;
    
    // Animate the UV coordinates for a subtle movement effect
    uv.y += sin(uv.x * 10.0 + time * 0.5) * 0.04;
    uv.x += cos(uv.y * 10.0 + time * 0.5) * 0.04;
    
    // Sample the fabric texture
    vec4 fabricColor = texture2D(fabricTexture, uv);
    
    // Create radial gradient
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center) * 2.0;
    
    // Create eccentric color palette
    float hueShift = sin(time * 0.2) * 0.1; // Subtle hue shift over time
    vec3 color1 = hsl2rgb(vec3(0.7 + hueShift, 0.9, 0.6));     // Vibrant purple
    vec3 color2 = hsl2rgb(vec3(0.9 + hueShift, 0.9, 0.5));     // Vibrant pink
    vec3 color3 = hsl2rgb(vec3(0.1 + hueShift, 0.9, 0.4));     // Vibrant orange
    vec3 color4 = hsl2rgb(vec3(0.3 + hueShift, 0.9, 0.3));     // Vibrant green
    
    vec3 gradientColor;
    if (dist < 0.5) {
        gradientColor = mix(color1, color2, dist * 2.0);
    } else if (dist < 0.75) {
        gradientColor = mix(color2, color3, (dist - 0.5) * 4.0);
    } else {
        gradientColor = mix(color3, color4, (dist - 0.75) * 4.0);
    }
    
    // Blend the gradient color with the fabric texture
    vec3 finalColor = gradientColor * (fabricColor.rgb * 0.7 + 0.3);
    
    // Boost overall brightness and saturation
    finalColor = pow(finalColor, vec3(0.9)); // Increase brightness
    finalColor = mix(finalColor, vec3(dot(finalColor, vec3(0.299, 0.587, 0.114))), -0.2); // Boost saturation
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        let webglAvailable = !!(window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        dataLayer.push({
            'event': 'webgl_available',
            'event_category': 'engagement'
        });
        return webglAvailable;
    } catch (e) {
        dataLayer.push({
            'event': 'webgl_unavailable',
            'event_category': 'engagement'
        });
        return false;
    }
}

function showWebGLInstructions() {
    dataLayer.push({
        'event': 'webgl_instructions_shown',
        'event_category': 'engagement'
    });
    const divToHide = document.querySelector('.key-container-wrapper');
    if (divToHide) {
        divToHide.style.display = 'none';
    }
    const instructionsElement = document.getElementById('webgl-instructions');
    if (instructionsElement) {
        instructionsElement.style.display = 'block';
        const allElements = document.querySelectorAll('.key');
        allElements.forEach(element => {
            element.classList.remove('active', 'pressed', 'invisible');
            element.style.opacity = 0;
        });
        const container = document.querySelector('.container');
        container.style.opacity = 0;

    }
}

function initBackgroundScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 0.5;

    const geometry = new THREE.PlaneGeometry(3, 3, 800, 800);
    const textureLoader = new THREE.TextureLoader();
    const fabricTexture = textureLoader.load('iridescent.jpg');

    const material = new THREE.ShaderMaterial({
        uniforms: {
            fabricTexture: {value: fabricTexture},
            time: {value: 0}
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    });

    waveObject = new THREE.Mesh(geometry, material);
    scene.add(waveObject);
}

function animateBackground(time) {
    // Use the passed time parameter instead of calculating it here
    if (waveObject && waveObject.material.uniforms) {
        waveObject.material.uniforms.time.value = time;
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function useCSSFallback() {
    const canvas = document.getElementById('holographic-background');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.background = 'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent)';
    canvas.style.backgroundSize = '4px 4px';
    canvas.style.animation = 'wave 20s linear infinite';

    const style = document.createElement('style');
    style.textContent = `
        @keyframes wave {
            0% { background-position: 0 0; }
            100% { background-position: 80px 80px; }
        }
    `;
    document.head.appendChild(style);
}

window.addEventListener('resize', () => {
    if (isWebGLAvailable()) {
        if (camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
        }
    }
});

function updateVersionLabel(isWebGLEnabled) {
    const webglStatus = document.getElementById('webgl-status');
    if (webglStatus) {
        if (isWebGLEnabled) {
            webglStatus.textContent = '.WebGL';
            webglStatus.style.color = '#4CAF50';
        } else {
            webglStatus.textContent = '.CSS';
            webglStatus.style.color = '#FF5252';
        }
    }
}

function isMobileDevice() {
    console.log('Window inner width:', window.innerWidth);
    console.log('User Agent:', navigator.userAgent);
    console.log('Max Touch Points:', navigator.maxTouchPoints);
    // Check if touch is supported
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        // Additional check for iOS devices
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            return true;
        }

        // Check for Android and other mobile devices
        if (/Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            return true;
        }

        // Check screen size (use a larger value for high-res screens)
        if (window.innerWidth <= 1024) {
            return true;
        }
    }

    return false;
}

function showMobileMessage() {
    const divToHide = document.querySelector('.key-container-wrapper');
    const volumeLabelToHide = document.querySelector('.volume-label');
    const resetMelodyToHide = document.getElementById('reset-melody');
    const startAudioToHide = document.getElementById('start-audio');
    if (divToHide) {
        divToHide.style.display = 'none';
        resetMelodyToHide.style.display = 'none';
        startAudioToHide.style.display = 'none';
        volumeLabelToHide.style.display = 'none';
    }
    const mobileMessageElement = document.getElementById('mobile-message');
    if (mobileMessageElement) {
        mobileMessageElement.style.display = 'block';
    }
}

window.initRenderer = initRenderer;
window.initBackgroundScene = initBackgroundScene;
window.animateBackground = animateBackground;