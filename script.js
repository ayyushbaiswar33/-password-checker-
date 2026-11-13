'use strict';

const $ = (id) => document.getElementById(id);
const passwordInput = $('passwordInput');

// AUDIO FILES
// Keep all MP3 files in the same folder as index.html.
const sounds = {
  weak: new Audio('./weak.mp3'),
  strong: new Audio('./strong.mp3'),
  excellent: new Audio('./excellent.mp3'),
  typing: new Audio('./typing.mp3')
};

Object.values(sounds).forEach((sound) => {
  sound.preload = 'auto';
  sound.volume = 0.7;
});

let lastSoundLevel = '';

function playSound(soundName) {
  const sound = sounds[soundName];
  if (!sound) return;

  sound.pause();
  sound.currentTime = 0;

  const playback = sound.play();

  if (playback && typeof playback.catch === 'function') {
    playback.catch((error) => {
      console.warn(`${soundName} sound could not play:`, error);
    });
  }
}

function playStrengthSound(result) {
  if (!passwordInput.value) {
    lastSoundLevel = '';
    return;
  }

  let soundLevel;

  if (result.score >= 80) {
    soundLevel = 'excellent';
  } else if (result.score >= 60) {
    soundLevel = 'strong';
  } else {
    soundLevel = 'weak';
  }

  // Play sound only when password strength changes category.
  if (soundLevel !== lastSoundLevel) {
    lastSoundLevel = soundLevel;
    playSound(soundLevel);
  }
}

const commonPasswords = new Set([
  '123456','123456789','12345678','12345','1234567',
  'password','password1','password123','qwerty',
  'qwerty123','abc123','111111','123123','admin',
  'letmein','welcome','iloveyou','monkey','dragon',
  'football','baseball',' sunshine','princess','master',
  'login','passw0rd','P@ssw0rd','qwertyuiop',
  '1q2w3e4r','000000','654321','secret','changeme',
  'trustno1'
].map(x => x.trim().toLowerCase()));

function hasRepeatedPattern(value) {
  if (!value) return false;
  if (/^(.)\1+$/.test(value)) return true;

  const lower = value.toLowerCase();

  if (/^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321)/.test(lower)) return true;
  if (/^(qwerty|asdf|zxcv|qazwsx)/.test(lower)) return true;

  return false;
}

function calculateEntropy(password) {
  let pool = 0;

  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;

  if (!pool || !password.length) return 0;

  let entropy = password.length * Math.log2(pool);

  if (commonPasswords.has(password.toLowerCase())) entropy = Math.min(entropy, 8);
  if (hasRepeatedPattern(password)) entropy *= 0.35;
  if (/password|qwerty|admin|welcome|letmein|iloveyou/i.test(password)) entropy *= 0.55;

  return Math.max(0, entropy);
}

