// 初期データ定義
const defaultScenesData = {
  school: [
    { id: 's1', name: '筆記用具', checked: false },
    { id: 's2', name: '教科書・ノート', checked: false },
    { id: 's3', name: '学生証', checked: false },
    { id: 's4', name: 'ノートPC・充電器', checked: false },
    { id: 's5', name: '水筒・ペットボトル', checked: false }
  ],
  work: [
    { id: 'w1', name: 'メモ帳・ボールペン', checked: false },
    { id: 'w2', name: '制服・エプロン', checked: false },
    { id: 'w3', name: '印鑑', checked: false },
    { id: 'w4', name: '財布・定期入れ', checked: false },
    { id: 'w5', name: 'スマホ', checked: false }
  ],
  play: [
    { id: 'p1', name: '財布・身分証', checked: false },
    { id: 'p2', name: 'スマートフォン', checked: false },
    { id: 'p3', name: 'ワイヤレスイヤホン', checked: false },
    { id: 'p4', name: 'モバイルバッテリー', checked: false },
    { id: 'p5', name: 'リップ・目薬・ハンカチ', checked: false }
  ],
  rainy: [
    { id: 'r1', name: '折りたたみ傘（または長傘）', checked: false },
    { id: 'r2', name: 'ハンカチ・タオル', checked: false },
    { id: 'r3', name: 'スマホ防水ケース / ビニール袋', checked: false },
    { id: 'r4', name: '替えの靴下', checked: false }
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
const addItemForm = document.getElementById('add-item-form');
const newItemNameInput = document.getElementById('new-item-name');
const celebrationModal = document.getElementById('celebration-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// アプリの初期化
function init() {
  // ローカルストレージからロード、なければデフォルトを使用
  const savedData = localStorage.getItem('bagCheck_scenesData');
  if (savedData) {
    scenesData = JSON.parse(savedData);
  } else {
    scenesData = JSON.parse(JSON.stringify(defaultScenesData)); // ディープコピー
    saveToLocalStorage();
  }

  // タブイベントの設定
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // アクティブタブの変更
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 場面の変更
      currentScene = btn.dataset.scene;
      renderList();
    });
  });

  // アイテム追加フォームイベントの設定
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newItemNameInput.value.trim();
    if (name) {
      addItem(name);
      newItemNameInput.value = '';
    }
  });

  // モーダル閉じるイベント
  closeModalBtn.addEventListener('click', () => {
    celebrationModal.classList.remove('show');
  });

  // 初回表示の描画
  renderList();
}

// データのローカルストレージ保存
function saveToLocalStorage() {
  localStorage.setItem('bagCheck_scenesData', JSON.stringify(scenesData));
}

// 持ち物リストのレンダリング
function renderList() {
  itemList.innerHTML = '';
  const currentItems = scenesData[currentScene] || [];

  if (currentItems.length === 0) {
    itemList.innerHTML = '<li class="no-items-msg" style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.95rem;">持ち物がありません。追加してみましょう！</li>';
    updateProgress();
    return;
  }

  currentItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'item-card';

    li.innerHTML = `
      <label class="item-left">
        <input type="checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
        <span class="custom-checkbox"></span>
        <span class="item-name">${item.name}</span>
      </label>
      <button class="delete-btn" data-id="${item.id}">×</button>
    `;

    // チェックボックス切り替えイベント
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
    updateProgress();
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

  // UI更新
  remainingCountEl.textContent = `残り ${remainingItems} 個`;
  progressPercentageEl.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;

  // お祝い演出 (全てチェックされた時、かつアイテムが1つ以上ある場合)
  if (remainingItems === 0 && totalItems > 0) {
    // 少しだけ遅延させてチェックアニメーション完了後に表示する
    setTimeout(() => {
      // 既にモーダルが開いていない場合のみ表示
      if (!celebrationModal.classList.contains('show')) {
        celebrationModal.classList.add('show');
      }
    }, 400);
  }
}

// アイテムの追加
function addItem(name) {
  const newId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const newItem = {
    id: newId,
    name: name,
    checked: false
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
