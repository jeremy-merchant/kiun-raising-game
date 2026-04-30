import { GameState } from "../types/game";

interface CharacterStageProps {
  state: GameState;
  onRotateQuote: () => void;
}

export function CharacterStage({ state, onRotateQuote }: CharacterStageProps) {
  const selectedImage =
    state.gallery.find((item) => item.id === state.selectedGalleryId) ?? state.gallery[0];

  return (
    <section className="card stage-card">
      <div className="stage-top">
        <div>
          <div className="eyebrow">대표 캐릭터 뷰</div>
          <h2>{selectedImage.label}</h2>
          <p className="muted">{selectedImage.description}</p>
        </div>
        <button className="secondary-button" onClick={onRotateQuote}>
          오늘의 한마디 바꾸기
        </button>
      </div>

      <div className="stage-main">
        <div className="stage-image-wrap">
          <img
            src={selectedImage.src}
            alt={selectedImage.label}
            className="stage-image"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/assets/kiun/real-1.jpg";
            }}
          />
        </div>

        <div className="stage-info">
          <div className="speech-bubble">{state.currentStatus}</div>

          <div className="quote-box">
            <div className="eyebrow">오늘의 한마디</div>
            <p>{state.currentQuote}</p>
          </div>

          <div className="profile-box">
            <h3>이기운 캐릭터 해석</h3>
            <p>{state.profile.description}</p>
          </div>

          <div className="tag-group">
            {state.profile.styleKeywords.map((keyword) => (
              <span key={keyword} className="tag">
                #{keyword}
              </span>
            ))}
          </div>

          <div className="mini-grid">
            <div className="mini-card">
              <strong>나이 무드</strong>
              <span>{state.profile.ageText}</span>
            </div>
            <div className="mini-card">
              <strong>최근 행동</strong>
              <span>{state.lastActivity ? state.lastActivity : "아직 없음"}</span>
            </div>
            <div className="mini-card">
              <strong>좋아하는 것</strong>
              <span>{state.profile.favorites.slice(0, 3).join(", ")}</span>
            </div>
            <div className="mini-card">
              <strong>현재 업적 수</strong>
              <span>{state.achievements.length}개</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
