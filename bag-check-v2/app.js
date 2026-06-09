// 初期データ定義（v2: 財布、スマホ、鍵などの重要アイテムに isImportant フラグを追加）
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

// DOM要素の取得
const tabButtons = document.querySelectorAll('.tab-btn');
const itemList = document.getElementById('item-list');
const remainingCountEl = document.getElementById('remaining-count');
const progressPercentageEl = document.getElementById('progress-percentage');
const progressBar = document.getElementById('progress-bar');
const resetBtn = document.getElementById('reset-btn');

const addItemForm = document.getElementById('add-item-form');
const newItemNameInput = document.getElementById('new-item-name');
const newItemImportantInput = document.getElementById('new-item-important');

const finalCheckModal = document.getElementById('final-check-modal');
const finalCheckCbs = document.querySelectorAll('.final-check-cb');
const goBtn = document.getElementById('go-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const departureScreen = document.getElementById('departure-screen');

// アプリの初期化
function init() {
  // ローカルストレージからロード、なければデフォルトを使用
  const savedData = localStorage.getItem('bagCheck_v2_scenesData');
  if (savedData) {
    scenesData = JSON.parse(savedData);
  } else {
    resetToDefault();
  }

  // タブイベントの設定
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentScene = btn.dataset.scene;
      renderList();
    });
  });

  // リセットボタンの設定
  resetBtn.addEventListener('click', () => {
    if (confirm('現在の予定の持ち物リストをデフォルトの初期状態に戻しますか？（追加したカスタムアイテムは削除されます）')) {
      scenesData[currentScene] = JSON.parse(JSON.stringify(defaultScenesData[currentScene]));
      saveToLocalStorage();
      renderList();
    }
  });

  // アイテム追加フォームイベントの設定
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newItemNameInput.value.trim();
    const isImportant = newItemImportantInput.checked;
    if (name) {
      addItem(name, isImportant);
      newItemNameInput.value = '';
      newItemImportantInput.checked = false;
    }
  });

  // 最終確認モーダルのチェックボックスのイベント
  finalCheckCbs.forEach(cb => {
    cb.addEventListener('change', checkModalStatus);
  });

  // 出発ボタンイベント
  goBtn.addEventListener('click', depart);

  // モーダル閉じるイベント
  closeModalBtn.addEventListener('click', () => {
    finalCheckModal.classList.remove('show');
    resetModalChecks();
  });

  // 初回描画
  renderList();
}

// データのローカルストレージ保存
function saveToLocalStorage() {
  localStorage.setItem('bagCheck_v2_scenesData', JSON.stringify(scenesData));
}

// デフォルト状態にリセット
function resetToDefault() {
  scenesData = JSON.parse(JSON.stringify(defaultScenesData));
  saveToLocalStorage();
}

// 持ち物リストのレンダリング
function renderList() {
  itemList.innerHTML = '';
  let currentItems = scenesData[currentScene] || [];

  if (currentItems.length === 0) {
    itemList.innerHTML = '<li class="no-items-msg" style="text-align:center; padding:40px; color:var(--text-muted); font-size:0.95rem;">持ち物がありません。追加してみましょう！</li>';
    updateProgress();
    return;
  }

  // ソート処理 (v2機能: 重要度とチェック状態による並び替え)
  // 1. チェックされていない重要アイテム
  // 2. チェックされていない通常アイテム
  // 3. チェック済みの重要アイテム
  // 4. チェック済みの通常アイテム
  const sortedItems = [...currentItems].sort((a, b) => {
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1; // チェック済みを下に
    }
    if (a.isImportant !== b.isImportant) {
      return a.isImportant ? -1 : 1; // 重要アイテムを上に
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

    // チェックボックスイベント
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
      toggleCheck(item.id, e.target.checked);
    });

    // 削除イベント
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      deleteItem(item.id);
    });

    itemList.appendChild(li);
  });

  updateProgress();
}

// チェック切り替え処理
function toggleCheck(id, isChecked) {
  const currentItems = scenesData[currentScene] || [];
  const item = currentItems.find(i => i.id === id);
  if (item) {
    item.checked = isChecked;
    saveToLocalStorage();
    
    // アニメーションを感じさせるため、少し時間差をおいて再描画（ソート）させる
    setTimeout(() => {
      renderList();
    }, 250);
  }
}

// 進捗ステータスの計算と更新
function updateProgress() {
  const currentItems = scenesData[currentScene] || [];
  const totalItems = currentItems.length;

  if (totalItems === 0) {
    remainingCountEl.textContent = '残り 0 個';
    progressPercentageEl.textContent = '0%';
    progressBar.style.width = '0%';
    return;
  }

  const checkedItems = currentItems.filter(i => i.checked).length;
  const remainingItems = totalItems - checkedItems;
  const percentage = Math.round((checkedItems / totalItems) * 100);

  remainingCountEl.textContent = `残り ${remainingItems} 個`;
  progressPercentageEl.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;

  // 出発前の最終確認モーダル起動 (v2追加: すべての持ち物をチェック完了した時)
  if (remainingItems === 0 && totalItems > 0) {
    setTimeout(() => {
      if (!finalCheckModal.classList.contains('show') && !departureScreen.classList.contains('active')) {
        resetModalChecks();
        finalCheckModal.classList.add('show');
      }
    }, 450);
  }
}

// モーダル内の確認チェックボックスが全て完了したか検証
function checkModalStatus() {
  const allChecked = Array.from(finalCheckCbs).every(cb => cb.checked);
  goBtn.disabled = !allChecked;
}

// モーダルチェックボックスのリセット
function resetModalChecks() {
  finalCheckCbs.forEach(cb => cb.checked = false);
  goBtn.disabled = true;
}

// 出発アクション (v2機能: ロケットアニメーション演出)
function depart() {
  // モーダルを閉じる
  finalCheckModal.classList.remove('show');
  
  // 出発アニメーションの起動
  departureScreen.classList.add('active');

  // アニメーション表示後にリセットして元に戻す (3秒間)
  setTimeout(() => {
    departureScreen.classList.remove('active');
    
    // お出かけ完了後は、次の日の準備のためにチェックリストをすべてオフにする
    const currentItems = scenesData[currentScene] || [];
    currentItems.forEach(item => item.checked = false);
    saveToLocalStorage();
    renderList();
  }, 3200);
}

// アイテムの追加
function addItem(name, isImportant) {
  const newId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const newItem = {
    id: newId,
    name: name,
    checked: false,
    isImportant: isImportant
  };

  scenesData[currentScene].push(newItem);
  saveToLocalStorage();
  renderList();
}

// アイテムの削除
function deleteItem(id) {
  scenesData[currentScene] = scenesData[currentScene].filter(item => item.id !== id);
  saveToLocalStorage();
  renderList();
}

// 起動
document.addEventListener('DOMContentLoaded', init);
