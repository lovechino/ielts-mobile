# IELTS Mobile App — Thiết Kế UI/UX & Kế Hoạch Kỹ Thuật (React Native + Expo)

> **Stack:** React Native + Expo · **PDF Engine:** pdfjs-dist · **Phiên bản:** 1.0  
> Tài liệu này cover toàn bộ: kiến trúc layout mobile, thiết kế từng dạng bài (Reading / Listening / Writing), component system, và data schema.

---

## MỤC LỤC

1. [Triết lý thiết kế Mobile](#1-triết-lý-thiết-kế-mobile)
2. [Kiến trúc Navigation](#2-kiến-trúc-navigation)
3. [PDF Engine với pdfjs-dist](#3-pdf-engine-với-pdfjs-dist)
4. [READING — Toàn bộ dạng bài](#4-reading--toàn-bộ-dạng-bài)
5. [LISTENING — Toàn bộ dạng bài](#5-listening--toàn-bộ-dạng-bài)
6. [WRITING — Toàn bộ dạng bài](#6-writing--toàn-bộ-dạng-bài)
7. [Shared Components](#7-shared-components)
8. [Data Schema tổng quát](#8-data-schema-tổng-quát)
9. [Phase Breakdown](#9-phase-breakdown)

---

## 1. TRIẾT LÝ THIẾT KẾ MOBILE

### Nguyên tắc cốt lõi

| # | Nguyên tắc | Chi tiết |
|---|-----------|---------|
| 1 | **One-thumb rule** | Mọi action chính nằm trong vùng ngón cái (bottom 60% màn hình) |
| 2 | **Context always visible** | Passage/Audio luôn accessible, không bao giờ bị ẩn hoàn toàn |
| 3 | **Progressive disclosure** | Chỉ hiện thông tin cần thiết tại thời điểm đó |
| 4 | **Forgiveness** | User có thể thay đổi đáp án bất kỳ lúc nào trước khi submit |
| 5 | **No horizontal scroll** | Mọi content fit trong chiều ngang màn hình |

### Layout Pattern cho từng kỹ năng

```
READING                    LISTENING                  WRITING
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Passage Header  │       │  Audio Player    │       │  Task Prompt     │
│  (collapsible)   │       │  (sticky top)    │       │  (collapsible)   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│                  │       │                  │       │                  │
│  [TAB: Passage]  │       │  Questions list  │       │  Text Editor     │
│  [TAB: Questions]│       │  (scrollable)    │       │  (full screen)   │
│                  │       │                  │       │                  │
│  Swipe để chuyển │       │  Auto-scroll     │       │  Word count bar  │
│                  │       │  theo audio      │       │                  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│  Bottom Nav Bar  │       │  Bottom Nav Bar  │       │  Bottom Toolbar  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### Màu sắc & Typography

```typescript
// src/theme/colors.ts
export const COLORS = {
  // Primary
  primary:   '#1B4F8A',
  primarySoft: '#E6F0FA',

  // Skill-specific accents
  reading:  '#1B4F8A',   // xanh navy — học thuật, tập trung
  listening: '#0F7C4A',  // xanh lá — năng động, âm nhạc
  writing:  '#6B3FA0',   // tím — sáng tạo, ngôn ngữ

  // Answer states
  correct:   '#22C55E',
  incorrect: '#EF4444',
  pending:   '#F59E0B',
  unanswered: '#9CA3AF',

  // UI
  surface:   '#FFFFFF',
  background: '#F5F6FA',
  border:    '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textHint:  '#9CA3AF',
};

// src/theme/typography.ts
export const TYPOGRAPHY = {
  passageBody: { fontSize: 16, lineHeight: 26, fontFamily: 'Georgia' },
  questionText: { fontSize: 15, lineHeight: 22, fontFamily: 'System' },
  optionText:  { fontSize: 14, lineHeight: 20, fontFamily: 'System' },
  label:       { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  timerText:   { fontSize: 16, fontFamily: 'Menlo', fontWeight: '600' },
};
```

---

## 2. KIẾN TRÚC NAVIGATION

```
RootNavigator (Stack)
├── AuthStack
│   ├── OnboardingScreen
│   ├── LoginScreen
│   └── RegisterScreen
│
├── MainTabs (Bottom Tab Navigator)
│   ├── HomeTab
│   ├── PracticeTab
│   ├── HistoryTab
│   └── ProfileTab
│
└── ExamStack (Modal, full-screen, no tabs)
    ├── ExamIntroScreen       ← Giới thiệu đề, timer warning
    ├── ReadingExamScreen     ← Layout Reading
    ├── ListeningExamScreen   ← Layout Listening
    ├── WritingExamScreen     ← Layout Writing
    ├── ExamReviewScreen      ← Xem lại đáp án
    └── ExamResultScreen      ← Kết quả + band score
```

### ExamSession Context (shared state)

```typescript
// src/context/ExamSessionContext.tsx
interface ExamSession {
  examId: string;
  skill: 'reading' | 'listening' | 'writing';
  sections: Section[];
  answers: Record<number, Answer>;
  timeRemaining: number;       // giây
  startedAt: Date;
  currentSectionIndex: number;
  currentQuestionId: number | null;

  // Actions
  setAnswer: (questionId: number, value: Answer) => void;
  flagQuestion: (questionId: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
}
```

---

## 3. PDF ENGINE VỚI PDFJS-DIST

### Vấn đề với React Native + pdfjs-dist

`pdfjs-dist` được viết cho browser (Web Worker, Canvas API). Trong React Native không có DOM. Giải pháp: **render PDF bên trong WebView**.

### Kiến trúc: PDF → WebView Pipeline

```
[PDF file on device]
       │
       ▼
[pdfjs-dist bên trong WebView]    ← Chạy trong môi trường web
       │  render thành HTML/Canvas
       ▼
[React Native WebView]            ← Bridge giữa RN và Web
       │  postMessage để sync state
       ▼
[RN: highlight, scroll, state]    ← Điều khiển từ RN side
```

### Setup

```bash
npx expo install react-native-webview expo-file-system
npm install pdfjs-dist
```

### HTML Template cho WebView

```typescript
// src/pdf/pdfViewerHTML.ts
export function buildPDFViewerHTML(pdfBase64: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, serif;
    font-size: 15px;
    line-height: 1.7;
    color: #111827;
    padding: 16px;
    background: #fff;
    -webkit-text-size-adjust: 100%;
  }
  .page { margin-bottom: 24px; }
  canvas { max-width: 100% !important; height: auto !important; }

  /* Highlight classes */
  .hl-yellow { background: #FEF3C7; border-radius: 2px; }
  .hl-active  { background: #BFDBFE; border-radius: 2px; }
  .hl-keyword { background: #D1FAE5; border-radius: 2px; }

  /* Text layer cho copy/highlight */
  .textLayer {
    position: absolute; top: 0; left: 0;
    line-height: 1; overflow: hidden; opacity: 0.2;
    user-select: text; -webkit-user-select: text;
  }
  .textLayer > span {
    color: transparent; position: absolute;
    white-space: pre; cursor: text;
    transform-origin: 0% 0%;
  }
</style>
</head>
<body>
<div id="pdfContainer"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const pdfData = atob('${pdfBase64}');
const pdfArray = new Uint8Array(pdfData.length);
for (let i = 0; i < pdfData.length; i++) pdfArray[i] = pdfData.charCodeAt(i);

async function renderPDF() {
  const pdf = await pdfjsLib.getDocument({ data: pdfArray }).promise;
  const container = document.getElementById('pdfContainer');

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: window.devicePixelRatio || 1.5 });

    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    wrapper.style.position = 'relative';

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';
    wrapper.appendChild(canvas);

    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    container.appendChild(wrapper);
  }

  // Báo RN là render xong
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'PDF_READY', pages: pdf.numPages }));
}

renderPDF();

// Nhận lệnh từ RN (highlight, scroll to page, etc.)
document.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'SCROLL_TO_PAGE') {
    const pages = document.querySelectorAll('.page');
    if (pages[msg.page - 1]) pages[msg.page - 1].scrollIntoView({ behavior: 'smooth' });
  }
});
</script>
</body>
</html>`;
}
```

### React Native Component

```typescript
// src/components/PDFViewer.tsx
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

interface Props {
  pdfUri: string;
  onReady?: (pages: number) => void;
  style?: object;
}

export function PDFViewer({ pdfUri, onReady, style }: Props) {
  const [html, setHtml] = React.useState<string>('');

  React.useEffect(() => {
    (async () => {
      const base64 = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setHtml(buildPDFViewerHTML(base64));
    })();
  }, [pdfUri]);

  const handleMessage = useCallback((event: any) => {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === 'PDF_READY') onReady?.(msg.pages);
  }, [onReady]);

  return (
    <WebView
      source={{ html }}
      style={[styles.viewer, style]}
      onMessage={handleMessage}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      originWhitelist={['*']}
    />
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: '#fff' },
});
```

---

## 4. READING — TOÀN BỘ DẠNG BÀI

### Layout tổng thể Reading (Mobile)

```
┌─────────────────────────────┐
│  [←]  Reading · P1/3  [⏱]  │  ← Header: back, progress, timer
│  ████████░░░░░░ 8/40        │  ← Progress bar
├─────────────────────────────┤
│  [Passage]    [Questions]   │  ← Tab switcher (sticky)
├─────────────────────────────┤
│                             │
│  Nội dung passage / câu hỏi │  ← Scrollable content area
│  (tuỳ tab đang active)      │
│                             │
├─────────────────────────────┤
│  Q.Nav: [1][2][3][✓4][5]... │  ← Question navigator (sticky bottom)
│  [◀ Prev]    [8 answered]  [Next ▶] │
└─────────────────────────────┘
```

### Tab Switcher Pattern

```typescript
// Passage và Questions là 2 tab — dùng pager thay vì scroll tách biệt
// Giữ scroll position của cả 2 tab độc lập
const [activeTab, setActiveTab] = React.useState<'passage' | 'questions'>('passage');
const passageScrollRef = useRef<ScrollView>(null);
const questionsScrollRef = useRef<ScrollView>(null);

// Khi user nhấn vào Q-Navigator → tự động switch sang tab Questions + scroll đến câu đó
function jumpToQuestion(qId: number) {
  setActiveTab('questions');
  setTimeout(() => {
    questionRefs.current[qId]?.measureLayout(...)?.then(scrollToY);
  }, 100);
}
```

---

### R1 — True / False / Not Given (và Yes / No / Not Given)

**Đặc điểm:**
- Câu lệnh dài, cần đọc kỹ
- 3 lựa chọn cố định
- Hay nhầm giữa FALSE và NOT GIVEN

**Mobile UI:**

```
┌────────────────────────────────────────┐
│ Q4  TRUE / FALSE / NOT GIVEN           │
│                                        │
│ "Blended wines are usually cheaper."   │
│                                        │
│ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│ │  ✓ TRUE  │ │  FALSE   │ │NOT GIVEN│ │
│ │ (active) │ │          │ │         │ │
│ └──────────┘ └──────────┘ └─────────┘ │
│                                        │
│ 💡 Tip: FALSE = passage nói ngược lại  │
│         NOT GIVEN = passage không đề cập│
└────────────────────────────────────────┘
```

```typescript
// src/components/questions/TFNGQuestion.tsx
interface TFNGQuestionProps {
  question: Question;
  answer: 'TRUE' | 'FALSE' | 'NOT GIVEN' | null;
  onChange: (value: 'TRUE' | 'FALSE' | 'NOT GIVEN') => void;
  showTip?: boolean;
}

const OPTIONS = [
  { value: 'TRUE',      color: '#22C55E', bg: '#F0FDF4', label: 'TRUE' },
  { value: 'FALSE',     color: '#EF4444', bg: '#FEF2F2', label: 'FALSE' },
  { value: 'NOT GIVEN', color: '#F59E0B', bg: '#FFFBEB', label: 'NOT GIVEN' },
] as const;

// Button: full-width cho NOT GIVEN (text dài)
// Khi selected: fill bg + icon checkmark
// Khi unselected: outline mờ
// Height tối thiểu 48px (touch target)
```

---

### R2 — Multiple Choice (1 đáp án hoặc 2 đáp án)

**Đặc điểm:**
- A/B/C/D hoặc A/B/C/D/E
- Dạng chọn 2: "Choose TWO letters"
- Option text có thể dài 2-3 dòng

**Mobile UI:**

```
┌────────────────────────────────────────┐
│ Q11  MULTIPLE CHOICE                   │
│                                        │
│ "Vintage wines are..."                 │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ A  mostly better.                │   │
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │
│ │ B  often preferred.              │   │
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │← active
│ │ ✓ C  often discussed.            │   │
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │
│ │ D  more costly.                  │   │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘

Dạng chọn 2:  ┌─ "Choose TWO letters" badge đỏ ─┐
              Checkbox thay vì radio button
              Counter: "1/2 selected"
```

```typescript
// src/components/questions/MCQuestion.tsx
interface MCQuestionProps {
  question: Question;
  answer: string | string[] | null;   // string cho 1 đáp án, string[] cho 2+
  maxSelect?: number;                  // default 1
  onChange: (value: string | string[]) => void;
}

// Khi maxSelect > 1: hiển thị badge "Choose {maxSelect} letters"
// Disable unselected options khi đã đủ số lượng
// Vẫn cho bỏ chọn
```

---

### R3 — Gap Fill / Sentence Completion

**Đặc điểm:**
- Điền 1-3 từ từ passage
- "NO MORE THAN TWO WORDS AND/OR A NUMBER"
- Thường là câu có blank ở giữa hoặc cuối

**Mobile UI:**

```
┌────────────────────────────────────────┐
│ Q6   SENTENCE COMPLETION               │
│      No more than 2 words              │
│                                        │
│ "The colour of red wine is due to      │
│  _______ being in contact with the    │
│  juice during fermentation."           │
│                                        │
│  ┌────────────────────────────────┐    │
│  │ grape skin               ✕    │    │← text input
│  └────────────────────────────────┘    │
│                                        │
│  [Words: 2/2]  ← counter nếu giới hạn │
└────────────────────────────────────────┘
```

```typescript
// src/components/questions/FillBlankQuestion.tsx
// Inline blank: render câu có [___] thành Text + TextInput + Text
// maxWords enforcement: split by space, alert khi vượt
// Auto-capitalize: false
// spellCheck: false (tránh autocorrect làm hỏng đáp án)
// returnKeyType: 'next' để nhảy sang câu tiếp
```

---

### R4 — Table / Note / Summary / Flow Chart Completion

**Đặc điểm:**
- Nhiều blank trong một bảng/đoạn
- Cần nhìn cấu trúc tổng thể
- Khó render trên màn hình nhỏ

**Mobile UI — Table:**

```
┌────────────────────────────────────────┐
│ Q5-10  TABLE COMPLETION  (max 2 words) │
├───────────────┬────────────┬───────────┤
│ Classification│ Fact       │ Example   │
├───────────────┼────────────┼───────────┤
│ Colour        │ Red uses   │ [Q6____]  │
│               │ [Q5____]   │           │
├───────────────┼────────────┼───────────┤
│ Grape species │ [Q7____]   │ Cote Rotie│
│               │ or blended │           │
├───────────────┼────────────┼───────────┤
│ Location      │ Drinkers   │ Barossa   │
│               │ [Q8____]   │ Valley    │
└───────────────┴────────────┴───────────┘

→ Cho phép horizontal scroll nếu table quá rộng
→ Active cell được highlight viền xanh
→ Bàn phím hiện ra → table tự scroll để cell không bị che
```

```typescript
// src/components/questions/TableFillQuestion.tsx
// KeyboardAvoidingView bao ngoài toàn màn hình
// ScrollView horizontal cho table rộng
// Mỗi cell-input: ref để focus next khi nhấn return
// Khi focus cell: highlight row + column nhẹ để user không lạc
```

**Mobile UI — Summary Completion:**

```
┌────────────────────────────────────────┐
│ SUMMARY COMPLETION    (max 2 words)    │
│                                        │
│ "Wine was first made over (Q1)______   │
│  years ago in the (Q2)______. The      │
│  biggest wine-drinking nations today   │
│  are (Q3)______ countries."            │
│                                        │
│ ← Inline blanks trong đoạn văn        │
│    TextInput nhỏ gọn inline            │
│    Tap để focus, bàn phím hiện lên     │
└────────────────────────────────────────┘
```

---

### R5 — Matching Headings

**Đặc điểm:**
- Ghép paragraph với heading
- List headings dài (8-10 options)
- User cần đọc cả 2 bên

**Mobile UI:**

```
┌────────────────────────────────────────┐
│ Q1-6  MATCH HEADINGS TO PARAGRAPHS    │
│                                        │
│ ┌─────────────────────────────────┐    │
│ │ List of Headings:               │    │← Collapsible panel
│ │  i.   The health benefits       │    │
│ │  ii.  Historical origins        │    │
│ │  iii. Wine classification       │    │
│ │  iv.  ...                       │    │
│ │  [Show all ↓]                   │    │
│ └─────────────────────────────────┘    │
│                                        │
│ Paragraph A → [  Chọn heading  ▼]     │← Dropdown
│ Paragraph B → [ ii. Historical... ▼]  │← Selected
│ Paragraph C → [  Chọn heading  ▼]     │
│ Paragraph D → [  Chọn heading  ▼]     │
│                                        │
│ ⚠️ Mỗi heading chỉ dùng 1 lần        │← Warning khi trùng
└────────────────────────────────────────┘
```

```typescript
// src/components/questions/MatchHeadingsQuestion.tsx
// Dropdown: BottomSheet (react-native-bottom-sheet) thay vì Picker
// Đã dùng heading → disable trong dropdown của câu khác
// Highlight heading khi đã assign
// "Used: 3/6 headings" counter
```

---

### R6 — Matching Information / Features / Sentence Endings

**Mobile UI:**

```
┌────────────────────────────────────────┐
│ Q27-31  MATCH SENTENCE ENDINGS         │
│                                        │
│ "People who drink wine..."             │
│  → [  Chọn đoạn kết  ▼]               │
│                                        │
│ "The fermentation process..."          │
│  → [A. produces carbon dioxide ▼]     │← Selected
│                                        │
│ ┌─────────────────────────────────┐    │
│ │ A. produces carbon dioxide      │    │← Reference list
│ │ B. was discovered accidentally  │    │   Luôn visible
│ │ C. requires specific conditions │    │
│ └─────────────────────────────────┘    │
└────────────────────────────────────────┘
```

---

### R7 — Short Answer Questions

```
┌────────────────────────────────────────┐
│ Q14  SHORT ANSWER   (max 3 words)     │
│                                        │
│ "What do staff need in order to most  │
│  benefit a company?"                  │
│                                        │
│ ┌────────────────────────────────┐     │
│ │ appropriate development        │     │
│ └────────────────────────────────┘     │
│ Words used: 2                          │
└────────────────────────────────────────┘
```

---

## 5. LISTENING — TOÀN BỘ DẠNG BÀI

### Layout tổng thể Listening (Mobile)

```
┌─────────────────────────────────────────┐
│  [←]  Listening · S2/4      [⏱ 30:00]  │
│  ███████░░░░░░░░  12/40                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │  ← Audio Player (sticky)
│  │  ◀◀  ▶  ──●──────────── 02:14  │    │    Chiều cao cố định 72px
│  │  Section 2: Community Garden    │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Questions area (scrollable)            │  ← Auto-scroll theo section
│                                         │
├─────────────────────────────────────────┤
│  Q.Nav: [✓11][✓12][13][14][15]...       │
│  [◀ Prev]   [12 answered]   [Next ▶]   │
└─────────────────────────────────────────┘
```

### Audio Player Component

```typescript
// src/components/AudioPlayer.tsx
import { Audio } from 'expo-av';

interface AudioPlayerProps {
  audioUri: string;
  onTimeUpdate?: (seconds: number) => void;
  onSectionChange?: (sectionIndex: number) => void;
  sections: AudioSection[];      // Timestamps cho từng section
}

interface AudioSection {
  index: number;
  startTime: number;             // giây
  endTime: number;
  label: string;                 // "Section 1", "Section 2"...
}

// Features:
// - Play/Pause
// - Seekbar với preview timestamp
// - Section markers trên seekbar (dots chia 4 section)
// - Rewind 10s button (hữu ích khi nghe lại)
// - Tốc độ: 0.75x, 1x (không cho 1.25x vì IELTS không cho)
// - Hiện transcript sau khi nộp (Review mode)
// ⚠️ IELTS thật: audio chỉ nghe 1 lần — cần option "Exam mode" (disable rewind)
```

---

### L1 — Form / Note / Table / Flow Chart Completion

**Đặc điểm quan trọng nhất của Listening:** Câu hỏi xuất hiện THEO THỨ TỰ trong audio. Auto-scroll là killer feature.

**Mobile UI — Form Completion:**

```
┌────────────────────────────────────────┐
│ 🎵  ▶ ───●────────────────  01:23     │← Audio đang chạy
├────────────────────────────────────────┤
│                                        │
│ SECTION 1 · Questions 1-10             │
│ Complete the form below.               │
│ Write NO MORE THAN ONE WORD.           │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │    COMMUNITY CENTRE BOOKING      │   │
│ │                                  │   │
│ │  Name:    James (Q1) _______     │   │← Q1 active (audio ở đây)
│ │  Phone:   (Q2) _______           │   │  Viền xanh nhấp nháy
│ │  Date:    (Q3) _______           │   │
│ │  Room:    (Q4) _______           │   │
│ │  Price:   £(Q5) _______ per hour │   │
│ └──────────────────────────────────┘   │
│                                        │
│ 🔵 Câu hỏi hiện tại: Q1               │
└────────────────────────────────────────┘
```

```typescript
// Auto-scroll: audio time → active question
// Map timestamp ranges → question IDs
// Khi audio đến timestamp của Q3 → highlight Q3, scroll đến Q3
// User vẫn có thể cuộn tay bình thường

const QUESTION_TIMESTAMPS: Record<number, [number, number]> = {
  1: [0, 25],     // Q1 active từ giây 0-25
  2: [25, 48],    // Q2 active từ giây 25-48
  3: [48, 70],    // ...
};
```

---

### L2 — Multiple Choice (Listening)

```
┌────────────────────────────────────────┐
│ 🎵  ▶ ─────●──────────────  02:45     │
├────────────────────────────────────────┤
│ Q11  What is the main purpose of the   │
│      community garden project?         │
│                                        │
│  ○  A  To grow vegetables for sale     │
│  ●  B  To bring residents together     │← selected
│  ○  C  To improve the environment      │
│                                        │
│ Q12  Who originally suggested the      │
│      idea?                             │
│                                        │
│  ○  A  The town council               │
│  ○  B  Local schoolchildren           │
│  ○  C  A retired teacher              │
└────────────────────────────────────────┘
```

---

### L3 — Map / Plan / Diagram Labelling

**Đây là dạng khó nhất trên mobile** — cần pinch-to-zoom.

```
┌────────────────────────────────────────┐
│ 🎵  ▶ ──────●─────────────  03:12     │
├────────────────────────────────────────┤
│ Q21-25  Label the map below.           │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │         MAP IMAGE                │  │← Pinch to zoom
│  │   (render từ PDF page)           │  │  Markers A-F
│  │   📍A  📍B  📍C                  │  │  Tap marker → activate
│  │   📍D  📍E  📍F                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [Zoom: ─────●─────────]  Reset ↺     │
│                                        │
│ Active: Marker C                       │
│ ┌──────────────────────────────────┐   │
│ │ [  Chọn location  ▼]             │   │← BottomSheet picker
│ └──────────────────────────────────┘   │
│                                        │
│ A→[car park] B→[?] C→[?] D→[?]       │← Summary mini view
└────────────────────────────────────────┘
```

```typescript
// src/components/questions/MapLabelQuestion.tsx
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// Pinch-to-zoom: react-native-gesture-handler pinch gesture
// Pan: pan gesture khi đã zoom
// Tap marker: activate → hiện BottomSheet
// Scale: min 1.0, max 3.0

const scale = useSharedValue(1);
const savedScale = useSharedValue(1);

const pinchGesture = Gesture.Pinch()
  .onUpdate((e) => {
    scale.value = Math.min(3, Math.max(1, savedScale.value * e.scale));
  })
  .onEnd(() => {
    savedScale.value = scale.value;
  });
```

---

### L4 — Sentence Completion (Listening)

```
┌────────────────────────────────────────┐
│ Q26-30  SENTENCE COMPLETION            │
│         No more than THREE WORDS       │
│                                        │
│ Q26. The garden covers an area of      │
│      _______ square metres.            │
│      ┌───────────────────────────┐     │
│      │ 200                       │     │
│      └───────────────────────────┘     │
│                                        │
│ Q27. Plants are watered using          │
│      _______ collected from the roof.  │
│      ┌───────────────────────────┐     │
│      │                           │     │← empty
│      └───────────────────────────┘     │
│                                        │
│ ← Dòng chữ đang nói (live highlight)  │
└────────────────────────────────────────┘
```

---

## 6. WRITING — TOÀN BỘ DẠNG BÀI

### Layout tổng thể Writing (Mobile)

```
┌─────────────────────────────────────────┐
│  [←]  Writing Task 1          [⏱ 20:00] │
├─────────────────────────────────────────┤
│  [▼ Task prompt — tap to expand]        │← Collapsed mặc định
├─────────────────────────────────────────┤
│                                         │
│                                         │
│  Text editor area (full screen)         │
│                                         │
│  [Cursor blinking here...]              │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ 📝 Words: 187 / min 150  ████████░░░   │← Khi đủ: xanh / Thiếu: đỏ
│ [¶] [B] [I]  ···                        │← Formatting toolbar (minimal)
└─────────────────────────────────────────┘
```

### Task Prompt Component

```typescript
// src/components/writing/TaskPrompt.tsx
// Collapsible với LayoutAnimation
// Trạng thái ban đầu: expanded (user cần đọc đề)
// Sau 30s: tự động collapse để nhường chỗ cho editor
// User có thể pin (luôn expanded)
// Nếu có chart/image: render từ PDF bằng WebView PDFViewer
```

---

### W1 — Academic Task 1: Graph / Chart / Table / Diagram

**Đặc điểm:** Mô tả data từ biểu đồ, tối thiểu 150 từ, tốt nhất 170-190 từ.

**Mobile UI:**

```
┌─────────────────────────────────────────┐
│  Writing Task 1 · Academic   [⏱ 19:43] │
├─────────────────────────────────────────┤
│  ▼ TASK PROMPT                         │
│  ┌───────────────────────────────────┐  │
│  │ The graph shows the percentage of │  │
│  │ households with internet access   │  │
│  │ in the UK from 1998 to 2012.      │  │
│  │                                   │  │
│  │  [CHART IMAGE — from PDF]         │  │
│  │  (Pinch to zoom)                  │  │
│  └───────────────────────────────────┘  │
│  [▲ Collapse prompt]                    │
├─────────────────────────────────────────┤
│                                         │
│  The graph illustrates the changes in  │
│  internet usage among UK households    │
│  over a 14-year period.                │
│                                         │
│  Overall, there was a significant      │
│  upward trend, with access rising      │
│  from approximately 10% in 1998 to    │
│  80% by 2012.|                          │← cursor
│                                         │
├─────────────────────────────────────────┤
│ ✅ Words: 167 / min 150                 │
└─────────────────────────────────────────┘
```

---

### W2 — General Training Task 1: Letter

**Đặc điểm:** Viết thư (formal/semi-formal/informal), 3 bullet points cần cover.

```
┌─────────────────────────────────────────┐
│  Writing Task 1 · General    [⏱ 18:20] │
├─────────────────────────────────────────┤
│  ▼ TASK PROMPT                         │
│  You recently bought a laptop. Write   │
│  a letter to the manager. In your      │
│  letter:                               │
│  • ☐ explain why you bought it        │← Checklist cho 3 bullets
│  • ☐ describe the problem             │  (check khi user mention)
│  • ✓ suggest how to resolve it        │
│  Tone: Formal                          │
│  [▲ Collapse]                          │
├─────────────────────────────────────────┤
│ Dear Sir/Madam,                        │
│                                        │
│ I am writing to bring your attention  │
│ to a fault I have encountered with    │
│ a laptop I purchased...|               │
├─────────────────────────────────────────┤
│ ✅ Words: 142 / min 150  · Tone: Formal│
└─────────────────────────────────────────┘
```

```typescript
// Bullet checklist: NLP cơ bản để detect khi user đề cập bullet point
// Hoặc đơn giản hơn: user tự tick checkbox
// Tone indicator: Formal / Semi-formal / Informal (user tự chọn)
// Letter structure helper: Dear... → Yours faithfully / sincerely
```

---

### W3 — Task 2: Essay (cả Academic và General)

**Đặc điểm:** 250 từ tối thiểu, cần cấu trúc rõ ràng (Intro, Body, Conclusion).

**Mobile UI:**

```
┌─────────────────────────────────────────┐
│  Writing Task 2               [⏱ 38:01]│
├─────────────────────────────────────────┤
│  ▼ TASK PROMPT                         │
│  "Some people think that children      │
│   under 18 should receive full-time    │
│   education. To what extent do you     │
│   agree or disagree?"                  │
│  [▲ Collapse]                          │
├─────────────────────────────────────────┤
│  STRUCTURE GUIDE (collapsible)          │
│  ┌───────────────────────────────────┐  │
│  │ ☐ Introduction   (50-70w)         │  │
│  │ ☐ Body §1        (80-100w)        │  │
│  │ ☐ Body §2        (80-100w)        │  │
│  │ ☐ Conclusion     (40-50w)         │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│                                         │
│  Nowadays, the question of whether    │
│  children should spend their entire   │
│  youth in formal education is widely  │
│  debated. I believe that while some   │
│  formal education is essential...|     │
│                                         │
├─────────────────────────────────────────┤
│ ⚠️ Words: 228 / min 250                │← amber khi gần đủ
│ [Structure] [Word count] [Clear]        │
└─────────────────────────────────────────┘
```

### Writing Editor Component

```typescript
// src/components/writing/WritingEditor.tsx
import { TextInput, KeyboardAvoidingView, Platform } from 'react-native';

interface WritingEditorProps {
  value: string;
  onChange: (text: string) => void;
  minWords: number;       // 150 (Task 1) hoặc 250 (Task 2)
  task: WritingTask;
}

// Word counter: text.trim().split(/\s+/).filter(Boolean).length
// Màu word count:
//   < minWords * 0.8  → red  (#EF4444)
//   < minWords        → amber (#F59E0B)
//   >= minWords       → green (#22C55E)
//   > minWords * 1.5  → amber (quá dài cũng không tốt)

// Auto-save: debounce 2s → AsyncStorage
// Undo/Redo: giữ stack 20 states
// Font: Georgia 16px, lineHeight 26 → dễ đọc như bản thật

// KeyboardAvoidingView:
//   iOS: behavior="padding"
//   Android: behavior="height"
// + ScrollView để content không bị che bởi bàn phím
```

### Formatting Toolbar (Minimal)

```typescript
// Chỉ cần những tool sau (IELTS là plain text, không cần nhiều):
// [¶]    → Insert paragraph break
// [—]    → Insert em-dash
// [Word] → Word count popup
// [···]  → More: Clear, Select All, Copy

// KHÔNG cần: Bold, Italic, Bullet list
// IELTS writing là plain prose
```

---

## 7. SHARED COMPONENTS

### 7.1 Question Navigator Bar

```typescript
// src/components/shared/QuestionNavigator.tsx
// Hiển thị dưới bottom của màn hình exam
// Mỗi dot = 1 câu hỏi
// States:
//   unanswered:  viền xám, nền trắng
//   answered:    nền xanh lá nhạt, viền xanh
//   flagged:     icon cờ vàng
//   active:      nền navy, chữ trắng
//   answered+active: nền xanh đậm
// Horizontal ScrollView nếu nhiều hơn 10 câu
// Long-press dot → toggle flag
// Tap dot → jump to question
```

### 7.2 Exam Timer

```typescript
// src/components/shared/ExamTimer.tsx
// Đếm ngược, hiển thị MM:SS
// Màu sắc:
//   > 5 phút:    text thường
//   1-5 phút:    amber + pulse animation
//   < 1 phút:    red + shake animation
// Tap để ẩn/hiện (tránh stress)
// Cảnh báo:
//   30 phút còn lại → toast
//   5 phút còn lại  → modal warning
//   Hết giờ         → auto-submit với confirmation
```

### 7.3 Section Header

```typescript
// src/components/shared/SectionHeader.tsx
// Hiển thị: "Section 2 · Questions 11-20"
// Instruction text (collapsible sau lần đầu đọc)
// Skill-specific color accent
```

### 7.4 Answer Review Sheet

```typescript
// src/screens/ExamReviewScreen.tsx
// Grid overview tất cả câu hỏi
// Tap câu → jump về chỉnh sửa
// "Flagged (3)" section riêng
// "Unanswered (2)" warning
// Submit button (disabled nếu còn unanswered với warning)
```

### 7.5 Bottom Sheet (dùng cho Matching)

```typescript
// Dùng @gorhom/bottom-sheet cho các modal chọn lựa
// Thay thế Picker của RN (UX kém)
// Snap points: ['40%', '70%']
// Backdrop blur nhẹ
// Search bar khi list > 6 items
```

---

## 8. DATA SCHEMA TỔNG QUÁT

### Question Schema

```typescript
type QuestionType =
  // Reading
  | 'tfng'              // True/False/Not Given
  | 'ynng'              // Yes/No/Not Given
  | 'mc_single'         // Multiple Choice 1 answer
  | 'mc_multiple'       // Multiple Choice 2+ answers
  | 'fill_blank'        // Gap fill inline
  | 'table_fill'        // Table completion
  | 'summary_fill'      // Summary completion
  | 'note_fill'         // Note completion
  | 'flowchart_fill'    // Flow chart completion
  | 'match_heading'     // Match headings
  | 'match_feature'     // Match features/information
  | 'match_ending'      // Match sentence endings
  | 'short_answer'      // Short answer
  // Listening (share nhiều type với Reading)
  | 'form_fill'         // Form completion
  | 'map_label'         // Map/plan/diagram labelling
  // Writing
  | 'essay'             // Free text essay
  | 'letter';           // Free text letter

interface BaseQuestion {
  id: number;
  type: QuestionType;
  text: string;
  answer?: string | string[];     // Đáp án đúng (undefined khi chưa có)
  marks?: number;                 // Số điểm (default 1)
  pdfPageRef?: number;            // Trang PDF liên quan
  audioTimestamp?: [number, number]; // [start, end] giây cho Listening
}

interface MCQuestion extends BaseQuestion {
  type: 'mc_single' | 'mc_multiple';
  options: string[];
  maxSelect?: number;
}

interface FillQuestion extends BaseQuestion {
  type: 'fill_blank' | 'table_fill' | 'summary_fill' | 'form_fill';
  maxWords: 1 | 2 | 3;
  contextBefore?: string;     // Phần text trước blank
  contextAfter?: string;      // Phần text sau blank
}

interface MatchQuestion extends BaseQuestion {
  type: 'match_heading' | 'match_feature' | 'match_ending';
  items: string[];            // List câu/đoạn cần ghép
  options: { id: string; text: string }[];  // Pool để chọn
}

interface MapLabelQuestion extends BaseQuestion {
  type: 'map_label';
  imagePageIndex: number;     // Trang trong PDF chứa map
  markers: {
    id: string;               // "A", "B", "C"...
    x: number;                // % position trên image
    y: number;
  }[];
  options: string[];
}

interface WritingQuestion extends BaseQuestion {
  type: 'essay' | 'letter';
  taskType: 1 | 2;
  minWords: number;
  bulletPoints?: string[];    // Task 1 letter bullets
  writingType?: 'academic' | 'general';
  imagePageIndex?: number;    // Cho Task 1 Academic (chart image)
}

type Question = MCQuestion | FillQuestion | MatchQuestion | MapLabelQuestion | WritingQuestion | BaseQuestion;
```

### Exam Schema

```typescript
interface Exam {
  id: string;
  title: string;
  skill: 'reading' | 'listening' | 'writing' | 'speaking';
  durationMinutes: number;
  pdfUri?: string;
  audioUri?: string;
  sections: Section[];
}

interface Section {
  id: string;
  title: string;               // "Section 1", "Passage 1"...
  instruction?: string;
  questionRange: [number, number]; // [firstQ, lastQ]
  questions: Question[];
  pdfPages?: [number, number]; // [startPage, endPage]
  audioTimestamp?: [number, number];
}
```

---

## 9. PHASE BREAKDOWN

| Phase | Nội dung | Expo/RN libs | Thời gian |
|-------|----------|-------------|-----------|
| **0** | Project setup, theme, navigation shell | expo-router / react-navigation | 0.5 ngày |
| **1** | PDF Viewer với pdfjs-dist + WebView | react-native-webview, expo-file-system | 1–2 ngày |
| **2** | Shared: Timer, Q-Navigator, Section Header | expo-haptics | 0.5 ngày |
| **3** | Reading: TFNG + MC + Fill Blank | — | 1 ngày |
| **4** | Reading: Table/Summary Fill + Match Headings | @gorhom/bottom-sheet | 1 ngày |
| **5** | Reading: Match Features + Map Label | react-native-gesture-handler, reanimated | 1.5 ngày |
| **6** | Listening: Audio Player + auto-scroll | expo-av | 1.5 ngày |
| **7** | Listening: Form Fill + Map Label (audio sync) | — | 1 ngày |
| **8** | Writing: Editor + Word Counter + Task Prompt | — | 1 ngày |
| **9** | Writing: Task 1 chart zoom + Letter bullets | — | 1 ngày |
| **10** | Review Sheet + Submit flow + Results screen | — | 1 ngày |
| **11** | Auto-save + Offline support | expo-sqlite / AsyncStorage | 1 ngày |
| **12** | Polish: animations, haptics, accessibility | expo-haptics, reanimated | 1–2 ngày |
| **Tổng** | | | **~13–16 ngày** |

### Dependencies cần install

```bash
# PDF + WebView
npx expo install react-native-webview expo-file-system

# Gesture + Animation (Map Label, smooth UX)
npx expo install react-native-gesture-handler react-native-reanimated

# Bottom Sheet (Matching questions)
npm install @gorhom/bottom-sheet

# Audio (Listening)
npx expo install expo-av

# Haptics
npx expo install expo-haptics

# Storage (auto-save writing)
npx expo install @react-native-async-storage/async-storage

# Navigation
npx expo install expo-router
```

### Thứ tự ưu tiên để demo nhanh

```
Phase 0 → 1 (PDF) → 3 (Reading basics) → 6 (Audio) → 8 (Writing)
Demo được 3 skill → sau đó làm các dạng bài phức tạp (Map, Match)
```

---

*Tài liệu cover: 7 dạng Reading · 4 dạng Listening · 3 dạng Writing · 5 shared components · Full data schema · 12-phase roadmap.*
