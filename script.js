document.addEventListener('DOMContentLoaded', () => {
    const melody = [
        'A4', 'B4', 'G#4', 'A4', 'G#4', 'E4', 'F#4',
        'C#4', 'E4', 'B4', 'G#4', 'A4', 'G#4', 'E4',
        'A4', 'A4', 'A4', 'G#4', 'E4'
    ];
    let noteIndex = 0;
    let audioPlayed = false; // Track if audio has been started
    const message = "NOTHINGQUITELIKEYOU";
    const activeNotes = {};

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
        oscillator: { type: 'sawtooth' },
        envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.7,
            release: 0.5
        },
        portamento: 0.05
    }).connect(delay);

    const additionalSynth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.7,
            release: 0.5
        },
        portamento: 0.05
    }).connect(delay);

    const audio = new Audio('audio.mp3'); // Path to your local audio file
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const track = audioContext.createMediaElementSource(audio);
    const gainNode = audioContext.createGain();
    track.connect(gainNode).connect(audioContext.destination);

    async function playEndAudio() {
        try {
            await audioContext.resume();
            audio.addEventListener('loadedmetadata', () => {
                audio.currentTime = 48; // Ensure the start time is set when metadata is ready
            });
            if (!audioPlayed) {
                audio.play().then(() => {
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 1.5); // 1.5 sec fade-in
                    audioPlayed = true; // Mark audio as played
                    console.log('Audio is playing from 48 seconds.');
                }).catch((error) => {
                    console.error('Failed to play audio:', error);
                });
            } else {
                console.log('Audio has already been played.');
            }
        } catch (error) {
            console.error('Error in playEndAudio:', error);
        }
    }

    const analyser = new Tone.Analyser('waveform', 1024);
    synth.connect(analyser);

    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');

    async function startAudio() {
        if (Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Audio context started');
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        const waveform = analyser.getValue();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#7a3fff');
        gradient.addColorStop(1, '#ff1493');

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = gradient;

        for (let i = 0; i < waveform.length; i++) {
            const x = (i / waveform.length) * canvas.width;
            const y = ((waveform[i] + 1) / 2) * canvas.height;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    animate();

    document.addEventListener('keydown', async (event) => {
        const key = event.key.toUpperCase();

        if (noteIndex < melody.length && key === message[noteIndex]) {
            await startAudio();

            const note = melody[noteIndex];
            if (!activeNotes[key]) {
                synth.triggerAttack(note);

                if (key === 'U' && noteIndex === 8) {
                    additionalSynth.triggerAttack('E5');
                }

                activeNotes[key] = true;
                highlightAndGreyOutKey(noteIndex);
                noteIndex++;

                if (noteIndex >= melody.length) {
                    setTimeout(() => {
                        resetMelody();
                        setTimeout(() => {
                            displayAllKeys();
                            startFlakeAnimation(); // Trigger flake animation
                            playEndAudio();        // Play audio at the end
                        }, 1000); // Delay audio start to 1 second
                    }, 500);
                } else {
                    displayNextKey(noteIndex);
                }
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key.toUpperCase();
        if (activeNotes[key]) {
            synth.triggerRelease();
            if (key === 'U' && noteIndex > 8) {
                additionalSynth.triggerRelease();
            }

            delete activeNotes[key];
        }
    });

    document.getElementById('reset-melody').addEventListener('click', resetMelody);

    function resetMelody() {
        synth.triggerRelease();
        additionalSynth.triggerRelease();
        noteIndex = 0;
        Object.keys(activeNotes).forEach(key => delete activeNotes[key]);
        resetKeys();
    }

    function displayNextKey(index) {
        const currentElement = document.querySelector(`.key[data-key="${index}"]`);
        if (currentElement) {
            currentElement.classList.add('active');
            currentElement.style.opacity = 1;
        }
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
            element.style.opacity = 0; // Hide all keys initially
        });
        displayNextKey(noteIndex); // Only display the first key
    }

    // Show all keys at full opacity
    function displayAllKeys() {
        const allElements = document.querySelectorAll('.key');
        allElements.forEach(element => {
            element.classList.remove('active', 'pressed');
            element.style.opacity = 1;
        });
    }

    displayNextKey(noteIndex);

    function createFlakes() {
        const numberOfFlakes = 100;
        const flakes = [];

        for (let i = 0; i < numberOfFlakes; i++) {
            flakes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                speed: Math.random() * 3 + 1
            });
        }

        return flakes;
    }

    function drawFlakes(ctx, flakes) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        flakes.forEach(flake => {
            ctx.moveTo(flake.x, flake.y);
            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        });
        ctx.fill();
    }

    function animateFlakes(ctx, flakes) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFlakes(ctx, flakes);
        flakes.forEach(flake => {
            flake.y += flake.speed;
            if (flake.y > canvas.height) {
                flake.y = 0;
                flake.x = Math.random() * canvas.width;
            }
        });
        requestAnimationFrame(() => animateFlakes(ctx, flakes));
    }

    function startFlakeAnimation() {
        const flakes = createFlakes();
        animateFlakes(ctx, flakes);
    }
});