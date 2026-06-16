// 初期データ定義
const defaultScenesData = {
  school: [
    { id: 's_wallet', name: '財布・定期入れ', checked: false, isImportant: true },
    { id: 's_phone', name: 'スマートフォン', checked: false, isImportant: true },
    { id: 's_key', name: '自宅の鍵', checked: false, isImportant: true },
    { id: 's_id', name: '学生証', checked: false, isImportant: true },
    { id: 's1', name: '筆記用具', checked: false, isImportant: false },
    { id: 's2', name: '教科書・ノート', checked: false, isImportant: false },
    { id: 's3', name: 'ノートPC・充電器', checked: false, isImportant: false }
  ],
  work: [
    { id: 'w_wallet', name: '財布・定期入れ', checked: false, isImportant: true },
    { id: 'w_phone', name: 'スマートフォン', checked: false, isImportant: true },
    { id: 'w_key', name: '自宅の鍵', checked: false, isImportant: true },
    { id: 'w_seal', name: '印鑑', checked: false, isImportant: true },
    { id: 'w1', name: 'メモ帳・ボールペン', checked: false, isImportant: false },
    { id: 'w2', name: '制服・エプロン', checked: false, isImportant: false }
  ],
  play: [
    { id: 'p_wallet', name: '財布・身分証', checked: false, isImportant: true },
    { id: 'p_phone', name: 'スマートフォン', checked: false, isImportant: true },
    { id: 'p_key', name: '自宅の鍵', checked: false, isImportant: true },
    { id: 'p1', name: 'ワイヤレスイヤホン', checked: false, isImportant: false },
    { id: 'p2', name: 'モバイルバッテリー', checked: false, isImportant: false },
    { id: 'p3', name: 'ハンカチ・リップ・目薬', checked: false, isImportant: false }
  ],
  rainy: [
    { id: 'r_wallet', name: '財布・定期入れ', checked: false, isImportant: true },
    { id: 'r_phone', name: 'スマートフォン', checked: false, isImportant: true },
    { id: 'r_key', name: '自宅の鍵', checked: false, isImportant: true },
    { id: 'r1', name: '折りたたみ傘（または長傘）', checked: false, isImportant: false },
    { id: 'r2', name: 'タオル・ハンカチ', checked: false, isImportant: false },
    { id: 'r3', name: 'スマホ防水ケース / ビニール袋', checked: false, isImportant: false },
    { id: 'r4', name: '替えの靴下', checked: false, isImportant: false }
  ]
};

// アプリケーションの状態管理
let currentScene = 'school';
let scenesData = {};
let myTemplates = {};
let streak = { count: 0, lastCheckedDate: '' };
let historyLog = [];

// DOM要素の取得
const tabButtons = document.querySelectorAll('.tab-btn');
const itemListEl = document.getElementById('itemList');
const remainingText = document.getElementById('remainingText');
const percentText = document.getElementById('percentText');
const progressBarFill = document.getElementById('progressBarFill');
const resetSceneBtn = document.getElementById('resetSceneBtn');

const addItemForm = document.getElementById('addItemForm');
const newItemName = document.getElementById('newItemName');
const newItemImportant = document.getElementById('newItemImportant');

// マイテンプレート要素 (v4)
const templateSelector = document.getElementById('templateSelector');
const loadTemplateBtn = document.getElementById('loadTemplateBtn');
const deleteTemplateBtn = document.getElementById('deleteTemplateBtn');
const newTemplateName = document.getElementById('newTemplateName');
const saveTemplateBtn = document.getElementById('saveTemplateBtn');

// スケジュール・リスク要素
const departureTime = document.getElementById('departureTime');
const timeLeft = document.getElementById('timeLeft');
const riskCard = document.getElementById('riskCard');
const riskValue = document.getElementById('riskValue');
const riskReason = document.getElementById('riskReason');

// ステップガイドインジケーター (v4)
const step1Indicator = document.getElementById('step1-indicator');
const step2Indicator = document.getElementById('step2-indicator');
const step3Indicator = document.getElementById('step3-indicator');

const streakCount = document.getElementById('streakCount');
const historyList = document.getElementById('historyList');

