document.addEventListener('DOMContentLoaded', () => {
    const melody = [
        'A4', 'B4', 'G#4', 'A4', 'G#4', 'E4', 'F#4',
        'C#4', 'E4', 'B4', 'G#4', 'A4', 'G#4', 'E4',
        'A4', 'A4', 'A4', 'G#4', 'E4'
    ];
    let noteIndex = 0;
    const message = "NOTHINGQUITELIKEYOU";
    const activeNotes = {};

    let audioContext;
    let audioBuffer;
    let audioSource;
    let audioPlayed = false;
    setupScreenFlicker()
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

        const reverb = new Tone.Reverb({
            decay: 1.5,
            preDelay: 0.005,
            wet: 0.25
        }).toDestination();
    
        const delay = new Tone.FeedbackDelay({
            delayTime: '8n',
            feedback: 0.25
        }).connect(reverb);
    
        const synth = new Tone.Synth({
            oscillator: {
                type: 'sawtooth'
            },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            },
            portamento: 0.1 
        }).connect(delay);
    
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

document.addEventListener('keydown', async (event) => {
    const key = event.key.toUpperCase();

    if (noteIndex < melody.length && key === message[noteIndex]) {
        await startAudio();

        const note = melody[noteIndex];
        if (activeNote !== note) {
            synth.triggerRelease(); 
            synth.triggerAttack(note);
            activeNote = note;
        }
        highlightAndGreyOutKey(noteIndex);
        noteIndex++;

        if (noteIndex >= melody.length) {
            setTimeout(() => {
                applyGlitchEffect();
                setTimeout(() => {
                    resetMelody();
                    displayAllKeys();
                    playEndAudio();
                }, 500);
            }, 500);
        } else {
            displayNextKey(noteIndex);
        }
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
        synth.triggerRelease();
        noteIndex = 0;
        Object.keys(activeNotes).forEach(key => delete activeNotes[key]);
        resetKeys();
    }
    
    function displayAllKeys() {
        const allElements = document.querySelectorAll('.key');
        allElements.forEach(element => {
            element.classList.remove('active', 'pressed');
            element.style.opacity = 1;
        });
        displayNextKey(0);
    }
    
    function displayNextKey(index) {
        const allElements = document.querySelectorAll('.key');
        allElements.forEach((element, i) => {
            if (i === index) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        });
    }

    function highlightAndGreyOutKey(index) {
        const element = document.querySelector(`.key[data-key="${index}"]`);
        if (element) {
            element.classList.add('pressed');
            element.style.opacity = 0.5;
        }
    }

    function resetKeys() {
        const allElements = document.querySelectorAll('.key');
        allElements.forEach(element => {
            element.classList.remove('active', 'pressed');
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
            audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
    
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 1.5);
    
            audioSource.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const startTime = 50;
            // const duration = 5;
            const duration = audioBuffer.duration - startTime;
            
            audioSource.start(0, startTime, duration);
            document.querySelector('.volume-label').classList.add('active');
            audioPlayed = true;
            console.log(`Audio playing from ${startTime} seconds with fade-in`);
            
            startThumping();
            
            // Apply glitch effect after a short delay
            setTimeout(applyGlitchEffect, 500);
            
            setTimeout(() => {
                stopThumping();
            }, duration * 1000);
    
            // Call endSequence when audio ends
            setTimeout(() => {
                endSequence();
            }, duration * 1000);
        } else if (!audioBuffer) {
            console.log('Audio not yet loaded');
        } else {
            console.log('Audio already played');
        }
    }
    
    function endSequence() {
        const fadeOut = document.createElement('div');
        fadeOut.className = 'fade-out';
        document.body.appendChild(fadeOut);
    
        const endText = document.createElement('div');
        endText.className = 'end-text';
        const purpleNeonText = `Recent studies in the field of neuropharmacology have identified a novel neurotransmitter dubbed "purple neon" (C22H28N2O3, colloquially known as "mood lightning"). This compound, structurally similar to serotonin but with an unprecedented efficacy, has shown remarkable potential in modulating affective states. Fascinatingly, purple neon exhibits a unique characteristic: it can only manifest when two individuals with complementary neurochemical profiles encounter each other, a phenomenon termed "dyadic resonance." Once activated, the effects are persistent and the neurochemical bond between the two subjects becomes inseparable, leading some researchers to playfully refer to it as "molecular entanglement of the heart." In controlled trials, subjects experiencing purple neon exhibited a 420% increase in reported happiness levels, with side effects limited to an inexplicable affinity for synthwave music and a compulsion to wear reflective sunglasses indoors. The mechanism of action is hypothesized to involve the stimulation of the newly discovered "radical gnarliness" receptors in the prefrontal cortex. While further research is needed, preliminary data suggest that purple neon could revolutionize our understanding of interpersonal biochemistry and mood disorders, potentially rendering traditional antidepressants as obsolete as floppy disks in the age of quantum computing.`;

        endText.textContent = purpleNeonText;
        document.body.appendChild(endText);
    
        setTimeout(() => {
            fadeOut.style.opacity = '1';
        }, 100);
    
        setTimeout(() => {
            endText.style.opacity = '1';
            setTimeout(() => {
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
        
        let gainNode, pannerNode;
        if (audioContext && audioSource) {
            try {
                gainNode = audioContext.createGain();
                gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    
                pannerNode = audioContext.createStereoPanner();
    
                audioSource.disconnect();
                audioSource.connect(gainNode);
                gainNode.connect(pannerNode);
                pannerNode.connect(audioContext.destination);
            } catch (e) {
                console.error('Failed to set up audio glitch effect:', e);
            }
        }
    
        function glitchFrame(currentTime) {
            if (!isEffectActive) return;
    
            const elapsed = currentTime - startTime;
            if (elapsed < duration) {
                if (Math.random() < 0.7) {
                    overlay.style.opacity = '1';
                    setTimeout(() => {
                        if (isEffectActive) overlay.style.opacity = '0';
                    }, Math.random() * 50 + 50); 
                }
    
                if (Math.random() < 0.9) {
                    const hue = Math.floor(Math.random() * 360);
                    overlay.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
                    overlay.style.mixBlendMode = 'difference';
                } else {
                    overlay.style.backgroundColor = 'black';
                    overlay.style.mixBlendMode = 'normal';
                }
    
                if (gainNode && pannerNode) {
                    const now = audioContext.currentTime;
                    if (Math.random() < 0.2) {
                        gainNode.gain.setValueAtTime(Math.random() < 0.5 ? 0 : 2, now);
                        gainNode.gain.setValueAtTime(1, now + 0.05);
                        
                        pannerNode.pan.setValueAtTime(Math.random() * 2 - 1, now);
                    }
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
    
            if (gainNode && pannerNode && audioSource) {
                audioSource.disconnect(gainNode);
                gainNode.disconnect(pannerNode);
                pannerNode.disconnect();
                audioSource.connect(audioContext.destination);
            }
        }
    
        requestAnimationFrame(glitchFrame);
    
        setTimeout(endGlitchEffect, duration + 100);
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
                setTimeout(() => el.classList.remove('screen-shake'), 100);
            });
    
            if (Math.random() < 0.8) { 
                const hue = Math.floor(Math.random() * 360);
                flickerElement.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
                flickerElement.style.mixBlendMode = 'difference';
                flickerElement.style.opacity = '0.5'; 
            } else {
                flickerElement.style.backgroundColor = 'black';
                flickerElement.style.mixBlendMode = 'normal';
                flickerElement.style.opacity = '0.2'; 
            }
    
            flickerElement.style.display = 'block';
    
            setTimeout(() => {
                flickerElement.style.display = 'none';
                flickerElement.style.backgroundColor = '';
                flickerElement.style.mixBlendMode = '';
                flickerElement.style.opacity = '';
            }, 100);
    
            const nextFlickerTime = 1200 + Math.random() * 500; 
            setTimeout(flicker, nextFlickerTime);
        }
    
        flicker(); 
    }
      
    
    document.addEventListener('click', resumeAudioContext);
});