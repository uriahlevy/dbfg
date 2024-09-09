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

    // Load the audio file
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
            portamento: 0.1 // This enables the glide effect
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
            synth.triggerRelease(); // Release the previous note
            synth.triggerAttack(note);
            activeNote = note;
        }
        highlightAndGreyOutKey(noteIndex);
        noteIndex++;

        if (noteIndex >= melody.length) {
            setTimeout(() => {
                applyGlitchEffect()
                resetMelody();
                setTimeout(() => {
                    displayAllKeys();
                    playEndAudio();
                }, 2000);
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
    
            // Create a gain node for the fade-in effect
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 1.5);
    
            audioSource.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const startTime = 48; // Start from 48 seconds
            const duration = audioBuffer.duration - startTime;
            
            audioSource.start(0, startTime, duration);
            document.querySelector('.volume-label').classList.add('active');
            audioPlayed = true;
            console.log(`Audio playing from ${startTime} seconds with fade-in`);
            
            startThumping(); // Start the thumping animation
            
            // Stop thumping when audio ends
            setTimeout(() => {
                stopThumping();
            }, duration * 1000);
        } else if (!audioBuffer) {
            console.log('Audio not yet loaded');
        } else {
            console.log('Audio already played');
        }
    }

    // Make sure to call this function when user interaction occurs
    function resumeAudioContext() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    function applyGlitchEffect() {
        // Create and add the overlay
        const overlay = document.createElement('div');
        overlay.className = 'glitch-overlay';
        document.body.appendChild(overlay);
      
        // Trigger the initial glitch effect
        setTimeout(() => {
          overlay.style.opacity = '1';
          overlay.style.animation = 'glitch-flicker 0.1s steps(1, end) 3';
        }, 50);
      
        // Start the gradual resume effect
        setTimeout(() => {
          overlay.style.animation = 'glitch-resume 1.5s ease-out forwards';
        }, 1000);
      
        // Remove the overlay after the effect
        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 2500);
      }
    // Add this to your existing event listeners or user interaction handlers
    document.addEventListener('click', resumeAudioContext);
});