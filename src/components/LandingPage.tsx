import React, { useEffect, useRef, useState } from 'react';

export function LandingPage({ onStart }: { onStart: () => void }) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const videos = [
    '/src/video/2711276-uhd_3840_2160_24fps.mp4',
    '/src/video/2231801-uhd_3840_2160_30fps.mp4',
    '/src/video/5171156-uhd_3840_2160_30fps.mp4'
  ];

  useEffect(() => {
    const switchToNextVideo = () => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    };

    videoRefs.current.forEach((video, index) => {
      if (video) {
        video.addEventListener('ended', switchToNextVideo);
        video.addEventListener('error', () => {
          console.log(`Erreur de chargement de la vidéo ${index + 1}`);
          switchToNextVideo();
        });
      }
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) {
          video.removeEventListener('ended', switchToNextVideo);
        }
      });
    };
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentVideoIndex) {
          video.classList.add('active');
          video.play();
        } else {
          video.classList.remove('active');
        }
      }
    });
  }, [currentVideoIndex]);

  return (
    <div className="landing-page">
      <style jsx>{`
        .landing-page {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .hero-container {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        .background-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          animation: zoomIn 30s ease-in-out infinite alternate;
          filter: brightness(0.8) contrast(1.1);
          opacity: 0;
          transition: opacity 2s ease-in-out;
        }

        .background-video.active {
          opacity: 1;
        }

        @keyframes zoomIn {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.05);
          }
        }

        .dark-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7));
          z-index: 2;
        }

        .content-container {
          position: relative;
          z-index: 10;
          display: flex;
          height: 100vh;
          align-items: flex-end;
          justify-content: flex-start;
          padding: 4rem 2rem;
        }

        .content {
          max-width: 600px;
          text-align: left;
          animation: fadeInUp 0.8s ease-out;
        }

        .rating-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .rating-icons {
          display: flex;
          gap: 0.2rem;
        }

        .rating-icon {
          width: 16px;
          height: 16px;
          background: #ffd700;
          border-radius: 50%;
        }

        .title {
          color: white;
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.1;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .subtitle {
          color: white;
          font-size: 1.2rem;
          font-weight: 400;
          margin-bottom: 2.5rem;
          line-height: 1.5;
          opacity: 0.95;
        }

        .button-container {
          animation: fadeInUp 0.8s ease-out 0.3s both;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .start-button {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: #ffd700;
          color: #1a1a1a;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 160px;
          justify-content: center;
        }

        .secondary-button {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: transparent;
          color: white;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border: 2px solid #ffd700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 160px;
          justify-content: center;
        }

        .start-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
          background: #ffed4e;
        }

        .secondary-button:hover {
          transform: scale(1.05);
          background: rgba(255, 215, 0, 0.1);
          border-color: #ffed4e;
        }

        .start-button:active {
          transform: scale(1.02);
        }

        .button-text {
          position: relative;
          z-index: 10;
          color: white;
          font-size: 1rem;
        }

        .button-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.2);
          transform: scale(0);
          opacity: 0;
          transition: all 0.4s ease;
        }

        .start-button:hover .button-overlay {
          transform: scale(1.5);
          opacity: 1;
        }

        .gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, transparent, rgba(0, 0, 0, 0.3));
          z-index: 3;
          animation: fadeIn 1.5s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          text-decoration: none;
        }

        .header-buttons {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .header-button {
          background: #ffd700;
          color: #1a1a1a;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .header-button:hover {
          background: #ffed4e;
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .title {
            font-size: 2.5rem;
          }
          
          .subtitle {
            font-size: 1.25rem;
          }
          
          .start-button, .secondary-button {
            padding: 1rem 1.5rem;
            font-size: 0.9rem;
            min-width: 140px;
          }

          .button-container {
            flex-direction: column;
            gap: 0.75rem;
          }

          .header {
            padding: 1rem;
          }

          .header-button {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .title {
            font-size: 2rem;
          }
          
          .subtitle {
            font-size: 1.125rem;
          }
          
          .content {
            padding: 1rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <a href="/" className="logo">Affréteur IA</a>
      </div>

      <div className="hero-container">
        {videos.map((videoSrc, index) => (
          <video
            key={index}
            ref={(el) => (videoRefs.current[index] = el)}
            className={`background-video ${index === 0 ? 'active' : ''}`}
            autoPlay
            muted
            playsInline
            loop={false}
          >
            <source src={videoSrc} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        ))}
        
        <div className="dark-overlay"></div>
        <div className="gradient-overlay"></div>

        <div className="content-container">
          <div className="content">
            {/* Rating Section */}
            <div className="rating-section">
              <div className="rating-icons">
                <div className="rating-icon"></div>
                <div className="rating-icon"></div>
                <div className="rating-icon"></div>
                <div className="rating-icon"></div>
                <div className="rating-icon"></div>
              </div>
              <span>350+ transporteurs satisfaits</span>
            </div>
            
            <h1 className="title">
              Trouvez le transporteur idéal pour vos marchandises
            </h1>
            
            <p className="subtitle">
              Libérez de l'espace, récupérez votre trésorerie et valorisez vos transports en toute simplicité
            </p>

            {/* Button Container */}
            <div className="button-container">
              <button className="start-button" onClick={onStart}>
                <span className="button-text">Commencer</span>
              </button>
              <button className="secondary-button">
                <span className="button-text">En savoir plus</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
