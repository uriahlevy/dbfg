document.addEventListener('DOMContentLoaded', () => {
    let renderer, scene, camera, waveObject;
    const waveSpeed = 0.0001;
    const waveHeight = 0.45;

    function isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    function showWebGLInstructions() {
        const divToHide = document.querySelector('.key-container-wrapper');
        if (divToHide) {
            divToHide.style.display = 'none';
        }
        const instructionsElement = document.getElementById('webgl-instructions');
        if (instructionsElement) {
            instructionsElement.style.display = 'block';
        }
    }

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

    function initScene() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 0.5;

        const geometry = new THREE.PlaneGeometry(3, 3, 400, 400); // Increased to 800x800 for an even finer mesh
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.04,
            wireframe: true
        });

        waveObject = new THREE.Mesh(geometry, material);
        scene.add(waveObject);

        animate();
    }


    function init() {
        if (initRenderer()) {
            initScene();
        }
    }

    init();

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * waveSpeed;

        const position = waveObject.geometry.attributes.position;
        const array = position.array;

        for (let i = 0; i < array.length; i += 3) {
            array[i + 2] = Math.sin(array[i] * 3 + time) * Math.cos(array[i + 1] * 3 + time) * waveHeight;
        }

        position.needsUpdate = true;

        renderer.render(scene, camera);
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

    function init() {
        if (initRenderer()) {
            initScene();
        }
    }

    init();

    window.addEventListener('resize', () => {
        if (camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
        }
    });
    addScrewsToContainer();

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

    const melody = [
        'A4', 'B4', 'G#4', 'A4', 'G#4', 'E4', 'F#4',
        'C#4', 'E4', 'B4', 'G#4', 'A4', 'G#4', 'E4',
        'A4', 'A4', 'A4', 'G#4', 'E4'
    ];
    let noteIndex = 0;
    const message = "NOTHINGQUITELIKEHER";
    const activeNotes = {};

    let audioContext;
    let audioBuffer;
    let audioSource;
    let audioPlayed = false;
    setupScreenFlicker()

    const kickAudio = document.querySelector('audio[data-key="kick"]');
    const snareAudio = document.querySelector('audio[data-key="snare"]');
    const glitchAudio = new Audio('glitch_short.wav');
    const crackleAudio = new Audio('crackles.wav')

    function addScrewsToContainer() {
        const wrapper = document.querySelector('.key-container-wrapper');
        const screwPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

        screwPositions.forEach(position => {
            const screw = document.createElement('div');
            screw.className = `screw screw-${position}`;
            wrapper.appendChild(screw);
        });
    }

    function playAudioSample(audio) {
        if (audio.paused) {
            audio.currentTime = 0;
            audio.play();
        } else {
            audio.currentTime = 0;
        }
    }

    fetch('audio.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            return audioContext.decodeAudioData(arrayBuffer);
        })
        .then(decodedAudio => {
            audioBuffer = decodedAudio;
            console.log('Audio loaded and decoded');
        })
        .catch(error => console.error('Error loading audio:', error));

    const synth = new Tone.Synth({
        oscillator: {
            type: 'sawtooth'
        },
        envelope: {
            attack: 0.001,
            decay: 0.8,
            sustain: 0.9,
            release: 0.01
        },
        portamento: 0.1
    }).toDestination();

    const analyser = new Tone.Analyser('waveform', 1024);
    synth.connect(analyser);

    async function startAudio() {
        if (Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Tone.js Audio context started');
        }
        if (audioContext && audioContext.state !== 'running') {
            await audioContext.resume();
            console.log('Audio context resumed');
        }
    }

    let activeNote = null;
    let isMelodyCompleted = false;
    applyBadBulbEffect();

    document.addEventListener('keydown', async (event) => {
        const key = event.key.toUpperCase();

        await startAudio();

        if (noteIndex < melody.length && key === message[noteIndex]) {
            const note = melody[noteIndex];
            synth.triggerRelease();
            synth.triggerAttack(note);
            activeNote = note;

            highlightAndGreyOutKey(noteIndex);
            noteIndex++;

            if (noteIndex >= melody.length) {
                setTimeout(() => {
                    applyGlitchEffect();
                    resetMelody();
                    displayAllKeys();
                    playEndAudio();
                }, 800);

            } else {
                displayNextKey(noteIndex);
            }
        }

        if (event.key.toLowerCase() === 'b') {
            playAudioSample(kickAudio);
            highlightAndGreyOutKeyById('kick');
        } else if (event.key.toLowerCase() === 'p') {
            playAudioSample(snareAudio);
            highlightAndGreyOutKeyById('snare');
        }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key.toUpperCase();
        if (key === message[noteIndex - 1]) {
            synth.triggerRelease();
            activeNote = null;
        }
    });

    document.getElementById('reset-melody').addEventListener('click', resetMelody);

    function resetMelody() {
        console.log('resetMelody called');
        isMelodyCompleted = false;
        synth.triggerRelease();
        noteIndex = 0;
        Object.keys(activeNotes).forEach(key => delete activeNotes[key]);
        resetKeys();
    }

    function displayAllKeys() {
        const allElements = document.querySelectorAll('.key');
        allElements.forEach(element => {
            element.classList.remove('active', 'pressed');
            element.classList.remove('invisible');
            element.style.opacity = 1;
        });
        displayNextKey(0);
    }

    function displayNextKey(index) {
        const allElements = document.querySelectorAll('.key');
        allElements.forEach((element, i) => {
            if (i === index) {
                element.classList.add('active');
                element.style.opacity = 1
            } else {
                element.classList.remove('active');
            }
        });
    }

    function highlightAndGreyOutKey(index) {
        const element = document.querySelector(`.key[data-key="${index}"]`);
        if (element) {
            element.classList.add('pressed');
            setTimeout(() => {
                if (!audioPlayed) {
                    element.classList.remove('pressed');
                    element.classList.remove('active');
                    element.classList.add('invisible');
                }
            }, 500);
        }
    }

    function highlightAndGreyOutKeyById(id) {
        const element = document.querySelector(`.key[data-key="${id}"]`);
        if (element) {
            element.classList.add('pressed');
            setTimeout(() => {
                element.classList.remove('pressed');
            }, 500);
        }
    }

    function resetKeys() {
        const allElements = document.querySelectorAll('.key');
        allElements.forEach(element => {
            element.classList.remove('active', 'pressed', 'invisible');
            element.style.opacity = 0;
        });
        displayNextKey(noteIndex);
    }

    function displayAllKeys() {
        const allElements = document.querySelectorAll('.key');
        allElements.forEach(element => {
            element.classList.remove('active', 'pressed');
            element.style.opacity = 1;
        });
    }

    displayNextKey(noteIndex);

    function startThumping() {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => key.classList.add('thumping'));
        document.querySelector('.key-container').classList.add('thumping');
    }

    function stopThumping() {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => key.classList.remove('thumping'));
    }

    function playEndAudio() {
        console.log('playEndAudio called');
        if (!audioPlayed && audioBuffer) {
            if (audioSource) {
                audioSource.stop();
            }
            playAudioSample(glitchAudio);
            audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;

            const gainNode = audioContext.createGain();
            // const duration = 2
            const startTime = 50;
            const duration = audioBuffer.duration - startTime;

            setTimeout(() => {
                const now = audioContext.currentTime;
                const fadeInDuration = 1.5;

                gainNode.gain.setValueAtTime(0.1, now);

                gainNode.gain.exponentialRampToValueAtTime(1, now + fadeInDuration);

                audioSource.connect(gainNode);
                gainNode.connect(audioContext.destination);

                switchToLightMode();

                audioSource.start(now, startTime, duration);

                let elapsed = 0;
                const interval = setInterval(() => {
                    console.log(`Gain at ${elapsed / 10}s:`, gainNode.gain.value);
                    elapsed += 1;
                    if (elapsed > fadeInDuration * 10) clearInterval(interval);
                }, 100);
            }, 2300);


            document.querySelector('.volume-label').classList.add('active');
            audioPlayed = true;

            startThumping();

            setTimeout(() => {
                stopThumping();
            }, duration * 1000);

            setTimeout(() => {
                endSequence();
            }, duration * 1000);
        } else if (!audioBuffer) {
            console.log('Audio not yet loaded');
        } else {
            console.log('Audio already played');
        }
    }

    function playRandomGlitches(duration = 30000) {
        const startTime = Date.now();

        function playRandomGlitch() {
            playAudioSample(crackleAudio);

            const now = Date.now();
            if (now - startTime < duration) {
                const randomDelay = Math.random() * 4000 + 1800;
                setTimeout(playRandomGlitch, randomDelay);
            }
        }

        playRandomGlitch()
    }

    function endSequence() {
        const fadeOut = document.createElement('div');
        fadeOut.className = 'fade-out';
        document.body.appendChild(fadeOut);

        const endText = document.createElement('div');
        endText.className = 'end-text';
        const textContent = document.createElement('div');
        textContent.className = 'text-content';
        const purpleNeonText = `Recent studies in the field of neuropharmacology have identified a novel neurotransmitter dubbed "purple neon" (C22H28N2O3, colloquially known as "mood lightning"). This compound, structurally similar to serotonin but with an unprecedented efficacy, has shown remarkable potential in modulating affective states. Fascinatingly, purple neon exhibits a unique characteristic: it can only manifest when two individuals with complementary neurochemical profiles encounter each other, a phenomenon termed "dyadic resonance." Once activated, the effects are persistent and the neurochemical bond between the two subjects becomes inseparable, leading some researchers to playfully refer to it as "molecular entanglement of the heart." In controlled trials, subjects experiencing purple neon exhibited a 420% increase in reported happiness levels, with side effects limited to an inexplicable affinity for synthwave music and a compulsion to wear reflective sunglasses indoors. The mechanism of action is hypothesized to involve the stimulation of the newly discovered "radical gnarliness" receptors in the prefrontal cortex. While further research is needed, preliminary data suggest that purple neon could revolutionize our understanding of interpersonal biochemistry and mood disorders, potentially rendering traditional antidepressants as obsolete as floppy disks in the age of quantum computing.`;
        textContent.textContent = purpleNeonText;

        endText.appendChild(textContent);
        document.body.appendChild(endText);

        function shakeElement(element) {
            element.classList.add('screen-shake');
            setTimeout(() => element.classList.remove('screen-shake'), 500);
        }

        function endShake() {
            shakeElement(textContent);
            setTimeout(endShake, 3900 + Math.random() * 500);
        }

        endShake();

        setTimeout(() => {
            fadeOut.style.opacity = '1';
            playRandomGlitches();
        }, 100);

        setTimeout(() => {
            endText.style.opacity = '1';
            setTimeout(() => {
                endText.style.transition = 'opacity 2s';
                endText.style.opacity = '0';
            }, 25800);
        }, 2000);

        setTimeout(() => {
            document.body.removeChild(endText);
            fadeOut.style.transition = 'none';
            fadeOut.style.opacity = '1';
        }, 30000);
    }

    function resumeAudioContext() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    async function applyGlitchEffect() {
        const overlay = document.createElement('div');
        overlay.className = 'glitch-overlay';
        document.body.appendChild(overlay);

        overlay.style.opacity = '1';

        let startTime = performance.now();
        const duration = 1800;
        let isEffectActive = true;

        function glitchFrame(currentTime) {
            if (!isEffectActive) return;

            const elapsed = currentTime - startTime;
            if (elapsed < duration) {
                if (Math.random() < 0.8) {
                    overlay.style.opacity = '1';
                    setTimeout(() => {
                        if (isEffectActive) overlay.style.opacity = '0';
                    }, Math.random() * 50 + 20);
                }

                if (Math.random() < 0.7) {
                    const hue = Math.floor(Math.random() * 360);
                    overlay.style.backgroundColor = `hsl(${hue}, 150%, 80%)`;
                    overlay.style.mixBlendMode = 'difference';
                } else {
                    overlay.style.backgroundColor = 'black';
                    overlay.style.mixBlendMode = 'normal';
                }

                requestAnimationFrame(glitchFrame);
            } else {
                endGlitchEffect();
            }
        }

        function endGlitchEffect() {
            if (!isEffectActive) return;
            isEffectActive = false;
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.1s';
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }, 100);
        }

        requestAnimationFrame(glitchFrame);

        setTimeout(endGlitchEffect, duration + 200);
    }

    function switchToLightMode() {
        console.log("turn on the lights")
        setIridescentOpacity(1.0)
    }

    function applyBadBulbEffect() {
        const keys = document.querySelectorAll('.key');
        const numKeys = keys.length;

        const numAffectedKeys = Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < numAffectedKeys; i++) {
            const randomIndex = Math.floor(Math.random() * numKeys);
            const key = keys[randomIndex];

            key.classList.add('bad-bulb');

            setTimeout(() => {
                key.classList.remove('bad-bulb');
            }, 300);
        }
        const nextEffectDelay = Math.random() * 2000 + 500;
        setTimeout(applyBadBulbEffect, nextEffectDelay);
    }


    function setupScreenFlicker() {
        const flickerElement = document.createElement('div');
        flickerElement.className = 'screen-flicker';
        document.body.appendChild(flickerElement);

        const elementsToShake = [
            document.querySelector('.container'),
            ...document.querySelectorAll('.key')
        ];

        function flicker() {
            elementsToShake.forEach(el => {
                el.classList.add('screen-shake');
                setTimeout(() => el.classList.remove('screen-shake'), 80);
            });

            flickerElement.style.display = 'block';

            setTimeout(() => {
                flickerElement.style.display = 'none';
                flickerElement.style.backgroundColor = '';
                flickerElement.style.mixBlendMode = '';
                flickerElement.style.opacity = '';
            }, 100);

            const nextFlickerTime = 3500 + Math.random() * 500;
            setTimeout(flicker, nextFlickerTime);
        }

        flicker();
    }

    function setIridescentOpacity(opacity) {
        document.body.style.setProperty('--iridescent-opacity', opacity);

        const iridescentLayer = document.querySelector('.iridescent-layer');
        if (iridescentLayer) {
            iridescentLayer.style.opacity = opacity;
        }
    }

    document.addEventListener('click', resumeAudioContext);
});