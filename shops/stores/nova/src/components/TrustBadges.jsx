import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import SpaIcon from '@mui/icons-material/Spa';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import './TrustBadges.css';

function TrustBadges() {
  return (
    <div className="trust-badges">
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <LocalFloristIcon />
        </div>
        <p>Цветы на любой вкус</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <SpaIcon />
        </div>
        <p>Нежные оттенки и ароматы</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <FavoriteBorderIcon />
        </div>
        <p>Цветы для особенных моментов</p>
      </div>
    </div>
  );
}

export default TrustBadges;
