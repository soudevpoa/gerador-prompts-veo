import React from 'react';

const StoryboardView = ({ data }: { data: any }) => {
  if (!data || !data.roteiro) return null;

  return (
    <div className="storyboard-container">
      <h2>Storyboard do seu novo vídeo</h2>
      <p className="visual-guide"><strong>Guia Visual:</strong> {data.promptVisual}</p>
      
      <div className="scenes-grid">
        {data.roteiro.map((cena: any, index: number) => (
          <div key={index} className="scene-card">
            <span className="scene-number">Cena {index + 1}</span>
            <div className="scene-content">
              <p><strong>Visual:</strong> {cena.visual || cena}</p>
              <p className="audio-text"><em>Locução: {cena.audio || "Narrador"}</em></p>
            </div>
          </div>
        ))}
      </div>

      <div className="final-script">
        <h3>Locução Completa</h3>
        <p>{data.locucaoTexto}</p>
      </div>
    </div>
  );
};

export default StoryboardView;