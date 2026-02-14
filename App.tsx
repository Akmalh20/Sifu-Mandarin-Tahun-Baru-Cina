
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Player, Lantern, Platform, Nian } from './types';
import { QUESTIONS, INITIAL_PLATFORMS, NIAN_DATA, WORLD_WIDTH, WORLD_HEIGHT, PLAYER_SPEED, JUMP_FORCE, GRAVITY } from './constants';
import HUD from './components/HUD';
import QuizModal from './components/QuizModal';

// --- Sound Engine Implementation ---
class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private melodyInterval: any = null;

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("AudioContext not supported", e);
    }
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(mute ? 0 : 0.1, this.ctx.currentTime, 0.1);
    }
  }

  playSFX(freqs: number[], type: OscillatorType = 'sine', duration: number = 0.1) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freqs[0], now);
    if (freqs.length > 1) {
      osc.frequency.exponentialRampToValueAtTime(freqs[1], now + duration);
    }
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + duration);
  }

  startMusic() {
    if (!this.ctx || this.melodyInterval) return;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : 0.1, this.ctx.currentTime);
    this.musicGain.connect(this.ctx.destination);

    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00]; 
    let step = 0;
    const sequence = [0, 1, 2, 3, 4, 3, 2, 1];

    this.melodyInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const freq = pentatonic[sequence[step % sequence.length]];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      g.gain.setValueAtTime(0.05, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      
      osc.connect(g);
      g.connect(this.musicGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
      step++;
    }, 500);
  }
}

