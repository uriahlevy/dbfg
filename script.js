let morphProgress = 0;
const totalSteps = 19;
let currentStep = 0;


document.addEventListener('DOMContentLoaded', () => {
    // addScrewsToContainer();
    function initThreeJSAnimations() {
        if (isMobileDevice()) {
            showMobileMessage();
        } else if (window.initRenderer()) {
            if (typeof window.initBackgroundScene === 'function') {
                window.initBackgroundScene();
            }
            if (typeof window.initAnimatedObjects === 'function') {
                window.initAnimatedObjects();
            }

            function animate(timestamp) {
                requestAnimationFrame(animate);

                // Convert timestamp to seconds
                const timeInSeconds = timestamp * 0.001;

                if (typeof window.animateBackground === 'function') {
                    window.animateBackground(timeInSeconds);
                }
                if (typeof window.animateObjects === 'function') {
                    window.animateObjects(timeInSeconds);
                }
            }

            requestAnimationFrame(animate);
        }
    }

    initThreeJSAnimations();
    let keySequenceProgress = 0;
    const totalKeySequence = 19;

    const melody = [
        'A4', 'B4', 'G#4', 'A4', 'G#4', 'E4', 'F#4',
        'C#4', 'E4', 'B4', 'G#4', 'A4', 'G#4', 'E4',
        'A4', 'A4', 'A4', 'G#4', 'E4'
    ];
    let noteIndex = 0;
    const firstMessage = "NOFEELINGCOMESCLOSE";
    const activeNotes = {};

    let audioContext;
    let audioBuffer;
    let audioSource;
    let audioPlayed = false;
    startAudio();
    setupScreenFlicker()

    const kickAudio = document.querySelector('audio[data-key="kick"]');
    const snareAudio = document.querySelector('audio[data-key="snare"]');
    const glitchAudio = new Audio('glitch_short.wav');
    const crackleAudio = new Audio('crackles.wav')


    function toggleScrews() {
        const screws = document.querySelectorAll('.screw');
        screws.forEach(screw => {
            if (screw.classList.contains('screw-missing')) {
                screw.classList.remove('screw-missing');
                screw.classList.add('screw-present');
                console.log(`Made screw appear: ${screw.className}`);
            }
        });
    }

    function playAudioSample(audio) {
        if (audio.paused) {
            audio.currentTime = 0;
            audio.play();
            dataLayer.push({
                'event': 'song_played',
                'event_category': 'engagement'
            });
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

    const envelope = {
        attack: 0.001,
        decay: 0.8,
        sustain: 0.9,
        release: 0.01
    };

    const detuneAmount = 15;
    const tremoloFrequency = 4;
    const tremoloDepth = 10;

    const synth = new Tone.Synth({
        oscillator: {
            type: 'sawtooth',
            detune: -detuneAmount,
        },
        envelope: envelope,
        portamento: 0.1
    }).toDestination();

    const synthHigh = new Tone.Synth({
        oscillator: {
            type: 'square',
            detune: detuneAmount,
        },
        envelope: envelope,
        portamento: 0.1
    }).toDestination();

    synthHigh.volume.value = -7;

    const tremoloLow = new Tone.LFO({
        frequency: tremoloFrequency,
        min: -tremoloDepth,
        max: tremoloDepth,
        type: 'sine'
    }).start();

    const tremoloHigh = new Tone.LFO({
        frequency: tremoloFrequency * 1.1,
        min: -tremoloDepth,
        max: tremoloDepth,
        type: 'sine'
    }).start();

// Connect LFOs to synth detune
    tremoloLow.connect(synth.detune);
    tremoloHigh.connect(synthHigh.detune);

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
    let activeHigherNote = null;
    let isMelodyCompleted = false;
    applyBadBulbEffect();
    document.addEventListener('keydown', async (event) => {
        // dataLayer.push({
        //     'event': 'keyboard_key_pressed',
        //     'event_category': 'engagement'
        // });



        const key = event.key.toUpperCase();
        const note = melody[noteIndex];

        if (noteIndex < melody.length && key === firstMessage[noteIndex]) {

            applyGlitchEffect();
            currentStep++
            updateMorphProgress(currentStep, totalSteps);
            const noteOctave = note.slice(0, -1);
            const octaveNumber = parseInt(note.slice(-1));
            const higherOctave = noteOctave + (octaveNumber + 1);

            synth.triggerAttackRelease(note);
            synthHigh.triggerAttackRelease(higherOctave);

            activeNote = note;
            activeHigherNote = higherOctave;

            highlightAndGreyOutKey(noteIndex);
            noteIndex++;

            if (noteIndex >= melody.length) {
                isHeartFormed = true
                dataLayer.push({
                    'event': 'melody_completed',
                    'event_category': 'engagement'
                });
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

    function stopNote() {
        if (activeNote) {
            synth.triggerRelease();
            synthHigh.triggerRelease();
            activeNote = null;
            activeHigherNote = null;
        }
    }

    document.addEventListener('keyup', (event) => {
        const key = event.key.toUpperCase();
        if (key === firstMessage[noteIndex - 1]) {
            stopNote();
        }
    });

    document.getElementById('reset-melody').addEventListener('click', resetMelody);

    function resetMelody() {
        dataLayer.push({
            'event': 'melody_reset',
            'event_category': 'engagement'
        });
        console.log('resetMelody called');
        isMelodyCompleted = false;
        synth.triggerRelease();
        synthHigh.triggerRelease();
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

    displayNextKey(noteIndex);

    function startThumping() {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => key.classList.add('thumping'));
        document.querySelector('#animated-object-left').classList.add('thumping');
        document.querySelector('#animated-object-right').classList.add('thumping');
    }

    function stopThumping() {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => key.classList.remove('thumping'));
    }

    function playEndAudio() {
        const key = document.querySelector('.key');
        key.style.filter = 'none';
        // const wrapper = document.querySelector('.key-container-wrapper');
        // wrapper.style.filter = 'none';
        // const cont = document.querySelector('.key-container');
        // cont.style.filter = 'none';
        const origCont = document.querySelector('.container');
        origCont.style.filter = 'none';
        console.log('playEndAudio called');
        if (!audioPlayed && audioBuffer) {
            if (audioSource) {
                audioSource.stop();
            }
            playAudioSample(glitchAudio);
            toggleScrews()
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
        dataLayer.push({
            'event': 'sequence_end_played',
            'event_category': 'engagement'
        });
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
        const duration = 300;
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

                if (Math.random() < 0.8) {
                    const hue = Math.floor(Math.random() * 360);
                    overlay.style.backgroundColor = `hsl(${hue}, 100%, 80%)`;
                    overlay.style.mixBlendMode = 'difference';
                } else {
                    overlay.style.backgroundColor = 'black';
                    overlay.style.mixBlendMode = 'overlay';
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
        dataLayer.push({
            'event': 'light_mode_switched_on',
            'event_category': 'engagement'
        });
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