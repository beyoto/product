import GppGoodIcon from '@mui/icons-material/GppGood';
import DiamondIcon from '@mui/icons-material/Diamond';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import './TrustBadges.css';

function TrustBadges() {
  return (
    <div className="trust-badges">
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <GppGoodIcon />
        </div>
        <p>Гарантия качества</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <LocalShippingIcon />
        </div>
        <p>Бережная доставка</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <DiamondIcon />
        </div>
        <p>Подбор идеального кольца</p>
      </div>
    </div>
  );
}

export default TrustBadges;
