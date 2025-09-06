// Browser notification and vibration utilities

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showTimeUpNotification = (roundNo?: number): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const title = 'pairkuji - 時間終了';
  const body = roundNo 
    ? `第${roundNo}ラウンドの時間が終了しました` 
    : '設定された時間が終了しました';
  
  const notification = new Notification(title, {
    body,
    icon: '/icon-192x192.png', // PWA icon
    badge: '/icon-192x192.png',
    tag: 'pairkuji-timer', // Replace previous notifications with same tag
    requireInteraction: true, // Keep notification visible until user interacts
    silent: false,
  });

  // Auto-close after 10 seconds if user doesn't interact
  setTimeout(() => {
    notification.close();
  }, 10000);

  // Handle notification click
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

export const vibrate = (pattern: number[] = [500, 200, 500, 200, 500]): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

export const playTimeUpSound = (): void => {
  // Create a simple beep sound using Web Audio API
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // Repeat beep 3 times
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(800, audioContext.currentTime);
        
        gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      }, 600);
      
      setTimeout(() => {
        const oscillator3 = audioContext.createOscillator();
        const gainNode3 = audioContext.createGain();
        
        oscillator3.connect(gainNode3);
        gainNode3.connect(audioContext.destination);
        
        oscillator3.type = 'sine';
        oscillator3.frequency.setValueAtTime(800, audioContext.currentTime);
        
        gainNode3.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode3.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator3.start(audioContext.currentTime);
        oscillator3.stop(audioContext.currentTime + 0.5);
      }, 1200);
      
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }
};

export const requestPermissions = async (): Promise<{
  notifications: boolean;
  sound: boolean;
}> => {
  const notifications = await requestNotificationPermission();
  
  // For sound, we need user interaction to create AudioContext
  let sound = false;
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    sound = true;
  }
  
  return { notifications, sound };
};