const sound = new SoundEngine();

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isMuted, setIsMuted] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number | null>(null);
  const [collectedCount, setCollectedCount] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const keys = useRef<Record<string, boolean>>({});
  const shakeRef = useRef(0);
  const cameraXRef = useRef(0);

  // High-frequency game state kept in refs for the animation loop
  const playerRef = useRef<Player>({
    x: 100, y: 300, vx: 0, vy: 0, width: 35, height: 55, isJumping: false, direction: 'right'
  });
  const lanternsRef = useRef<Lantern[]>([]);
  const niansRef = useRef<Nian[]>([]);

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    sound.setMute(newMute);
  };

  const initGame = useCallback(() => {
    sound.init();
    sound.startMusic();
    setScore(0);
    setLives(3);
    setCollectedCount(0);
    shakeRef.current = 0;
    
    playerRef.current = {
      x: 100, y: 300, vx: 0, vy: 0, width: 35, height: 55, isJumping: false, direction: 'right'
    };
    
    const newLanterns: Lantern[] = [];
    const platformSteps = WORLD_WIDTH / 11;
    for (let i = 0; i < 10; i++) {
      const lx = platformSteps * (i + 1);
      const nearestPlatform = INITIAL_PLATFORMS.reduce((prev, curr) => 
        Math.abs(curr.x + curr.width/2 - lx) < Math.abs(prev.x + prev.width/2 - lx) ? curr : prev
      );
      newLanterns.push({
        id: i, x: lx, y: nearestPlatform.y - 120, collected: false, questionIndex: i
      });
    }
    lanternsRef.current = newLanterns;

    niansRef.current = NIAN_DATA.map(n => ({
      ...n, startX: n.x, endX: n.x + n.range, direction: 1, width: 50, height: 50
    }));

    setGameState('PLAYING');
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
  const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const sX = (Math.random() - 0.5) * shakeRef.current;
    const sY = (Math.random() - 0.5) * shakeRef.current;

    ctx.save();
    ctx.translate(sX, sY);

    // Background Parallax
    ctx.save();
    ctx.translate(-cameraXRef.current * 0.2, 0);
    ctx.fillStyle = '#cbd5e1'; 
    for(let i=0; i<8; i++) {
      ctx.beginPath();
      ctx.moveTo(i*600 - 200, 600);
      ctx.lineTo(i*600 + 100, 200);
      ctx.lineTo(i*600 + 400, 600);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-cameraXRef.current, 0);

    // Platforms
    INITIAL_PLATFORMS.forEach(p => {
      ctx.fillStyle = '#451a03'; 
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = '#14532d'; 
      ctx.fillRect(p.x, p.y, p.width, 10);
    });

    // Lanterns
    lanternsRef.current.forEach(l => {
      if (!l.collected) {
        ctx.font = '36px serif';
        ctx.fillText('🏮', l.x, l.y + Math.sin(Date.now() / 200) * 12);
      }
    });

    // Nians
    niansRef.current.forEach(n => {
      ctx.save();
      ctx.translate(n.x, n.y);
      if (n.direction === -1) {
          ctx.scale(-1, 1);
          ctx.translate(-n.width, 0);
      }
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(n.width/2, n.height/2 + 10, n.width/2, n.height/3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(n.width/2, n.height/2 - 5, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.moveTo(15, 10); ctx.lineTo(10, -5); ctx.lineTo(20, 10); ctx.fill();
      ctx.beginPath(); ctx.moveTo(35, 10); ctx.lineTo(40, -5); ctx.lineTo(30, 10); ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(18, 15, 6, 0, Math.PI * 2); ctx.arc(32, 15, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Player
    const p = playerRef.current;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.direction === 'left') {
        ctx.scale(-1, 1);
        ctx.translate(-p.width, 0);
    }
    ctx.fillStyle = shakeRef.current > 0 ? '#ffffff' : '#dc2626';
    ctx.fillRect(5, 20, p.width - 10, p.height - 35);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(p.width/2 - 2, 22, 4, 15);
    ctx.fillStyle = '#000';
    ctx.fillRect(5, p.height - 15, p.width - 10, 15);
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath(); ctx.arc(p.width/2, 12, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#171717';
    ctx.beginPath(); ctx.arc(p.width/2, 8, 13, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(p.width/2, -5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }, []);

  const update = useCallback(() => {
    if (gameState === 'PLAYING') {
      if (shakeRef.current > 0) shakeRef.current -= 0.5;

      // Update Nians
      niansRef.current = niansRef.current.map(n => {
        let nextX = n.x + n.speed * n.direction;
        let nextDir = n.direction;
        if (nextX >= n.endX) nextDir = -1;
        if (nextX <= n.startX) nextDir = 1;
        return { ...n, x: nextX, direction: nextDir };
      });

      // Update Player
      const p = playerRef.current;
      let nextVx = 0;
      if (keys.current['ArrowLeft'] || keys.current['KeyA']) nextVx = -PLAYER_SPEED;
      else if (keys.current['ArrowRight'] || keys.current['KeyD']) nextVx = PLAYER_SPEED;

      let nextVy = p.vy + GRAVITY;
      let nextIsJumping = p.isJumping;

      if ((keys.current['Space'] || keys.current['ArrowUp'] || keys.current['KeyW']) && !p.isJumping) {
        nextVy = JUMP_FORCE;
        nextIsJumping = true;
        sound.playSFX([150, 300], 'sine', 0.1);
      }

      let nextX = p.x + nextVx;
      let nextY = p.y + nextVy;

      INITIAL_PLATFORMS.forEach(plat => {
        if (nextVy >= 0) {
          if (nextX + p.width > plat.x && nextX < plat.x + plat.width &&
              p.y + p.height <= plat.y + 10 && nextY + p.height >= plat.y) {
            nextY = plat.y - p.height;
            nextVy = 0;
            nextIsJumping = false;
          }
        }
      });

      if (nextX < 0) nextX = 0;
      if (nextX > WORLD_WIDTH - p.width) nextX = WORLD_WIDTH - p.width;
      
      if (nextY > WORLD_HEIGHT) {
        setLives(l => l - 1);
        sound.playSFX([100, 50], 'sawtooth', 0.3);
        const safeRespawn = INITIAL_PLATFORMS.find(plat => plat.x <= nextX && plat.x + plat.width >= nextX) || INITIAL_PLATFORMS[0];
        nextX = safeRespawn.x + safeRespawn.width/2;
        nextY = safeRespawn.y - 100;
        nextVy = 0;
      }

      // Check Lanterns
      let hitLanternIdx: number | null = null;
      lanternsRef.current = lanternsRef.current.map(l => {
        if (!l.collected && nextX < l.x + 40 && nextX + p.width > l.x - 10 && 
            nextY < l.y + 40 && nextY + p.height > l.y - 10) {
          hitLanternIdx = l.questionIndex;
          return { ...l, collected: true };
        }
        return l;
      });

      if (hitLanternIdx !== null) {
        setGameState('QUIZ');
        setCurrentQuizIndex(hitLanternIdx);
        sound.playSFX([400, 800], 'sine', 0.2);
      }

      // Check Nians
      niansRef.current.forEach(n => {
        if (nextX < n.x + n.width - 5 && nextX + p.width > n.x + 5 &&
            nextY < n.y + n.height - 5 && nextY + p.height > n.y + 5) {
          setLives(l => l - 1);
          shakeRef.current = 10;
          sound.playSFX([100, 40], 'square', 0.3);
          nextX -= (p.direction === 'right' ? 100 : -100);
          nextY -= 30;
          nextVy = -5;
        }
      });

      playerRef.current = {
        ...p, x: nextX, y: nextY, vx: nextVx, vy: nextVy, isJumping: nextIsJumping,
        direction: nextVx !== 0 ? (nextVx > 0 ? 'right' : 'left') : p.direction
      };

      cameraXRef.current = Math.max(0, Math.min(nextX - window.innerWidth / 2, WORLD_WIDTH - window.innerWidth));
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx, canvas.width, canvas.height);
    }
    
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [update]);

  useEffect(() => {
    if (lives <= 0) {
      setGameState('GAMEOVER');
      sound.playSFX([200, 50], 'sawtooth', 1.0);
    }
  }, [lives]);

  useEffect(() => {
    if (collectedCount === 10) {
      setGameState('VICTORY');
      sound.playSFX([440, 880, 1320], 'sine', 1.5);
    }
  }, [collectedCount]);

  const onAnswer = (correct: boolean) => {
    if (correct) {
      setScore(s => s + 10);
      sound.playSFX([500, 1000], 'sine', 0.4);
    } else {
      sound.playSFX([300, 100], 'sawtooth', 0.4);
    }
    setCollectedCount(c => c + 1);
    setCurrentQuizIndex(null);
    setGameState('PLAYING');
  };

  const resize = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = 600;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sky-100 select-none">
      <canvas ref={canvasRef} className="w-full h-full bg-gradient-to-b from-red-50 to-amber-50" />

      {gameState === 'PLAYING' && (
        <>
          <HUD score={score} lives={lives} progress={collectedCount} />
          <button onClick={toggleMute} className="fixed top-4 right-4 z-50 p-3 bg-white/80 rounded-full shadow-lg border-2 border-red-600 hover:bg-red-50 transition-colors">
            {isMuted ? '🔇' : '🔊'}
          </button>
        </>
      )}

      {gameState === 'QUIZ' && currentQuizIndex !== null && (
        <QuizModal question={QUESTIONS[currentQuizIndex]} onAnswer={onAnswer} />
      )}

      {gameState === 'START' && (
        <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border-8 border-red-600 shadow-2xl text-center">
            <h1 className="text-5xl font-bold chinese-font text-red-600 mb-2">Sifu Mandarin</h1>
            <h2 className="text-xl font-bold text-gray-700 mb-6 uppercase tracking-widest">Tahun Baru Cina</h2>
            <div className="bg-red-50 p-5 rounded-2xl mb-8 text-left text-sm text-red-900 space-y-3">
              <p className="flex items-center"><span className="text-xl mr-2">🏃</span> <b>Anak Panah</b> atau <b>WASD</b>.</p>
              <p className="flex items-center"><span className="text-xl mr-2">🚀</span> <b>Lompat tinggi</b> dengan <b>Space</b> atau <b>Atas</b>.</p>
              <p className="flex items-center font-bold"><span className="text-xl mr-2">👹</span> AWAS! Raksasa <b>Nian</b>!</p>
            </div>
            <button onClick={initGame} className="w-full bg-red-600 hover:bg-red-700 text-white text-2xl font-bold py-5 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 border-b-8 border-red-800">
              MULA BERMAIN 🧧
            </button>
          </div>
        </div>
      )}

      {(gameState === 'GAMEOVER' || lives <= 0) && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border-8 border-gray-400 shadow-2xl text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4 uppercase">Gagal</h1>
            <p className="text-xl mb-6 text-gray-700 font-medium">Cuba lagi, sifu!</p>
            <div className="bg-gray-100 p-6 rounded-2xl mb-8 border-2 border-gray-200">
              <p className="text-gray-500 uppercase text-xs font-bold mb-1">Skor Akhir</p>
              <p className="text-5xl font-black text-red-600">{score}</p>
            </div>
            <button onClick={initGame} className="w-full bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-4 rounded-2xl transition-all shadow-xl border-b-4 border-red-800">
              CUBA SEMULA 🏮
            </button>
          </div>
        </div>
      )}

      {gameState === 'VICTORY' && (
        <div className="absolute inset-0 bg-red-600/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full border-8 border-yellow-400 shadow-2xl text-center animate-in zoom-in duration-500">
            <h1 className="text-5xl font-bold chinese-font text-red-600 mb-2">恭喜发财!</h1>
            <h2 className="text-2xl font-black text-gray-800 mb-4 uppercase">SYABAS!</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-300">
                <p className="text-xs text-yellow-600 font-bold mb-1 uppercase">Skor</p>
                <p className="text-3xl font-black text-yellow-700">{score}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-300">
                <p className="text-xs text-red-600 font-bold mb-1 uppercase">Soalan</p>
                <p className="text-3xl font-black text-red-700">{collectedCount}/10</p>
              </div>
            </div>
            <button onClick={initGame} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xl font-bold py-5 rounded-2xl transition-all shadow-xl border-b-4 border-yellow-700">
              MAIN LAGI 🎆
            </button>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      <div className="fixed bottom-8 left-8 flex space-x-6 md:hidden z-40">
        <button 
          onMouseDown={() => { keys.current['ArrowLeft'] = true; }} onMouseUp={() => { keys.current['ArrowLeft'] = false; }}
          onTouchStart={() => { keys.current['ArrowLeft'] = true; }} onTouchEnd={() => { keys.current['ArrowLeft'] = false; }}
          className="w-20 h-20 bg-red-600/90 rounded-2xl text-white text-4xl shadow-xl active:bg-red-800 flex items-center justify-center border-b-4 border-red-900"
        > ← </button>
        <button 
          onMouseDown={() => { keys.current['ArrowRight'] = true; }} onMouseUp={() => { keys.current['ArrowRight'] = false; }}
          onTouchStart={() => { keys.current['ArrowRight'] = true; }} onTouchEnd={() => { keys.current['ArrowRight'] = false; }}
          className="w-20 h-20 bg-red-600/90 rounded-2xl text-white text-4xl shadow-xl active:bg-red-800 flex items-center justify-center border-b-4 border-red-900"
        > → </button>
      </div>
      <div className="fixed bottom-8 right-8 md:hidden z-40">
        <button 
          onMouseDown={() => { keys.current['Space'] = true; }} onMouseUp={() => { keys.current['Space'] = false; }}
          onTouchStart={() => { keys.current['Space'] = true; }} onTouchEnd={() => { keys.current['Space'] = false; }}
          className="w-24 h-24 bg-yellow-500/90 rounded-full text-white font-black text-lg shadow-xl active:bg-yellow-700 flex items-center justify-center border-b-4 border-yellow-800"
        > LOMPAT </button>
      </div>
    </div>
  );
};

export default App;
