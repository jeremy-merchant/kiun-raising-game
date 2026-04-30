import { GameState } from "../types/game";

interface GalleryPanelProps {
  state: GameState;
  onSelectGallery: (id: string) => void;
}

export function GalleryPanel({ state, onSelectGallery }: GalleryPanelProps) {
  return (
    <section className="card section-card">
      <div className="section-title-row">
        <h2>비주얼 갤러리</h2>
        <span className="section-subtle">실사 + 도트 + 감정 시트 + UI 컨셉</span>
      </div>

      <div className="gallery-grid">
        {state.gallery.map((image) => {
          const active = image.id === state.selectedGalleryId;
          return (
            <button
              key={image.id}
              className={`gallery-card ${active ? "active" : ""}`}
              onClick={() => onSelectGallery(image.id)}
            >
              <img
                src={image.src}
                alt={image.label}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/assets/kiun/real-1.jpg";
                }}
              />
              <div className="gallery-card-body">
                <strong>{image.label}</strong>
                <span>{image.category}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