function estimateCrackTime(entropy) {
  if (!entropy) return '—';

  const seconds = Math.pow(2, Math.min(entropy, 1024)) / 1e10;

  if (seconds < 1) return 'Instantly';
  if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)} hours`;
  if (seconds < 31557600) return `${Math.ceil(seconds / 86400)} days`;
  if (seconds < 31557600 * 1000) return `${Math.ceil(seconds / 31557600)} years`;
  if (seconds < 31557600 * 1e9) return `${(seconds / 31557600 / 1e6).toFixed(1)} million years`;

  return 'Billions+ of years';
}

function analyze(password) {
  const checks = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    unique: password.length > 0 &&
      !commonPasswords.has(password.toLowerCase()) &&
      !hasRepeatedPattern(password)
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const entropy = calculateEntropy(password);

  let score = Math.round(Math.min(100, entropy * 1.35));

  if (password.length < 8) score = Math.min(score, 25);
  if (commonPasswords.has(password.toLowerCase())) score = Math.min(score, 5);
  if (hasRepeatedPattern(password)) score = Math.min(score, 20);
  if (password.length >= 16 && passed >= 5 && entropy >= 65) score = Math.max(score, 80);

  let label = 'Very weak';
  let level = 'weak';

  if (password.length === 0) {
    label = 'Waiting for input';
    level = 'neutral';
    score = 0;
  } else if (score >= 80) {
    label = 'Very strong';
    level = 'strong';
  } else if (score >= 60) {
    label = 'Strong';
    level = 'strong';
  } else if (score >= 40) {
    label = 'Fair';
    level = 'fair';
  } else if (score >= 20) {
    label = 'Weak';
    level = 'weak';
  }

  return {
    checks,
    passed,
    entropy,
    score,
    label,
    level,
    common: commonPasswords.has(password.toLowerCase())
  };
}

function updateTips(password, result) {
  const tips = [];

  if (!password) {
    tips.push(
      'Start typing to get personalized security tips.',
      'Use a unique password for every account.',
      'Consider a password manager and multi-factor authentication.'
    );
  } else {
    if (result.common) tips.push('This password is on a small built-in common-password list. Choose something completely different.');
    if (password.length < 12) tips.push('Use at least 12–16 characters. A longer passphrase is easier to remember and harder to guess.');
    if (!result.checks.upper || !result.checks.lower) tips.push('Mix uppercase and lowercase letters, or use a few unrelated words.');
    if (!result.checks.number) tips.push('Add numbers in a way that is not predictable, such as a date or sequence.');
    if (!result.checks.symbol) tips.push('Consider adding punctuation or symbols to increase variety.');
    if (!result.checks.unique) tips.push('Avoid repeated characters, keyboard patterns, and predictable sequences.');
    if (result.score >= 60) tips.push('Good progress. Keep it unique to one account and store it in a reputable password manager.');
    tips.push('Turn on multi-factor authentication wherever it is available.');
  }

  $('tipsList').innerHTML = tips.slice(0, 4).map((tip, i) =>
    `<li><span class="tip-number">${String(i + 1).padStart(2, '0')}</span><span>${escapeHTML(tip)}</span></li>`
  ).join('');
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function renderAnalysis() {
  const password = passwordInput.value;
  const result = analyze(password);

  $('strengthLabel').textContent = result.label;
  $('strengthLabel').className = `strength-label ${result.level}`;
  $('strengthFill').style.width = `${result.score}%`;
  $('strengthProgress').setAttribute('aria-valuenow', result.score);
  $('scoreValue').textContent = password ? result.score : '—';

  $('scoreCaption').textContent = !password
    ? 'Your score appears here'
    : result.common
      ? 'Common password detected'
      : result.score >= 60
        ? 'Looking good — keep it unique'
        : 'A few improvements can help';

  $('crackTime').textContent = password ? estimateCrackTime(result.entropy) : '—';
  $('crackNote').textContent = password
    ? 'Illustrative estimate, not a guarantee'
    : 'Based on an offline estimate';

  $('charCount').textContent = password.length;

  Object.entries(result.checks).forEach(([key, passed]) => {
    const item = document.querySelector(`[data-check="${key}"]`);
    if (item) item.classList.toggle('pass', passed);
  });

  $('checkCount').textContent = `${result.passed} / 6 passed`;

  updateTips(password, result);

  // Play the matching password-strength sound.
  playStrengthSound(result);
}

// PASSWORD TYPING + SOUND
passwordInput.addEventListener('input', () => {
  if (passwordInput.value.length > 0) {
    playSound('typing');
  } else {
    lastSoundLevel = '';
  }

  renderAnalysis();
});

// VISIBILITY TOGGLE
$('visibilityToggle').addEventListener('click', () => {
  const reveal = passwordInput.type === 'password';

  passwordInput.type = reveal ? 'text' : 'password';

  $('visibilityToggle').setAttribute(
    'aria-label',
    reveal ? 'Hide password' : 'Show password'
  );
});

// THEME TOGGLE
$('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light');

  const light = document.body.classList.contains('light');

  $('themeToggle').setAttribute(
    'aria-label',
    light ? 'Switch to dark theme' : 'Switch to light theme'
  );

  document.querySelector('meta[name="theme-color"]').content =
    light ? '#f3f5fb' : '#0b1020';
});

// PASSWORD LENGTH
$('lengthRange').addEventListener('input', () => {
  $('lengthValue').textContent = $('lengthRange').value;
});

// SECURE RANDOM NUMBER
function secureRandomInt(max) {
  if (!Number.isSafeInteger(max) || max <= 0) {
    throw new Error('Invalid random range');
  }

  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;

  let value;

  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);

  return value % max;
}

function shuffleSecure(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

// GENERATE PASSWORD
function generatePassword() {
  const groups = [];

  if ($('includeUpper').checked) groups.push('ABCDEFGHJKLMNPQRSTUVWXYZ');
  if ($('includeLower').checked) groups.push('abcdefghijkmnopqrstuvwxyz');
  if ($('includeNumbers').checked) groups.push('23456789');
  if ($('includeSymbols').checked) groups.push('!@#$%^&*()-_=+[]{}?');

  if (!groups.length) {
    showToast('Select at least one character type.');
    return;
  }

  const length = Number($('lengthRange').value);

  if (length < groups.length) {
    showToast('Increase the length to fit each selected character type.');
    return;
  }

  const all = groups.join('');
  const chars = groups.map(group => group[secureRandomInt(group.length)]);

  while (chars.length < length) {
    chars.push(all[secureRandomInt(all.length)]);
  }

  const password = shuffleSecure(chars).join('');

  $('generatedPassword').value = password;
  passwordInput.value = password;

  renderAnalysis();
  showToast('Secure password generated.');
}

$('generateButton').addEventListener('click', generatePassword);

// COPY PASSWORD
async function copyText(value) {
  if (!value) {
    showToast('Nothing to copy yet.');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const temp = document.createElement('textarea');
      temp.value = value;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';

      document.body.appendChild(temp);
      temp.select();

      const ok = document.execCommand('copy');
      temp.remove();

      if (!ok) throw new Error('Copy failed');
    }

    showToast('Copied to clipboard.');
  } catch {
    showToast('Could not copy. Please select and copy manually.');
  }
}

$('copyGenerated').addEventListener('click', () =>
  copyText($('generatedPassword').value)
);

// TOAST MESSAGE
function showToast(message) {
  const toast = $('toast');

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// CURRENT YEAR
$('year').textContent = new Date().getFullYear();

// INITIAL DISPLAY
renderAnalysis();