const finalCheckModal = document.getElementById('finalCheckModal');
const finalCheckCbs = document.querySelectorAll('.final-check-cb');
const goBtn = document.getElementById('goBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const departureScreen = document.getElementById('departureScreen');

// アプリの初期化
function init() {
  loadAllData();

  // タブイベント
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentScene = btn.dataset.scene;
      renderList();
    });
  });

  // リセット
  resetSceneBtn.addEventListener('click', () => {
    if (confirm('現在の予定の持ち物リストをデフォルト状態に戻しますか？（追加したアイテムは消去されます）')) {
      scenesData[currentScene] = JSON.parse(JSON.stringify(defaultScenesData[currentScene]));
      saveScenesData();
      renderList();
    }
  });

  // 持ち物追加
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newItemName.value.trim();
    const isImportant = newItemImportant.checked;
    if (name) {
      addItem(name, isImportant);
      newItemName.value = '';
      newItemImportant.checked = false;
    }
  });

  // マイテンプレート保存 (v4)
  saveTemplateBtn.addEventListener('click', () => {
    const tName = newTemplateName.value.trim();
    if (!tName) {
      alert('テンプレート名を入力してください。');
      return;
    }
    saveMyTemplate(tName);
    newTemplateName.value = '';
  });

  // マイテンプレート読込 (v4)
  loadTemplateBtn.addEventListener('click', () => {
    const tName = templateSelector.value;
    if (!tName) {
      alert('テンプレートを選択してください。');
      return;
    }
    loadMyTemplate(tName);
  });

  // マイテンプレート削除 (v4)
  deleteTemplateBtn.addEventListener('click', () => {
    const tName = templateSelector.value;
    if (!tName) {
      alert('削除するテンプレートを選択してください。');
      return;
    }
    if (confirm(`テンプレート「${tName}」を削除しますか？`)) {
      deleteMyTemplate(tName);
    }
  });

  // モーダルイベント
  finalCheckCbs.forEach(cb => cb.addEventListener('change', checkModalStatus));
  goBtn.addEventListener('click', depart);
  closeModalBtn.addEventListener('click', () => {
    finalCheckModal.classList.remove('show');
    resetModalChecks();
  });

  // 時間設定の監視
  departureTime.addEventListener('change', () => {
    updateTimeLeft();
    updateStepGuide();
  });
  setInterval(updateTimeLeft, 60000); // 1分おきに残り時間を再計算

  // 初回レンダリング
  renderList();
  renderHistory();
  updateStepGuide();
}

// データのロード
function loadAllData() {
  // 1. 持ち物データ
  const savedScenes = localStorage.getItem('bagCheck_v4_scenesData');
  if (savedScenes) {
    scenesData = JSON.parse(savedScenes);
  } else {
    scenesData = JSON.parse(JSON.stringify(defaultScenesData));
    saveScenesData();
  }

  // 2. マイテンプレート (v4)
  const savedTemplates = localStorage.getItem('bagCheck_v4_myTemplates');
  if (savedTemplates) {
    myTemplates = JSON.parse(savedTemplates);
  } else {
    myTemplates = {};
  }
  updateTemplateDropdown();

  // 3. 連続日数 (v4)
  const savedStreak = localStorage.getItem('bagCheck_v4_streak');
  if (savedStreak) {
    streak = JSON.parse(savedStreak);
  } else {
    streak = { count: 0, lastCheckedDate: '' };
  }
  updateStreakUI();

  // 4. お出かけ履歴 (v4)
  const savedHistory = localStorage.getItem('bagCheck_v4_history');
  if (savedHistory) {
    historyLog = JSON.parse(savedHistory);
  } else {
    historyLog = [];
  }

  }

// データ保存用ヘルパー
function saveScenesData() {
  localStorage.setItem('bagCheck_v4_scenesData', JSON.stringify(scenesData));
}

// 持ち物リストの描画
function renderList() {
  itemListEl.innerHTML = '';
  const currentItems = scenesData[currentScene] || [];

  if (currentItems.length === 0) {
    itemListEl.innerHTML = '<li class="no-items-msg" style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.85rem;">持ち物がありません。追加してみましょう！</li>';
    updateProgress();
    return;
  }

  // ソート：未チェックの重要アイテム ➔ 未チェックの通常 ➔ チェック済みの重要 ➔ チェック済みの通常
  const sortedItems = [...currentItems].sort((a, b) => {
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }
    if (a.isImportant !== b.isImportant) {
      return a.isImportant ? -1 : 1;
    }
    return 0;
  });

  sortedItems.forEach(item => {
    const li = document.createElement('li');
    li.className = `item-card ${item.isImportant ? 'important' : ''} ${item.checked ? 'checked' : ''}`;

    li.innerHTML = `
      <label class="item-left">
        <input type="checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
        <span class="custom-checkbox"></span>
        <span class="item-name-wrapper">
          ${item.isImportant ? '<span class="important-badge">🔥 重要</span>' : ''}
          <span class="item-name">${item.name}</span>
        </span>
      </label>
      <button class="delete-btn" data-id="${item.id}">×</button>
    `;

    // チェックボックス変更イベント
    const cb = li.querySelector('input[type="checkbox"]');
    cb.addEventListener('change', (e) => {
      toggleCheck(item.id, e.target.checked);
    });

    // 削除イベント
    const delBtn = li.querySelector('.delete-btn');
    delBtn.addEventListener('click', () => {
      deleteItem(item.id);
    });

    itemListEl.appendChild(li);
  });

  updateProgress();
}

