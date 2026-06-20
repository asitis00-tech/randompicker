# 🎉 교실 랜덤 추첨기

교실 TV, 전자칠판, 빔프로젝터에서 사용하기 좋은 랜덤 학생 추첨 웹앱입니다.

학생 이름을 한 번에 붙여넣거나 Excel 파일을 불러와 등록할 수 있으며, 추첨 시 두근두근 애니메이션과 효과음, 색종이 효과를 제공합니다.

---

## ✨ 주요 기능

### 👨‍🎓 학생 등록

- 여러 명 이름 한 번에 붙여넣기
- Excel 복사 → 붙여넣기 지원
- TXT / CSV / XLS / XLSX 파일 불러오기 지원
- 중복 이름 자동 제거

### 🎲 랜덤 추첨

- 3 → 2 → 1 카운트다운
- 이름이 빠르게 바뀌는 추첨 연출
- 추첨 중 효과음
- 당첨 시 "띠링" 효과음
- 당첨 시 화면 플래시 효과
- 색종이(Confetti) 폭발 효과

### 📋 당첨자 관리

- 한 번 뽑힌 학생 자동 제외
- 당첨자 목록 표시
- 남은 후보 수 표시
- 초기화 버튼으로 전체 복원

### 📺 TV 모드

- 전체화면 지원
- 큰 글씨
- 높은 가독성
- 교실 TV / 전자칠판 최적화

---

## 🖥️ 화면 예시

### 메인 화면

- 학생 등록
- 파일 불러오기
- 랜덤 추첨
- 전체화면
- 초기화

### 추첨 화면

```text
3
2
1

추첨 시작!
```

↓

```text
김민준
이서연
박지후
최하린
...
```

↓

```text
🎉 당첨 🎉

김민준
```

---

## 🚀 설치

### 1. 프로젝트 생성

```bash
npm create vite@latest
```

### 2. 의존성 설치

```bash
npm install
npm install framer-motion lucide-react xlsx
```

### 3. 컴포넌트 추가

`src/RandomClassPicker.tsx`

파일에 소스코드를 넣습니다.

### 4. App.tsx 수정

```tsx
import RandomClassPicker from './RandomClassPicker';

function App() {
  return <RandomClassPicker />;
}

export default App;
```

### 5. 실행

```bash
npm run dev
```

---

## 📦 사용 기술

- React
- TypeScript
- Framer Motion
- Lucide React
- SheetJS (xlsx)

---

## 🎨 디자인

- 배경색: Pink Theme
- 폰트: Pretendard
- 반응형 UI
- 대형 화면 최적화

---

## 📁 지원 파일 형식

| 형식 | 지원 |
|--------|--------|
| TXT | ✅ |
| CSV | ✅ |
| XLS | ✅ |
| XLSX | ✅ |

---

## 🏫 활용 예시

- 발표자 뽑기
- 청소 당번 뽑기
- 모둠 대표 뽑기
- 퀴즈 참여자 뽑기
- 행사 추첨

---

## 📄 라이선스

MIT License

---

Made with ❤️ for Teachers & Students
