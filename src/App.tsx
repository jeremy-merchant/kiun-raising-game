import "./index.css";
import { ActionPanel } from "./components/ActionPanel";
import { CharacterStage } from "./components/CharacterStage";
import { GalleryPanel } from "./components/GalleryPanel";
import { InventoryPanel } from "./components/InventoryPanel";
import { LogPanel } from "./components/LogPanel";
import { StatPanel } from "./components/StatPanel";
import { TopBar } from "./components/TopBar";
import { useKiunGame } from "./hooks/useKiunGame";

function App() {
  const {
    state,
    availableActivities,
    performActivity,
    selectGallery,
    rotateQuote,
    resetGame,
  } = useKiunGame();

  return (
    <div className="app-shell">
      <TopBar state={state} />

      <div className="main-grid">
        <aside className="left-column">
          <StatPanel state={state} />
          <LogPanel state={state} />
        </aside>

        <main className="center-column">
          <CharacterStage state={state} onRotateQuote={rotateQuote} />
          <ActionPanel activities={availableActivities} onPerformActivity={performActivity} />
        </main>

        <aside className="right-column">
          <GalleryPanel state={state} onSelectGallery={selectGallery} />
          <InventoryPanel state={state} />
        </aside>
      </div>

      <footer className="footer-bar card">
        <div className="footer-left">
          <div>
            <div className="eyebrow">프로젝트 방향</div>
            <strong>이기운의 특징을 반영한 육성형 시뮬레이션</strong>
          </div>
          <p className="muted">
            차분함, 몰입, 커피, 독서, 코딩, 음악, 정돈된 공간감, 검정 계열 스타일을
            핵심 키워드로 설계됨.
          </p>
        </div>

        <div className="footer-actions">
          <button className="secondary-button" onClick={rotateQuote}>
            한마디 새로고침
          </button>
          <button className="danger-button" onClick={resetGame}>
            저장 초기화
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