// チェック切り替え
function toggleCheck(id, isChecked) {
  const currentItems = scenesData[currentScene] || [];
  const item = currentItems.find(i => i.id === id);
  if (item) {
    item.checked = isChecked;
    saveScenesData();
    updateStepGuide();
    
    // チェック時にソートを動かすため少しディレイして再描画
    setTimeout(renderList, 250);
  }
}

// 持ち物追加
function addItem(name, isImportant) {
  const newId = 'item_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const newItem = {
    id: newId,
    name: name,
    checked: false,
    isImportant: isImportant
  };
  scenesData[currentScene].push(newItem);
  saveScenesData();
  renderList();
}

// 持ち物削除
function deleteItem(id) {
  scenesData[currentScene] = (scenesData[currentScene] || []).filter(item => item.id !== id);
  saveScenesData();
  renderList();
}

// 進捗の更新
function updateProgress() {
  const currentItems = scenesData[currentScene] || [];
  const total = currentItems.length;

  if (total === 0) {
    remainingText.textContent = '残り 0 個';
    percentText.textContent = '0%';
    progressBarFill.style.width = '0%';
    updateRisk(0, 0);
    return;
  }

  const checkedCount = currentItems.filter(i => i.checked).length;
  const remainingCount = total - checkedCount;
  const percentage = Math.round((checkedCount / total) * 100);

  remainingText.textContent = `残り ${remainingCount} 個`;
  percentText.textContent = `${percentage}%`;
  progressBarFill.style.width = `${percentage}%`;

  const remainingImportant = currentItems.filter(i => i.isImportant && !i.checked).length;
  updateRisk(remainingCount, remainingImportant);
  updateStepGuide();

  // すべてチェック完了時に最終確認モーダルを立ち上げる
  if (remainingCount === 0 && total > 0) {
    setTimeout(() => {
      if (!finalCheckModal.classList.contains('show') && !departureScreen.classList.contains('active')) {
        resetModalChecks();
        finalCheckModal.classList.add('show');
        updateStepGuide();
      }
    }, 450);
  }
}

// 忘れ物リスク判定 (v3機能の移植・調整)
function updateRisk(remainingCount, remainingImportant) {
  riskCard.className = 'risk-card';

  if (remainingCount === 0) {
    riskCard.classList.add('low');
    riskValue.textContent = '低';
    riskReason.textContent = 'すべての持ち物が準備されています。';
  } else if (remainingImportant > 0) {
    // 重要アイテムが未チェック
    riskCard.classList.add('high');
    riskValue.textContent = '高';
    riskReason.textContent = `重要アイテム（あと ${remainingImportant} 個）が未チェックです！`;
  } else if (remainingCount >= 4) {
    // 未チェック個数が多い
    riskCard.classList.add('mid');
    riskValue.textContent = '中';
    riskReason.textContent = `未チェックの通常荷物が ${remainingCount} 個あります。確認しましょう。`;
  } else {
    // 残りが通常アイテムのみで少量
    riskCard.classList.add('low');
    riskValue.textContent = '低';
    riskReason.textContent = `重要アイテムは確認済みです。残りは ${remainingCount} 個です。`;
  }
}

// 出発予定までの残り時間計算 (v3機能)
function updateTimeLeft() {
  const timeValue = departureTime.value;
  if (!timeValue) {
    timeLeft.textContent = '未設定';
    return;
  }

  const now = new Date();
  const [hours, minutes] = timeValue.split(':').map(Number);
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // 予定時間が現在時刻より前なら翌日に設定
  if (target < now) {
    target.setDate(target.getDate() + 1);
  }

  const diffMs = target - now;
  const diffMin = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;

  if (h > 0) {
    timeLeft.textContent = `${h}時間${m}分`;
  } else if (m >= 0) {
    timeLeft.textContent = `${m}分`;
  } else {
    timeLeft.textContent = '出発時間経過';
  }
}

// 3ステップガイドの更新 (v4)
function updateStepGuide() {
  // すべてのアクティブクラスをリセット
  step1Indicator.classList.remove('active');
  step2Indicator.classList.remove('active');
  step3Indicator.classList.remove('active');

  const hasTime = !!departureTime.value;
  const currentItems = scenesData[currentScene] || [];
  const total = currentItems.length;
  const checked = currentItems.filter(i => i.checked).length;
  const isFinished = total > 0 && checked === total;

  if (isFinished || finalCheckModal.classList.contains('show')) {
    step3Indicator.classList.add('active');
  } else if (hasTime || checked > 0) {
    step2Indicator.classList.add('active');
  } else {
    step1Indicator.classList.add('active');
  }
}

