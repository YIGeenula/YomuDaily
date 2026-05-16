// Example of a reading (added in another file)
let readings = [
    {
        title: "茶色い猫",
        level: "N5",
        time: "2 min",
        mood: "午後",
        text: `<ruby>茶色<rt>ちゃいろ</rt></ruby>い<ruby>猫<rt>ねこ</rt></ruby>が、<ruby>町<rt>まち</rt></ruby>の<ruby>細<rt>ほそ</rt></ruby>い<ruby>道<rt>みち</rt></ruby>を<ruby>歩<rt>ある</rt></ruby>いていました。<ruby>猫<rt>ねこ</rt></ruby>は<ruby>小<rt>ちい</rt></ruby>さなパン<ruby>屋<rt>や</rt></ruby>の<ruby>前<rt>まえ</rt></ruby>で<ruby>止<rt>と</rt></ruby>まり、<ruby>焼<rt>や</rt></ruby>きたてのパンのにおいをかぎました。<ruby>店<rt>みせ</rt></ruby>の<ruby>人<rt>ひと</rt></ruby>は<ruby>笑<rt>わら</rt></ruby>って、ドアを<ruby>少<rt>すこ</rt></ruby>し<ruby>開<rt>あ</rt></ruby>けました。`,
        question: "猫はどこの前で止まりましたか。",
        meaning: "A brown cat walks down a narrow town street. It stops outside a small bakery to smell fresh bread, and the shopkeeper smiles and opens the door a little.",
        words: [
            ["茶色", "ちゃいろ", "brown"],
            ["細い", "ほそい", "narrow"],
            ["焼きたて", "やきたて", "freshly baked"],
            ["開ける", "あける", "to open"]
        ]
    },
];

const els = {
    body: document.body,
    panel: document.querySelector("#readerPanel"),
    todayLabel: document.querySelector("#todayLabel"),
    title: document.querySelector("#readingTitle"),
    text: document.querySelector("#readingText"),
    words: document.querySelector("#wordList"),
    wordCount: document.querySelector("#wordCount"),
    meaningSection: document.querySelector("#meaningSection"),
    meaningText: document.querySelector("#meaningText"),
    furiganaToggle: document.querySelector("#furiganaToggle"),
    meaningToggle: document.querySelector("#meaningToggle"),
    randomButton: document.querySelector("#randomButton"),
    prevButton: document.querySelector("#prevButton"),
    nextButton: document.querySelector("#nextButton"),
    levelSelect: document.querySelector("#levelSelect")
};

// Append the N5 readings from n5-paragraphs.js
if (typeof n5Readings !== 'undefined') {
    readings = [...n5Readings, ...readings];
}

const state = {
    index: getDailyIndex(),
    dailyIndex: getDailyIndex(),
    showFurigana: true,
    showMeaning: false,
    currentLevel: "All"
};

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getDailyIndex() {
    const start = new Date(2026, 0, 1);
    const today = new Date();
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.floor((current - start) / 86400000);
    return Math.abs(days) % readings.length;
}

function getCompletedDates() {
    try {
        return JSON.parse(localStorage.getItem("nihongo.completedDates") || "[]");
    } catch {
        return [];
    }
}

function setCompletedDates(dates) {
    localStorage.setItem("nihongo.completedDates", JSON.stringify([...new Set(dates)].sort()));
}

function formatToday() {
    const formatter = new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric"
    });
    els.todayLabel.textContent = formatter.format(new Date());
}