// マイテンプレート機能 (v4)
function saveMyTemplate(templateName) {
  // 現在の持ち物リストを取得（チェック状態は初期化して保存）
  const currentItems = scenesData[currentScene] || [];
  if (currentItems.length === 0) {
    alert('現在の持ち物リストが空のため、保存できません。');
    return;
  }

  const templateItems = currentItems.map(item => ({
    id: item.id,
    name: item.name,
    checked: false,
    isImportant: item.isImportant
  }));

  myTemplates[templateName] = templateItems;
  localStorage.setItem('bagCheck_v4_myTemplates', JSON.stringify(myTemplates));
  updateTemplateDropdown();
  alert(`マイテンプレート「${templateName}」を保存しました！`);
}

function loadMyTemplate(templateName) {
  const templateItems = myTemplates[templateName];
  if (!templateItems) return;

  // 現在のリストにロードする（ディープコピー）
  scenesData[currentScene] = JSON.parse(JSON.stringify(templateItems));
  saveScenesData();
  renderList();
  alert(`テンプレート「${templateName}」を展開しました。`);
}

function deleteMyTemplate(templateName) {
  delete myTemplates[templateName];
  localStorage.setItem('bagCheck_v4_myTemplates', JSON.stringify(myTemplates));
  updateTemplateDropdown();
  alert(`テンプレート「${templateName}」を削除しました。`);
}

function updateTemplateDropdown() {
  // セレクトボックスをクリアし、再構築
  templateSelector.innerHTML = '<option value="">-- 保存したセットを選択 --</option>';
  Object.keys(myTemplates).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    templateSelector.appendChild(opt);
  });
}

// 連続チェック日数 (Streak) と履歴 (History) の管理 (v4)
function updateStreakUI() {
  streakCount.textContent = streak.count;
}

function renderHistory() {
  historyList.innerHTML = '';
  if (historyLog.length === 0) {
    historyList.innerHTML = '<p class="empty-history-msg">出発するとここに「忘れ物なし」の記録が残ります！</p>';
    return;
  }

  // 最新10件を表示
  const recentLogs = [...historyLog].reverse().slice(0, 10);
  recentLogs.forEach(dateStr => {
    const badge = document.createElement('span');
    badge.className = 'history-badge';
    badge.innerHTML = `✅ ${dateStr} 忘れ物なし`;
    historyList.appendChild(badge);
  });
}

// 出発前最終確認モーダルのチェック制御
function checkModalStatus() {
  const allChecked = Array.from(finalCheckCbs).every(cb => cb.checked);
  goBtn.disabled = !allChecked;
}

function resetModalChecks() {
  finalCheckCbs.forEach(cb => cb.checked = false);
  goBtn.disabled = true;
}

// 出発アクション (v4)
function depart() {
  finalCheckModal.classList.remove('show');

  // 今日のお出かけ日付の生成
  const today = new Date();
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  // 連続日数の更新
  updateStreak(dateStr);

  // 履歴に追加
  if (!historyLog.includes(dateStr)) {
    historyLog.push(dateStr);
    localStorage.setItem('bagCheck_v4_history', JSON.stringify(historyLog));
    renderHistory();
  }

  // 出発アニメーション起動
  departureScreen.classList.add('active');

  setTimeout(() => {
    departureScreen.classList.remove('active');

    // 次のお出かけ準備のため、チェック状態をすべて解除
    const currentItems = scenesData[currentScene] || [];
    currentItems.forEach(item => item.checked = false);
    saveScenesData();
    renderList();
    updateStepGuide();
  }, 3000);
}

// Streak（継続）計算ロジック (v4)
function updateStreak(todayStr) {
  if (streak.lastCheckedDate === todayStr) {
    // 今日既にチェックしている場合は何もしない（二重カウント防止）
    return;
  }

  const today = new Date(todayStr);
  
  if (streak.lastCheckedDate) {
    const lastDate = new Date(streak.lastCheckedDate);
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // 昨日チェックしていた場合 ➔ 連続継続
      streak.count += 1;
    } else {
      // 2日以上空いた場合 ➔ リセットして1日目
      streak.count = 1;
    }
  } else {
    // 初めての登録 ➔ 1日目
    streak.count = 1;
  }

  streak.lastCheckedDate = todayStr;
  localStorage.setItem('bagCheck_v4_streak', JSON.stringify(streak));
  updateStreakUI();
}

// HTMLエスケープヘルパー
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 起動
document.addEventListener('DOMContentLoaded', init);