function calculateStreak(dates) {
    const completed = new Set(dates);
    let count = 0;
    const cursor = new Date();

    while (completed.has(getDateKey(cursor))) {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return count;
}

function renderProgress() {
    const todayKey = getDateKey();
    const completed = getCompletedDates();
    const isComplete = completed.includes(todayKey);
    const streak = calculateStreak(completed);

    els.completeButton.classList.toggle("is-complete", isComplete);
    els.progressDot.classList.toggle("is-complete", isComplete);
    els.completeButton.textContent = isComplete ? "Read today" : "Mark read";
    els.streakText.textContent = `${streak} day${streak === 1 ? "" : "s"} streak`;
    els.progressText.textContent = isComplete
        ? "Today's paragraph is complete. Come back tomorrow for a fresh one."
        : "Read today's paragraph to start.";
}

function renderReading(index) {
    const reading = readings[index];

    els.panel.classList.add("is-changing");

    window.setTimeout(() => {
        els.title.innerHTML = reading.title;
        els.text.innerHTML = reading.text;
        els.meaningText.innerHTML = reading.meaning;
        els.words.innerHTML = reading.words
            .map(([kanji, kana, english]) => {
                return `<div class="word-card"><b lang="ja">${kanji}</b><small>${kana}<br>${english}</small></div>`;
            })
            .join("");
        els.wordCount.textContent = `${reading.words.length} words`;
        els.panel.classList.remove("is-changing");
    }, 160);
}

function updateFurigana() {
    els.body.classList.toggle("hide-furigana", !state.showFurigana);
    els.furiganaToggle.textContent = state.showFurigana ? "ふりがな on" : "ふりがな off";
    els.furiganaToggle.setAttribute("aria-pressed", String(state.showFurigana));
}

function updateMeaning() {
    els.meaningSection.hidden = !state.showMeaning;
    els.meaningToggle.setAttribute("aria-pressed", String(state.showMeaning));
}

function selectReading(index) {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (CSS.highlights) CSS.highlights.delete('tts-highlight');
    state.index = index;
    renderReading(index);
}

els.furiganaToggle.addEventListener("click", () => {
    state.showFurigana = !state.showFurigana;
    updateFurigana();
});

els.meaningToggle.addEventListener("click", () => {
    state.showMeaning = !state.showMeaning;
    updateMeaning();
});

function getFilteredReadings() {
    if (state.currentLevel === "All") return readings;
    return readings.filter(r => r.level.includes(state.currentLevel));
}

els.levelSelect.addEventListener("change", (e) => {
    state.currentLevel = e.target.value;
    const filtered = getFilteredReadings();
    if (filtered.length > 0) {
        let next = readings.indexOf(filtered[Math.floor(Math.random() * filtered.length)]);
        selectReading(next);
    }
});

els.nextButton.addEventListener("click", () => {
    const filtered = getFilteredReadings();
    if (filtered.length === 0) return;

    // Find current index in the filtered array
    let currentFilteredIndex = filtered.indexOf(readings[state.index]);
    
    // If not found (e.g. level changed), start at 0
    if (currentFilteredIndex === -1) {
        currentFilteredIndex = 0;
    } else {
        // Go to next, wrap around
        currentFilteredIndex = (currentFilteredIndex + 1) % filtered.length;
    }
    
    selectReading(readings.indexOf(filtered[currentFilteredIndex]));
});

els.prevButton.addEventListener("click", () => {
    const filtered = getFilteredReadings();
    if (filtered.length === 0) return;

    let currentFilteredIndex = filtered.indexOf(readings[state.index]);
    
    if (currentFilteredIndex === -1) {
        currentFilteredIndex = 0;
    } else {
        // Go to prev, wrap around
        currentFilteredIndex = (currentFilteredIndex - 1 + filtered.length) % filtered.length;
    }
    
    selectReading(readings.indexOf(filtered[currentFilteredIndex]));
});

document.querySelector("#speakButton").addEventListener("click", () => {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (CSS.highlights) CSS.highlights.delete('tts-highlight');
        return;
    }

    let baseTextNodes = [];
    const walker = document.createTreeWalker(els.text, NodeFilter.SHOW_TEXT);
    let n;
    while (n = walker.nextNode()) {
        if (n.parentNode.tagName.toUpperCase() !== 'RT') {
            baseTextNodes.push(n);
        }
    }

    const plainTextForTTS = baseTextNodes.map(n => n.nodeValue).join('');
    const utterance = new SpeechSynthesisUtterance(plainTextForTTS);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;

    utterance.onboundary = (e) => {
        if (e.name !== 'word' && e.name !== 'sentence') return;

        let start = e.charIndex;
        let length = e.charLength || 2;

        let current = 0;
        let startNode = null, startOffset = 0;
        let endNode = null, endOffset = 0;

        for (let node of baseTextNodes) {
            let len = node.nodeValue.length;
            if (!startNode && current + len > start) {
                startNode = node;
                startOffset = start - current;
            }
            if (startNode && current + len >= start + length) {
                endNode = node;
                endOffset = start + length - current;
                break;
            }
            current += len;
        }

        if (startNode && !endNode) {
            endNode = baseTextNodes[baseTextNodes.length - 1];
            endOffset = endNode.nodeValue.length;
        }

        if (startNode && endNode && CSS.highlights) {
            const range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            const highlight = new Highlight(range);
            CSS.highlights.set('tts-highlight', highlight);
        }
    };

    utterance.onend = () => {
        if (CSS.highlights) CSS.highlights.delete('tts-highlight');
    };

    window.speechSynthesis.speak(utterance);
});

formatToday();
updateFurigana();
updateMeaning();
renderReading(state.index);